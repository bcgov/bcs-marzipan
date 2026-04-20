import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, count, eq, inArray, sql } from 'drizzle-orm';

import {
  activities,
  activityStatuses,
  dateStatuses,
  timeStatuses,
} from '@corpcal/database/schema';
import {
  ACTIVITY_COMPLETION_JOB_ADVISORY_CLASS,
  ACTIVITY_COMPLETION_JOB_ADVISORY_KEY,
  CALENDAR_SYSTEM_USER_ID,
  shouldRunCompletionJob,
  toPacificHourMinute,
  type ActivityCompletionBatchRunResult,
  type ActivityStatusName,
} from '@corpcal/shared';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';

const PREVIEW_LIST_LIMIT = 500;

@Injectable()
export class ActivityCompletionJobService {
  private readonly logger = new Logger(ActivityCompletionJobService.name);
  private inFlight = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  /**
   * Quarter-hour cron tick. Loads settings and returns early unless
   * the current Pacific wall time matches the configured cadence (or cadence is
   * every 15 minutes, which runs on every tick). Logs at debug level when the
   * cadence does not match so operators can confirm ticks without a matching run.
   */
  @Cron('0 0,15,30,45 * * * *')
  async onTick(): Promise<void> {
    const now = Date.now();
    const { schedule, bufferMinutes } =
      await this.applicationSettings.getCompletionSettings();
    const { hour, minute } = toPacificHourMinute(now);

    if (!shouldRunCompletionJob(schedule, bufferMinutes, hour, minute)) {
      this.logger.debug(
        `Completion tick skipped: schedule=${schedule}, buffer=${bufferMinutes}, PT ${hour}:${String(minute).padStart(2, '0')} (cadence did not match)`
      );
      return;
    }

    if (this.inFlight) {
      this.logger.warn(
        `Completion tick matched (schedule=${schedule}, buffer=${bufferMinutes}, PT ${hour}:${String(minute).padStart(2, '0')}) but batch already in flight on this pod — skipping`
      );
      return;
    }

    this.logger.log(
      `Completion tick matched (schedule=${schedule}, buffer=${bufferMinutes}, PT ${hour}:${String(minute).padStart(2, '0')})`
    );

    const result = await this.runBatch();
    if (
      result.skipped &&
      (result.skipReason === 'in_flight' ||
        result.skipReason === 'advisory_lock')
    ) {
      this.logger.warn(
        `Completion tick matched but batch was skipped (${result.skipReason})`
      );
    }
  }

  /**
   * Run the completion batch. Used by the cron tick and the manual "run now" endpoint.
   * Acquires a Postgres advisory lock so only one pod executes per invocation.
   *
   * **Connection pool:** All database work inside the transaction must use the `tx`
   * executor (including `getCompletionSettings(tx)`). Calling `DatabaseService.db`
   * while this transaction holds a pooled connection can deadlock a small pool (`max: 1`).
   */
  async runBatch(): Promise<ActivityCompletionBatchRunResult> {
    if (this.inFlight) {
      return { updated: 0, skipped: true, skipReason: 'in_flight' };
    }
    this.inFlight = true;
    const start = Date.now();

    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const [lockResult] = await tx.execute(
          sql`SELECT pg_try_advisory_xact_lock(${ACTIVITY_COMPLETION_JOB_ADVISORY_CLASS}::integer, ${ACTIVITY_COMPLETION_JOB_ADVISORY_KEY}::integer) AS acquired`
        );
        if (!(lockResult as { acquired: boolean }).acquired) {
          this.logger.debug(
            'Completion job: another session holds the completion advisory lock — skipping'
          );
          return { updated: 0, skipped: true, skipReason: 'advisory_lock' };
        }

        const { bufferMinutes } =
          await this.applicationSettings.getCompletionSettings(tx);

        const updated = await this.completeEligibleActivities(
          tx,
          bufferMinutes
        );

        const elapsed = Date.now() - start;
        this.logger.log(
          `Completion job finished: ${updated} activity(s) completed in ${elapsed}ms`
        );
        return { updated, skipped: false };
      });
    } catch (err) {
      this.logger.error(
        'Completion job failed',
        err instanceof Error ? err.stack : String(err)
      );
      return { updated: 0, skipped: true, skipReason: 'error' };
    } finally {
      this.inFlight = false;
    }
  }

  /**
   * Preview activities that would be completed by the next automated batch,
   * using the same eligibility rules and buffer as persisted settings (read-only).
   */
  async previewEligibleActivities(): Promise<{
    count: number;
    items: Array<{ displayId: string | null; title: string }>;
    listTruncated: boolean;
  }> {
    const { bufferMinutes } =
      await this.applicationSettings.getCompletionSettings();

    const lookups = await this.loadAutomationCompletionLookups(
      this.databaseService.db,
      bufferMinutes
    );
    if (!lookups) {
      return { count: 0, items: [], listTruncated: false };
    }

    const { whereClause } = lookups;

    const [countRow] = await this.databaseService.db
      .select({ n: count() })
      .from(activities)
      .where(whereClause);

    const total = Number(countRow?.n ?? 0);

    const rows = await this.databaseService.db
      .select({
        displayId: activities.displayId,
        title: activities.title,
      })
      .from(activities)
      .where(whereClause)
      .limit(PREVIEW_LIST_LIMIT + 1);

    const listTruncated = rows.length > PREVIEW_LIST_LIMIT;
    const items = (
      listTruncated ? rows.slice(0, PREVIEW_LIST_LIMIT) : rows
    ).map((r) => ({
      displayId: r.displayId,
      title: r.title,
    }));

    return { count: total, items, listTruncated };
  }

  /**
   * Find and update all activities eligible for automated completion.
   *
   * Eligibility (automation):
   *   - activity_statuses.name = 'reviewed'
   *   - date_statuses.name = 'confirmed' AND time_statuses.name = 'confirmed'
   *   - now >= effectiveEnd + buffer
   */
  private async completeEligibleActivities(
    tx: DrizzleDbExecutor,
    bufferMinutes: number
  ): Promise<number> {
    const lookups = await this.loadAutomationCompletionLookups(
      tx,
      bufferMinutes
    );
    if (!lookups) {
      return 0;
    }

    const { whereClause, completedStatus } = lookups;

    const candidates = await tx
      .select({
        id: activities.id,
        activityStatusId: activities.activityStatusId,
      })
      .from(activities)
      .where(whereClause);

    if (candidates.length === 0) return 0;

    const candidateIds = candidates.map((c) => c.id);
    const now = new Date();

    await tx
      .update(activities)
      .set({
        activityStatusId: completedStatus.id,
        lastUpdatedBy: CALENDAR_SYSTEM_USER_ID,
        lastUpdatedDateTime: now,
      })
      .where(inArray(activities.id, candidateIds));

    // Record history for each transitioned activity
    for (const candidate of candidates) {
      await this.activityHistoryService.recordChange(
        candidate.id,
        CALENDAR_SYSTEM_USER_ID,
        'completed',
        [
          {
            field: 'activityStatusId',
            oldValue: candidate.activityStatusId,
            newValue: completedStatus.id,
          },
        ],
        'Automated: activity completed by scheduled job',
        tx
      );
    }

    return candidates.length;
  }

  private async loadAutomationCompletionLookups(
    tx: DrizzleDbExecutor,
    bufferMinutes: number
  ): Promise<{
    whereClause: ReturnType<typeof and>;
    reviewedStatus: { id: number };
    completedStatus: { id: number };
  } | null> {
    const [reviewedStatus] = await tx
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'reviewed' satisfies ActivityStatusName))
      .limit(1);

    const [completedStatus] = await tx
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(
        eq(activityStatuses.name, 'completed' satisfies ActivityStatusName)
      )
      .limit(1);

    if (!reviewedStatus || !completedStatus) {
      this.logger.warn(
        'Could not resolve reviewed/completed status IDs — skipping'
      );
      return null;
    }

    const [confirmedDate] = await tx
      .select({ id: dateStatuses.id })
      .from(dateStatuses)
      .where(eq(dateStatuses.name, 'confirmed'))
      .limit(1);

    const [confirmedTime] = await tx
      .select({ id: timeStatuses.id })
      .from(timeStatuses)
      .where(eq(timeStatuses.name, 'confirmed'))
      .limit(1);

    if (!confirmedDate || !confirmedTime) {
      this.logger.warn(
        'Could not resolve confirmed date/time status IDs — skipping'
      );
      return null;
    }

    const bufferInterval = sql.raw(`'${bufferMinutes} minutes'::interval`);

    const whereClause = and(
      eq(activities.activityStatusId, reviewedStatus.id),
      eq(activities.dateStatusId, confirmedDate.id),
      eq(activities.timeStatusId, confirmedTime.id),
      sql`CASE
        WHEN ${activities.isAllDay} THEN
          (${activities.endDate}::date + 1)::timestamp + INTERVAL '7 hours' + ${bufferInterval} <= now()
        ELSE
          ${activities.endDate} IS NOT NULL
          AND ${activities.endTime} IS NOT NULL
          AND (${activities.endDate} || 'T' || ${activities.endTime} || '-07:00')::timestamptz + ${bufferInterval} <= now()
      END`
    );

    return { whereClause, reviewedStatus, completedStatus };
  }
}
