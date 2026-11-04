import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, notInArray, type SQL } from 'drizzle-orm';

import { activities, activityStatuses, teams } from '@corpcal/database/schema';

import type { DrizzleDbExecutor } from '../../database/database.provider';
import { DatabaseService } from '../../database/database.service';
import { getActivityTimestampUpdateForWrite } from '../utils/activity-timestamp-write';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityUtilsService } from './activity-utils.service';

const DISPLAY_ID_CASCADE_EXCLUDED_STATUS_NAMES = [
  'completed',
  'deleted',
] as const;

type CandidateRow = {
  id: number;
  displayId: string | null;
  teamAbbreviation: string | null;
};

type UpdateEntry = {
  activityId: number;
  oldDisplayId: string | null;
  newDisplayId: string;
};

@Injectable()
export class ActivityDisplayIdSyncService {
  private readonly logger = new Logger(ActivityDisplayIdSyncService.name);

  private static readonly CHUNK_SIZE = 200;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly utilsService: ActivityUtilsService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  /**
   * Organization abbreviation changes do not affect displayId (prefix is lead team only).
   */
  refreshAfterOrganizationAbbreviationChange(
    _tx: DrizzleDbExecutor,
    _organizationId: number,
    _actorUserId: number
  ): Promise<{ updatedCount: number }> {
    return Promise.resolve({ updatedCount: 0 });
  }

  /** @deprecated Use refreshAfterOrganizationAbbreviationChange (no-op). */
  async refreshAfterMinistryAbbreviationChange(
    tx: DrizzleDbExecutor,
    organizationId: number,
    actorUserId: number
  ): Promise<{ updatedCount: number }> {
    return this.refreshAfterOrganizationAbbreviationChange(
      tx,
      organizationId,
      actorUserId
    );
  }

  async refreshAfterTeamAbbreviationChange(
    tx: DrizzleDbExecutor,
    teamId: number,
    actorUserId: number
  ): Promise<{ updatedCount: number }> {
    const candidates = await this.fetchCandidates(tx, {
      filter: eq(activities.leadTeamId, teamId),
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

    return tx
      .select({
        id: activities.id,
        displayId: activities.displayId,
        teamAbbreviation: teams.abbreviation,
      })
      .from(activities)
      .leftJoin(teams, eq(teams.id, activities.leadTeamId))
      .where(
        and(
          params.filter,
          notInArray(activities.activityStatusId, excludedStatusIdsSubquery)
        )
      );
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

      for (const entry of chunk) {
        await tx
          .update(activities)
          .set({
            displayId: entry.newDisplayId,
            ...getActivityTimestampUpdateForWrite({
              context: 'systemJob',
              userId: actorUserId,
              now,
            }),
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
