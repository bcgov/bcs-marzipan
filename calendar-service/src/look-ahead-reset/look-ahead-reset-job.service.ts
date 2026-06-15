import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, count, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';

import { activities, lookAheadResetSnapshots } from '@corpcal/database/schema';
import {
  CALENDAR_SYSTEM_USER_ID,
  computeLookAheadResetWindow,
  computeManualLookAheadClearWindow,
  LOOK_AHEAD_RESET_CRON_TIMEZONE,
  LOOK_AHEAD_RESET_CRON_UTC,
  LOOK_AHEAD_RESET_JOB_ADVISORY_CLASS,
  LOOK_AHEAD_RESET_JOB_ADVISORY_KEY,
  pacificCalendarDateFromUtcMs,
  type LookAheadManualClearScope,
  type LookAheadResetBatchRunResult,
  type LookAheadResetDateWindow,
  type LookAheadResetLastClearSummary,
  type LookAheadResetRollbackResult,
} from '@corpcal/shared';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';

const PREVIEW_LIST_LIMIT = 500;

export type LookAheadResetManualRunParams = {
  scope?: LookAheadManualClearScope;
  days?: number;
  includePast?: boolean;
};

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
   */
  @Cron(LOOK_AHEAD_RESET_CRON_UTC, { timeZone: LOOK_AHEAD_RESET_CRON_TIMEZONE })
  async onScheduledRun(): Promise<void> {
    if (this.inFlight) {
      this.logger.warn(
        'Look Ahead reset cron matched but batch already in flight on this pod — skipping'
      );
      return;
    }
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
        result.skipReason === 'advisory_lock' ||
        result.skipReason === 'cron_stopped' ||
        result.skipReason === 'paused_today')
    ) {
      this.logger.warn(
        `Look Ahead reset skipped (${result.skipReason ?? 'unknown'})`
      );
    }
  }

  async getLastClearSummary(): Promise<LookAheadResetLastClearSummary | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(lookAheadResetSnapshots)
      .where(eq(lookAheadResetSnapshots.id, 1))
      .limit(1);
    if (!row) return null;
    return {
      at: row.createdAt.toISOString(),
      updated: row.updatedCount,
      trigger: row.trigger as 'schedule' | 'manual',
    };
  }

  async isRollbackAvailable(): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ id: lookAheadResetSnapshots.id })
      .from(lookAheadResetSnapshots)
      .where(eq(lookAheadResetSnapshots.id, 1))
      .limit(1);
    return row != null;
  }

  /**
   * Run the Look Ahead status reset. Used by cron and the manual admin endpoint.
   */
  async runBatch(params: {
    actorUserId: number;
    trigger: 'schedule' | 'manual';
    referenceUtcMs?: number;
    manual?: LookAheadResetManualRunParams;
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

        const windowUtcMs =
          params.trigger === 'schedule' && params.referenceUtcMs !== undefined
            ? params.referenceUtcMs
            : Date.now();

        if (params.trigger === 'schedule') {
          const cronSettings =
            await this.applicationSettings.getLookAheadResetCronSettings(tx);
          if (!cronSettings.cronEnabled) {
            return { updated: 0, skipped: true, skipReason: 'cron_stopped' };
          }
          const todayPacific = pacificCalendarDateFromUtcMs(windowUtcMs);
          if (cronSettings.pausedForDate === todayPacific) {
            await this.applicationSettings.clearLookAheadResetPausedForDate(tx);
            return { updated: 0, skipped: true, skipReason: 'paused_today' };
          }
        }

        const dateWindow = await this.resolveDateWindow(
          tx,
          params,
          windowUtcMs
        );
        const updated = await this.resetEligibleActivities(
          tx,
          params.actorUserId,
          params.trigger,
          dateWindow
        );

        const elapsed = Date.now() - start;
        const windowLabel =
          dateWindow == null
            ? 'all statuses'
            : dateWindow.rangeEnd != null
              ? `${dateWindow.rangeStart}..${dateWindow.rangeEnd}`
              : `${dateWindow.rangeStart}+`;
        this.logger.log(
          `Look Ahead reset finished: ${updated} activity(s) updated in ${elapsed}ms (window ${windowLabel})`
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

  async rollbackLastClear(
    actorUserId: number
  ): Promise<LookAheadResetRollbackResult> {
    if (this.inFlight) {
      return { restored: 0, skipped: 0, rollbackAvailable: true };
    }
    this.inFlight = true;

    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const [lockResult] = await tx.execute(
          sql`SELECT pg_try_advisory_xact_lock(${LOOK_AHEAD_RESET_JOB_ADVISORY_CLASS}::integer, ${LOOK_AHEAD_RESET_JOB_ADVISORY_KEY}::integer) AS acquired`
        );
        if (!(lockResult as { acquired: boolean }).acquired) {
          return { restored: 0, skipped: 0, rollbackAvailable: true };
        }

        const [snapshot] = await tx
          .select()
          .from(lookAheadResetSnapshots)
          .where(eq(lookAheadResetSnapshots.id, 1))
          .limit(1);

        if (!snapshot) {
          return { restored: 0, skipped: 0, rollbackAvailable: false };
        }

        const entries = snapshot.entries;
        if (entries.length === 0) {
          await tx
            .delete(lookAheadResetSnapshots)
            .where(eq(lookAheadResetSnapshots.id, 1));
          return { restored: 0, skipped: 0, rollbackAvailable: false };
        }

        const activityIds = entries.map((e) => e.activityId);
        const currentRows = await tx
          .select({
            id: activities.id,
            lookAheadStatus: activities.lookAheadStatus,
          })
          .from(activities)
          .where(inArray(activities.id, activityIds));

        const currentById = new Map(
          currentRows.map((row) => [row.id, row.lookAheadStatus])
        );

        const now = new Date();
        let restored = 0;
        let skipped = 0;
        const historyEntries: Array<{
          activityId: number;
          oldLookAheadStatus: string | null;
          newLookAheadStatus: string | null;
        }> = [];

        for (const entry of entries) {
          const current = currentById.get(entry.activityId);
          if (current === undefined) {
            skipped += 1;
            continue;
          }
          await tx
            .update(activities)
            .set({
              lookAheadStatus: entry.lookAheadStatus,
              lastUpdatedBy: actorUserId,
              lastUpdatedDateTime: now,
            })
            .where(eq(activities.id, entry.activityId));
          historyEntries.push({
            activityId: entry.activityId,
            oldLookAheadStatus: current,
            newLookAheadStatus: entry.lookAheadStatus,
          });
          restored += 1;
        }

        if (historyEntries.length > 0) {
          await this.activityHistoryService.recordLookAheadStatusChangeBatch(
            tx,
            {
              actorUserId,
              notes: 'Restored Look Ahead status (rollback of last clear)',
              entries: historyEntries,
            }
          );
        }

        await tx
          .delete(lookAheadResetSnapshots)
          .where(eq(lookAheadResetSnapshots.id, 1));

        return { restored, skipped, rollbackAvailable: false };
      });
    } catch (err) {
      this.logger.error(
        'Look Ahead reset rollback failed',
        err instanceof Error ? err.stack : String(err)
      );
      throw err;
    } finally {
      this.inFlight = false;
    }
  }

  async previewEligibleActivities(
    params: LookAheadResetManualRunParams & {
      persistedWindowDays?: number;
    }
  ): Promise<{
    count: number;
    items: Array<{ displayId: string | null; title: string }>;
    listTruncated: boolean;
  }> {
    const scope = params.scope ?? 'window';
    const includePast = params.includePast ?? false;
    const days =
      params.days ??
      params.persistedWindowDays ??
      (await this.applicationSettings.getLookAheadResetWindowDays());

    const dateWindow = this.resolveManualDateWindow(Date.now(), {
      scope,
      days,
      includePast,
    });
    const whereClause = this.buildEligibilityWhere(dateWindow);

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

  private async resolveDateWindow(
    tx: DrizzleDbExecutor,
    params: {
      trigger: 'schedule' | 'manual';
      manual?: LookAheadResetManualRunParams;
    },
    windowUtcMs: number
  ): Promise<LookAheadResetDateWindow | null> {
    if (params.trigger === 'schedule') {
      const n = await this.applicationSettings.getLookAheadResetWindowDays(tx);
      return computeLookAheadResetWindow(windowUtcMs, n);
    }

    const manual = params.manual ?? {};
    const scope = manual.scope ?? 'window';
    const includePast = manual.includePast ?? false;
    const days =
      manual.days ??
      (await this.applicationSettings.getLookAheadResetWindowDays(tx));

    return this.resolveManualDateWindow(windowUtcMs, {
      scope,
      days,
      includePast,
    });
  }

  private resolveManualDateWindow(
    utcMs: number,
    params: {
      scope: LookAheadManualClearScope;
      days: number;
      includePast: boolean;
    }
  ): LookAheadResetDateWindow | null {
    return computeManualLookAheadClearWindow(utcMs, {
      scope: params.scope,
      days: params.days,
      includePast: params.includePast,
    });
  }

  private buildEligibilityWhere(dateWindow: LookAheadResetDateWindow | null) {
    const statusFilter = and(
      isNotNull(activities.lookAheadStatus),
      ne(activities.lookAheadStatus, 'none')
    );

    if (dateWindow == null) {
      return statusFilter;
    }

    const overlapStart = sql`COALESCE(${activities.endDate}, ${activities.startDate}) >= ${dateWindow.rangeStart}`;
    const overlapParts = [isNotNull(activities.startDate), overlapStart];

    if (dateWindow.rangeEnd != null) {
      overlapParts.push(sql`${activities.startDate} <= ${dateWindow.rangeEnd}`);
    }

    return and(...overlapParts, statusFilter);
  }

  private async resetEligibleActivities(
    tx: DrizzleDbExecutor,
    actorUserId: number,
    trigger: 'schedule' | 'manual',
    dateWindow: LookAheadResetDateWindow | null
  ): Promise<number> {
    const whereClause = this.buildEligibilityWhere(dateWindow);

    const candidates = await tx
      .select({
        id: activities.id,
        lookAheadStatus: activities.lookAheadStatus,
      })
      .from(activities)
      .where(whereClause);

    await tx.delete(lookAheadResetSnapshots);

    if (candidates.length === 0) {
      return 0;
    }

    await tx.insert(lookAheadResetSnapshots).values({
      id: 1,
      actorUserId,
      trigger,
      updatedCount: candidates.length,
      entries: candidates.map((c) => ({
        activityId: c.id,
        lookAheadStatus: c.lookAheadStatus,
      })),
    });

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

    await this.activityHistoryService.recordLookAheadStatusResetBatch(tx, {
      actorUserId,
      notes,
      entries: candidates.map((c) => ({
        activityId: c.id,
        oldLookAheadStatus: c.lookAheadStatus,
      })),
    });

    return candidates.length;
  }
}
