import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';

import {
  activities,
  activityFlags,
  teams,
  users,
  userSettings,
  userTeams,
} from '@corpcal/database/schema';
import type { ActivityFlagResponse } from '@corpcal/shared/api/types';

import { DatabaseService } from '../../database/database.service';
import { ActivityHistoryService } from './activity-history.service';

/**
 * Service for managing activity flags.
 * A flag marks one team member per activity per team for follow-up.
 */
@Injectable()
export class ActivityFlagsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  /**
   * Legacy single-user flag API.
   *
   * Preserves prior behaviour by syncing the full flagged-user set to exactly one
   * user for the provided (activity, team).
   */
  async upsertFlag(
    activityId: number,
    teamId: number,
    flaggedUserId: number,
    flaggedById: number,
    note?: string
  ): Promise<void> {
    await this.syncFlags(
      activityId,
      teamId,
      [flaggedUserId],
      flaggedById,
      note
    );
  }

  /**
   * Syncs flagged users for a given (activity, team) pair to exactly match
   * the provided flagged-user list.
   */
  async syncFlags(
    activityId: number,
    teamId: number,
    flaggedUserIds: number[],
    flaggedById: number,
    note?: string,
    displayTeamPerFlaggedUser?: Record<number, number | null>
  ): Promise<{
    addedFlaggedUserIds: number[];
    removedFlaggedUserIds: number[];
  }> {
    const db = this.databaseService.db;
    const desiredFlaggedUserIds = Array.from(new Set(flaggedUserIds));

    // Validate activity exists
    const [activity] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    // Validate all flagged users are active members of the team
    const flaggedUserMembershipRows =
      desiredFlaggedUserIds.length === 0
        ? []
        : await db
            .select({
              userId: userTeams.userId,
              name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
            })
            .from(userTeams)
            .innerJoin(users, eq(users.id, userTeams.userId))
            .where(
              and(
                eq(userTeams.teamId, teamId),
                eq(userTeams.isActive, true),
                inArray(userTeams.userId, desiredFlaggedUserIds)
              )
            );

    const membershipUserIdSet = new Set(
      flaggedUserMembershipRows.map((m) => m.userId)
    );
    const invalidFlaggedUserIds = desiredFlaggedUserIds.filter(
      (id) => !membershipUserIdSet.has(id)
    );

    if (invalidFlaggedUserIds.length > 0) {
      throw new ForbiddenException(
        'One or more flagged users are not active members of this team'
      );
    }

    const flaggedUserNameById = new Map(
      flaggedUserMembershipRows.map((row) => [row.userId, row.name] as const)
    );

    // Validate displayTeamPerFlaggedUser: each flagged user can only display a team they're actually a member of
    if (
      displayTeamPerFlaggedUser &&
      Object.keys(displayTeamPerFlaggedUser).length > 0
    ) {
      const desiredFlaggedUserSet = new Set(desiredFlaggedUserIds);
      const flaggedUserTeamMemberships = await db
        .select({
          userId: userTeams.userId,
          teamId: userTeams.teamId,
        })
        .from(userTeams)
        .where(
          and(
            eq(userTeams.isActive, true),
            inArray(userTeams.userId, desiredFlaggedUserIds)
          )
        );

      const flaggedUserTeamSet = new Map<number, Set<number>>();
      for (const row of flaggedUserTeamMemberships) {
        if (!flaggedUserTeamSet.has(row.userId)) {
          flaggedUserTeamSet.set(row.userId, new Set());
        }
        flaggedUserTeamSet.get(row.userId)!.add(row.teamId);
      }

      for (const [flaggedUserIdStr, displayTeamId] of Object.entries(
        displayTeamPerFlaggedUser
      )) {
        if (displayTeamId === null || displayTeamId === undefined) continue;

        const flaggedUserId = Number(flaggedUserIdStr);
        if (!desiredFlaggedUserSet.has(flaggedUserId)) continue;

        const flaggedUserTeams = flaggedUserTeamSet.get(flaggedUserId);
        if (!flaggedUserTeams?.has(displayTeamId)) {
          const flaggedUserName =
            flaggedUserNameById.get(flaggedUserId) ?? String(flaggedUserId);
          throw new ForbiddenException(
            `User ${flaggedUserName} (${flaggedUserId}) is not a member of display team ${displayTeamId}`
          );
        }
      }
    }

    // Existing flags for this (activity, team) pair
    const existingFlags = await db
      .select({
        flaggedUserId: activityFlags.flaggedUserId,
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.flaggedUserId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId)
        )
      );

    const existingFlaggedUserIds = existingFlags.map(
      (row) => row.flaggedUserId
    );
    const existingFlaggedUserSet = new Set(existingFlaggedUserIds);
    const desiredFlaggedUserSet = new Set(desiredFlaggedUserIds);

    const toAdd = desiredFlaggedUserIds.filter(
      (id) => !existingFlaggedUserSet.has(id)
    );
    const toRemove = existingFlaggedUserIds.filter(
      (id) => !desiredFlaggedUserSet.has(id)
    );

    // Wrap insert/delete/history in a transaction for atomicity
    await db.transaction(async (tx) => {
      // Update note on all existing flags for this (activityId, teamId) pair if note is provided
      if (note !== undefined && note !== null) {
        await tx
          .update(activityFlags)
          .set({
            note,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(activityFlags.activityId, activityId),
              eq(activityFlags.teamId, teamId)
            )
          );
      }

      // Update displayTeamId on existing flags individually (per-user cosmetic badge choice)
      if (displayTeamPerFlaggedUser) {
        const existingToUpdate = existingFlaggedUserIds.filter(
          (id) =>
            desiredFlaggedUserSet.has(id) && id in displayTeamPerFlaggedUser
        );
        for (const flaggedUserId of existingToUpdate) {
          await tx
            .update(activityFlags)
            .set({
              displayTeamId: displayTeamPerFlaggedUser[flaggedUserId] ?? null,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(activityFlags.activityId, activityId),
                eq(activityFlags.teamId, teamId),
                eq(activityFlags.flaggedUserId, flaggedUserId)
              )
            );
        }
      }

      if (toAdd.length > 0) {
        await tx
          .insert(activityFlags)
          .values(
            toAdd.map((flaggedUserId) => ({
              activityId,
              teamId,
              flaggedUserId,
              flaggedById,
              displayTeamId: displayTeamPerFlaggedUser?.[flaggedUserId] ?? null,
              note: note ?? null,
              updatedAt: new Date(),
            }))
          )
          .onConflictDoNothing({
            target: [
              activityFlags.activityId,
              activityFlags.teamId,
              activityFlags.flaggedUserId,
            ],
          });
      }

      if (toRemove.length > 0) {
        await tx
          .delete(activityFlags)
          .where(
            and(
              eq(activityFlags.activityId, activityId),
              eq(activityFlags.teamId, teamId),
              inArray(activityFlags.flaggedUserId, toRemove)
            )
          );
      }

      for (const flaggedUserId of toAdd) {
        const flaggedUserName =
          flaggedUserNameById.get(flaggedUserId) ?? String(flaggedUserId);
        await this.activityHistoryService.recordChange(
          activityId,
          flaggedById,
          'flag_assigned',
          [
            {
              field: 'flag.flaggedUserName',
              oldValue: null,
              newValue: flaggedUserName,
            },
          ],
          undefined,
          tx
        );
      }

      const existingNameById = new Map(
        existingFlags.map((row) => [row.flaggedUserId, row.name] as const)
      );
      for (const flaggedUserId of toRemove) {
        const flaggedUserName =
          existingNameById.get(flaggedUserId) ?? String(flaggedUserId);
        await this.activityHistoryService.recordChange(
          activityId,
          flaggedById,
          'flag_removed',
          [
            {
              field: 'flag.flaggedUserName',
              oldValue: flaggedUserName,
              newValue: null,
            },
          ],
          undefined,
          tx
        );
      }
    });

    return {
      addedFlaggedUserIds: toAdd,
      removedFlaggedUserIds: toRemove,
    };
  }

  /**
   * Remove the flag for a given (activity, team) pair.
   * No-op (no delete, no history entry) if the flag does not exist.
   */
  async removeFlag(
    activityId: number,
    teamId: number,
    removedById: number
  ): Promise<void> {
    const db = this.databaseService.db;

    const existing = await db
      .select({
        flaggedUserId: activityFlags.flaggedUserId,
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.flaggedUserId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId)
        )
      );

    if (existing.length === 0) {
      return;
    }

    await db
      .delete(activityFlags)
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId)
        )
      );

    for (const row of existing) {
      await this.activityHistoryService.recordChange(
        activityId,
        removedById,
        'flag_removed',
        [{ field: 'flag.flaggedUserName', oldValue: row.name, newValue: null }]
      );
    }
  }

  /**
   * Remove a single flag for a given (activity, team, flagged user) tuple.
   * No-op if the row does not exist.
   */
  async removeFlagForUser(
    activityId: number,
    teamId: number,
    flaggedUserId: number,
    removedById: number
  ): Promise<void> {
    const db = this.databaseService.db;

    const [existing] = await db
      .select({
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.flaggedUserId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId),
          eq(activityFlags.flaggedUserId, flaggedUserId)
        )
      )
      .limit(1);
    const flaggedUserName = existing?.name ?? null;

    if (!existing) {
      return;
    }

    await db
      .delete(activityFlags)
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId),
          eq(activityFlags.flaggedUserId, flaggedUserId)
        )
      );

    await this.activityHistoryService.recordChange(
      activityId,
      removedById,
      'flag_removed',
      [
        {
          field: 'flag.flaggedUserName',
          oldValue: flaggedUserName,
          newValue: null,
        },
      ]
    );
  }

  /**
   * Fetch flags for multiple activities, scoped to the given team IDs.
   * Returns a map of activityId → ActivityFlagResponse[].
   */
  async fetchFlagsForActivities(
    activityIds: number[],
    teamIds: number[]
  ): Promise<Map<number, ActivityFlagResponse[]>> {
    if (activityIds.length === 0 || teamIds.length === 0) {
      return new Map();
    }

    const db = this.databaseService.db;

    // First, fetch all flag rows with team and user data
    const flagRows = await db
      .select({
        activityId: activityFlags.activityId,
        teamId: activityFlags.teamId,
        teamName: teams.name,
        displayTeamId: activityFlags.displayTeamId,
        flaggedUserId: activityFlags.flaggedUserId,
        flaggedUserName: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
        flaggedById: activityFlags.flaggedById,
        note: activityFlags.note,
        flaggedUserColour: userSettings.flagColour,
        createdAt: activityFlags.createdAt,
        updatedAt: activityFlags.updatedAt,
      })
      .from(activityFlags)
      .innerJoin(teams, eq(activityFlags.teamId, teams.id))
      .innerJoin(users, eq(activityFlags.flaggedUserId, users.id))
      .leftJoin(
        userSettings,
        eq(userSettings.userId, activityFlags.flaggedUserId)
      )
      .where(
        and(
          inArray(activityFlags.activityId, activityIds),
          inArray(activityFlags.teamId, teamIds)
        )
      );

    // Fetch display team names separately to avoid per-row scalar subqueries
    const displayTeamIds = Array.from(
      new Set(flagRows.map((r) => r.displayTeamId).filter((id) => id != null))
    );

    const displayTeamNames = new Map<number, string>();
    if (displayTeamIds.length > 0) {
      const displayTeamRows = await db
        .select({
          id: teams.id,
          name: teams.name,
        })
        .from(teams)
        .where(inArray(teams.id, displayTeamIds));

      for (const row of displayTeamRows) {
        displayTeamNames.set(row.id, row.name);
      }
    }

    const map = new Map<number, ActivityFlagResponse[]>();
    for (const row of flagRows) {
      const flag: ActivityFlagResponse = {
        teamId: row.teamId,
        teamName: row.teamName,
        displayTeamId: row.displayTeamId,
        displayTeamName:
          row.displayTeamId != null
            ? (displayTeamNames.get(row.displayTeamId) ?? null)
            : null,
        flaggedUserId: row.flaggedUserId,
        flaggedUserName: row.flaggedUserName,
        flaggedById: row.flaggedById,
        note: row.note,
        flaggedUserColour: row.flaggedUserColour ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
      const existing = map.get(row.activityId) ?? [];
      existing.push(flag);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch flags for a single activity, scoped to the given team IDs.
   */
  async fetchFlagsForActivity(
    activityId: number,
    teamIds: number[]
  ): Promise<ActivityFlagResponse[]> {
    const map = await this.fetchFlagsForActivities([activityId], teamIds);
    return map.get(activityId) ?? [];
  }
}
