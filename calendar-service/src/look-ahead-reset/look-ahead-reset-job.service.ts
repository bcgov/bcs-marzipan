import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, count, inArray, isNotNull, ne, sql } from 'drizzle-orm';

import { activities } from '@corpcal/database/schema';
import {
  CALENDAR_SYSTEM_USER_ID,
  computeLookAheadResetWindow,
  LOOK_AHEAD_RESET_CRON_TIMEZONE,
  LOOK_AHEAD_RESET_CRON_UTC,
  LOOK_AHEAD_RESET_JOB_ADVISORY_CLASS,
  LOOK_AHEAD_RESET_JOB_ADVISORY_KEY,
  type LookAheadResetBatchRunResult,
} from '@corpcal/shared';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';

const PREVIEW_LIST_LIMIT = 500;

@Injectable()
export class LookAheadResetJobService {
  private readonly logger = new Logger(LookAheadResetJobService.name);
  private inFlight = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  /**
   * Daily at 06:45 UTC (= 23:45 previous Pacific fixed UTC-7 date), with margin before
   * the 07:00 UTC Pacific-fixed calendar rollover.
   * `timeZone: 'UTC'` matches how we document the expression; activity completion
   * instead uses quarter-hour ticks + `toPacificHourMinute` for Pacific gating.
   */
  @Cron(LOOK_AHEAD_RESET_CRON_UTC, { timeZone: LOOK_AHEAD_RESET_CRON_TIMEZONE })
  async onScheduledRun(): Promise<void> {
    if (this.inFlight) {
      this.logger.warn(
        'Look Ahead reset cron matched but batch already in flight on this pod — skipping'
      );
      return;
    }
    /** Anchor window to cron entry, not `Date.now()` after locks/settings in `runBatch`. */
    const referenceUtcMs = Date.now();
    this.logger.log('Look Ahead reset cron tick');
    const result = await this.runBatch({
      actorUserId: CALENDAR_SYSTEM_USER_ID,
      trigger: 'schedule',
      referenceUtcMs,
    });
    if (
      result.skipped &&
      (result.skipReason === 'in_flight' ||
        result.skipReason === 'advisory_lock')
    ) {
      this.logger.warn(
        `Look Ahead reset skipped (${result.skipReason ?? 'unknown'})`
      );
    }
  }

  /**
   * Run the Look Ahead status reset. Used by cron and the manual admin endpoint.
   * Acquires a Postgres advisory lock so only one pod executes per invocation.
   *
   * All DB work inside the transaction must use `tx` (not `DatabaseService.db`).
   */
  async runBatch(params: {
    actorUserId: number;
    trigger: 'schedule' | 'manual';
    /**
     * Scheduled runs: capture synchronously in the cron handler and pass through so the
     * reset window does not drift if the transaction starts after the Pacific-fixed day
     * boundary (07:00 UTC). Manual runs use `Date.now()` at computation time.
     */
    referenceUtcMs?: number;
    /** Manual only; when omitted, uses persisted window days inside the transaction. */
    daysOverride?: number;
  }): Promise<LookAheadResetBatchRunResult> {
    if (this.inFlight) {
      return { updated: 0, skipped: true, skipReason: 'in_flight' };
    }
    this.inFlight = true;
    const start = Date.now();

    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const [lockResult] = await tx.execute(
          sql`SELECT pg_try_advisory_xact_lock(${LOOK_AHEAD_RESET_JOB_ADVISORY_CLASS}::integer, ${LOOK_AHEAD_RESET_JOB_ADVISORY_KEY}::integer) AS acquired`
        );
        if (!(lockResult as { acquired: boolean }).acquired) {
          this.logger.debug(
            'Look Ahead reset: another session holds the advisory lock — skipping'
          );
          return { updated: 0, skipped: true, skipReason: 'advisory_lock' };
        }

        const persistedDays =
          await this.applicationSettings.getLookAheadResetWindowDays(tx);
        const n =
          params.trigger === 'manual' && params.daysOverride !== undefined
            ? params.daysOverride
            : persistedDays;

        const windowUtcMs =
          params.trigger === 'schedule' && params.referenceUtcMs !== undefined
            ? params.referenceUtcMs
            : Date.now();

        const { rangeStart, rangeEnd } = computeLookAheadResetWindow(
          windowUtcMs,
          n
        );

        const updated = await this.resetEligibleActivities(
          tx,
          params.actorUserId,
          params.trigger,
          rangeStart,
          rangeEnd
        );

        const elapsed = Date.now() - start;
        this.logger.log(
          `Look Ahead reset finished: ${updated} activity(s) updated in ${elapsed}ms (window ${rangeStart}..${rangeEnd}, n=${n})`
        );
        return { updated, skipped: false };
      });
    } catch (err) {
      this.logger.error(
        'Look Ahead reset failed',
        err instanceof Error ? err.stack : String(err)
      );
      return { updated: 0, skipped: true, skipReason: 'error' };
    } finally {
      this.inFlight = false;
    }
  }

  async previewEligibleActivities(days: number): Promise<{
    count: number;
    items: Array<{ displayId: string | null; title: string }>;
    listTruncated: boolean;
  }> {
    const { rangeStart, rangeEnd } = computeLookAheadResetWindow(
      Date.now(),
      days
    );
    const whereClause = this.buildEligibilityWhere(rangeStart, rangeEnd);

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
   * Eligibility is by **calendar-date overlap** with [rangeStart, rangeEnd] (Pacific fixed UTC-7).
   * Timed activities that already ended earlier on a given day remain included if their schedule
   * still overlaps the window (same as date-only overlap on start/end dates).
   */
  private buildEligibilityWhere(rangeStart: string, rangeEnd: string) {
    const overlapStart = sql`COALESCE(${activities.endDate}, ${activities.startDate}) >= ${rangeStart}`;
    const overlapEnd = sql`${activities.startDate} <= ${rangeEnd}`;

    return and(
      isNotNull(activities.startDate),
      overlapEnd,
      overlapStart,
      isNotNull(activities.lookAheadStatus),
      ne(activities.lookAheadStatus, 'none')
    );
  }

  private async resetEligibleActivities(
    tx: DrizzleDbExecutor,
    actorUserId: number,
    trigger: 'schedule' | 'manual',
    rangeStart: string,
    rangeEnd: string
  ): Promise<number> {
    const whereClause = this.buildEligibilityWhere(rangeStart, rangeEnd);

    const candidates = await tx
      .select({
        id: activities.id,
        lookAheadStatus: activities.lookAheadStatus,
      })
      .from(activities)
      .where(whereClause);

    if (candidates.length === 0) return 0;

    const candidateIds = candidates.map((c) => c.id);
    const now = new Date();
    const notes =
      trigger === 'schedule'
        ? 'Automated: Look Ahead status cleared by scheduled job'
        : 'Look Ahead status cleared by admin (manual run)';

    await tx
      .update(activities)
      .set({
        lookAheadStatus: 'none',
        lastUpdatedBy: actorUserId,
        lastUpdatedDateTime: now,
      })
      .where(inArray(activities.id, candidateIds));

    for (const candidate of candidates) {
      const oldStatus = candidate.lookAheadStatus;
      await this.activityHistoryService.recordChange(
        candidate.id,
        actorUserId,
        'updated',
        [
          {
            field: 'lookAheadStatus',
            oldValue: oldStatus,
            newValue: 'none',
          },
        ],
        notes,
        tx
      );
    }

    return candidates.length;
  }
}
