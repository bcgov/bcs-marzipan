import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  activities,
  activityStatuses,
  ministries,
  teams,
} from '@corpcal/database/schema';

import type { DrizzleDbExecutor } from '../../database/database.provider';
import { DatabaseService } from '../../database/database.service';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityUtilsService } from './activity-utils.service';

/**
 * Status names excluded from the displayId cascade. Activities in these
 * statuses keep their existing `displayId` when a referenced ministry or team
 * abbreviation is updated. `delete_requested` is cascaded so that if an
 * activity is restored, its id already matches the current abbreviations.
 */
const DISPLAY_ID_CASCADE_EXCLUDED_STATUS_NAMES = [
  'completed',
  'deleted',
] as const;

type CandidateRow = {
  id: number;
  displayId: string | null;
  leadMinistryId: number | null;
  teamAbbreviation: string | null;
  ministryAbbreviation: string | null;
};

type UpdateEntry = {
  activityId: number;
  oldDisplayId: string | null;
  newDisplayId: string;
};

/**
 * Service that cascades `activities.displayId` when a referenced team or
 * ministry `abbreviation` changes. Only `completed` and `deleted` activities
 * are skipped; `delete_requested` is updated so restored activities stay aligned.
 */
@Injectable()
export class ActivityDisplayIdSyncService {
  private readonly logger = new Logger(ActivityDisplayIdSyncService.name);

  /**
   * Batch size for chunked `UPDATE` + history inserts. Chosen to keep
   * per-statement parameter counts well under Postgres limits while still
   * amortizing round-trips for large cascades.
   */
  private static readonly CHUNK_SIZE = 200;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly utilsService: ActivityUtilsService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  /**
   * Refresh `displayId` for every eligible activity whose lead ministry is the
   * given ministry (excluding completed/deleted). Prefix resolution follows
   * the update-time rule: when the ministry has a truthy abbreviation the
   * ministry drives the prefix; otherwise the lead team abbreviation is used.
   */
  async refreshAfterMinistryAbbreviationChange(
    tx: DrizzleDbExecutor,
    ministryId: number,
    actorUserId: number
  ): Promise<{ updatedCount: number }> {
    const candidates = await this.fetchCandidates(tx, {
      filter: eq(activities.leadMinistryId, ministryId),
    });
    return this.applyUpdates(tx, candidates, actorUserId, {
      notes: 'displayId refreshed after ministry abbreviation change',
    });
  }

  /**
   * Refresh `displayId` for every eligible activity whose lead team is the
   * given team AND whose displayId is driven by the team abbreviation (no lead
   * ministry, or lead ministry has no truthy abbreviation), excluding
   * completed/deleted.
   */
  async refreshAfterTeamAbbreviationChange(
    tx: DrizzleDbExecutor,
    teamId: number,
    actorUserId: number
  ): Promise<{ updatedCount: number }> {
    const candidates = await this.fetchCandidates(tx, {
      filter: and(
        eq(activities.leadTeamId, teamId),
        // Team abbreviation only drives the prefix when the ministry prefix
        // is not in effect.
        or(
          isNull(activities.leadMinistryId),
          sql`COALESCE(NULLIF(${ministries.abbreviation}, ''), NULL) IS NULL`
        )
      ),
    });
    return this.applyUpdates(tx, candidates, actorUserId, {
      notes: 'displayId refreshed after team abbreviation change',
    });
  }

  private async fetchCandidates(
    tx: DrizzleDbExecutor,
    params: { filter: SQL | undefined }
  ): Promise<CandidateRow[]> {
    const excludedStatusIdsSubquery = tx
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(
        inArray(activityStatuses.name, [
          ...DISPLAY_ID_CASCADE_EXCLUDED_STATUS_NAMES,
        ])
      );

    const rows = await tx
      .select({
        id: activities.id,
        displayId: activities.displayId,
        leadMinistryId: activities.leadMinistryId,
        teamAbbreviation: teams.abbreviation,
        ministryAbbreviation: ministries.abbreviation,
      })
      .from(activities)
      .leftJoin(teams, eq(teams.id, activities.leadTeamId))
      .leftJoin(ministries, eq(ministries.id, activities.leadMinistryId))
      .where(
        and(
          params.filter,
          notInArray(activities.activityStatusId, excludedStatusIdsSubquery)
        )
      );

    return rows;
  }

  private async applyUpdates(
    tx: DrizzleDbExecutor,
    candidates: CandidateRow[],
    actorUserId: number,
    params: { notes: string }
  ): Promise<{ updatedCount: number }> {
    if (candidates.length === 0) return { updatedCount: 0 };

    const entries: UpdateEntry[] = [];
    for (const row of candidates) {
      const newDisplayId = this.utilsService.computeDisplayIdFromLeadContext({
        activityId: row.id,
        leadMinistryId: row.leadMinistryId,
        ministryAbbreviation: row.ministryAbbreviation,
        teamAbbreviation: row.teamAbbreviation,
      });
      if (newDisplayId === row.displayId) continue;
      entries.push({
        activityId: row.id,
        oldDisplayId: row.displayId,
        newDisplayId,
      });
    }

    if (entries.length === 0) return { updatedCount: 0 };

    const now = new Date();
    for (
      let i = 0;
      i < entries.length;
      i += ActivityDisplayIdSyncService.CHUNK_SIZE
    ) {
      const chunk = entries.slice(
        i,
        i + ActivityDisplayIdSyncService.CHUNK_SIZE
      );

      // Apply per-row UPDATE within the chunk (one statement per activity keeps
      // the unique constraint on `display_id` easy to reason about and lets us
      // surface a precise error if a value ever collides).
      for (const entry of chunk) {
        await tx
          .update(activities)
          .set({
            displayId: entry.newDisplayId,
            lastUpdatedBy: actorUserId,
            lastUpdatedDateTime: now,
          })
          .where(eq(activities.id, entry.activityId));
      }

      await this.activityHistoryService.recordDisplayIdChangeBatch(tx, {
        actorUserId,
        entries: chunk,
        notes: params.notes,
      });
    }

    this.logger.log(
      `Cascade updated ${entries.length} activity displayId(s) (${params.notes})`
    );

    return { updatedCount: entries.length };
  }
}
