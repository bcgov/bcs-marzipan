import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, inArray, sql } from 'drizzle-orm';

import {
  activities,
  activityStatuses,
  dateStatuses,
  timeStatuses,
} from '@corpcal/database/schema';
import {
  CALENDAR_SYSTEM_USER_ID,
  shouldRunCompletionJob,
  toPacificHourMinute,
  type ActivityStatusName,
} from '@corpcal/shared';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';

const ADVISORY_LOCK_KEY = 900_100;

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
   * the current Pacific wall time matches the configured cadence.
   */
  @Cron('0 0,15,30,45 * * * *')
  async onTick(): Promise<void> {
    if (this.inFlight) return;

    const now = Date.now();
    const { schedule, bufferMinutes } =
      await this.applicationSettings.getCompletionSettings();
    const { hour, minute } = toPacificHourMinute(now);

    if (!shouldRunCompletionJob(schedule, bufferMinutes, hour, minute)) {
      return;
    }

    this.logger.log(
      `Completion tick matched (schedule=${schedule}, buffer=${bufferMinutes}, PT ${hour}:${String(minute).padStart(2, '0')})`
    );

    await this.runBatch();
  }

  /**
   * Run the completion batch. Used by the cron tick and the manual "run now" endpoint.
   * Acquires a Postgres advisory lock so only one pod executes per invocation.
   */
  async runBatch(): Promise<{ updated: number; skipped: boolean }> {
    if (this.inFlight) {
      return { updated: 0, skipped: true };
    }
    this.inFlight = true;
    const start = Date.now();

    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const [lockResult] = await tx.execute(
          sql`SELECT pg_try_advisory_xact_lock(${ADVISORY_LOCK_KEY}) AS acquired`
        );
        if (!(lockResult as { acquired: boolean }).acquired) {
          this.logger.debug(
            'Completion job: another pod holds the advisory lock — skipping'
          );
          return { updated: 0, skipped: true };
        }

        const { bufferMinutes } =
          await this.applicationSettings.getCompletionSettings();

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
      return { updated: 0, skipped: false };
    } finally {
      this.inFlight = false;
    }
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
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    bufferMinutes: number
  ): Promise<number> {
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
      return 0;
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
      return 0;
    }

    // Build the effective-end expression in SQL (Pacific = UTC-7).
    // Timed: (end_date || 'T' || end_time || '-07:00')::timestamptz
    // All-day: (end_date::date + 1)::timestamp AT TIME ZONE 'UTC-7'
    // We use now() >= effective_end + buffer to match the shared helper.
    const bufferInterval = sql.raw(`'${bufferMinutes} minutes'::interval`);

    const candidates = await tx
      .select({
        id: activities.id,
        activityStatusId: activities.activityStatusId,
      })
      .from(activities)
      .where(
        and(
          eq(activities.activityStatusId, reviewedStatus.id),
          eq(activities.dateStatusId, confirmedDate.id),
          eq(activities.timeStatusId, confirmedTime.id),
          // Effective end + buffer is in the past
          sql`CASE
            WHEN ${activities.isAllDay} THEN
              (${activities.endDate}::date + 1)::timestamp + INTERVAL '7 hours' + ${bufferInterval} <= now()
            ELSE
              ${activities.endDate} IS NOT NULL
              AND ${activities.endTime} IS NOT NULL
              AND (${activities.endDate} || 'T' || ${activities.endTime} || '-07:00')::timestamptz + ${bufferInterval} <= now()
          END`
        )
      );

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
}
