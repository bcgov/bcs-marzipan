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
 * Service for managing activity flags (assignments).
 * A flag assigns one team member per activity per team for follow-up.
 */
@Injectable()
export class ActivityFlagsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  /**
   * Legacy single-assignee API.
   *
   * Preserves prior behaviour by syncing the full assignee set to exactly one
   * assignee for the provided (activity, team).
   */
  async upsertFlag(
    activityId: number,
    teamId: number,
    assigneeId: number,
    assignedById: number,
    note?: string
  ): Promise<void> {
    await this.syncFlags(activityId, teamId, [assigneeId], assignedById, note);
  }

  /**
   * Syncs assignees for a given (activity, team) pair to exactly match
   * the provided assignee list.
   */
  async syncFlags(
    activityId: number,
    teamId: number,
    assigneeIds: number[],
    assignedById: number,
    note?: string,
    displayTeamPerAssignee?: Record<number, number | null>
  ): Promise<{ addedAssigneeIds: number[]; removedAssigneeIds: number[] }> {
    const db = this.databaseService.db;
    const desiredAssigneeIds = Array.from(new Set(assigneeIds));

    // Validate activity exists
    const [activity] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    // Validate all assignees are active members of the team
    const assigneeMembershipRows =
      desiredAssigneeIds.length === 0
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
                inArray(userTeams.userId, desiredAssigneeIds)
              )
            );

    const membershipUserIdSet = new Set(
      assigneeMembershipRows.map((m) => m.userId)
    );
    const invalidAssigneeIds = desiredAssigneeIds.filter(
      (id) => !membershipUserIdSet.has(id)
    );

    if (invalidAssigneeIds.length > 0) {
      throw new ForbiddenException(
        'One or more assignees are not active members of this team'
      );
    }

    const assigneeNameById = new Map(
      assigneeMembershipRows.map((row) => [row.userId, row.name] as const)
    );

    // Existing flags for this (activity, team) pair
    const existingFlags = await db
      .select({
        assigneeId: activityFlags.assigneeId,
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.assigneeId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId)
        )
      );

    const existingAssigneeIds = existingFlags.map((row) => row.assigneeId);
    const existingAssigneeSet = new Set(existingAssigneeIds);
    const desiredAssigneeSet = new Set(desiredAssigneeIds);

    const toAdd = desiredAssigneeIds.filter(
      (id) => !existingAssigneeSet.has(id)
    );
    const toRemove = existingAssigneeIds.filter(
      (id) => !desiredAssigneeSet.has(id)
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

      // Update displayTeamId on existing flags individually (per-assignee cosmetic badge choice)
      if (displayTeamPerAssignee) {
        const existingToUpdate = existingAssigneeIds.filter(
          (id) => desiredAssigneeSet.has(id) && id in displayTeamPerAssignee
        );
        for (const assigneeId of existingToUpdate) {
          await tx
            .update(activityFlags)
            .set({
              displayTeamId: displayTeamPerAssignee[assigneeId] ?? null,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(activityFlags.activityId, activityId),
                eq(activityFlags.teamId, teamId),
                eq(activityFlags.assigneeId, assigneeId)
              )
            );
        }
      }

      if (toAdd.length > 0) {
        await tx
          .insert(activityFlags)
          .values(
            toAdd.map((assigneeId) => ({
              activityId,
              teamId,
              assigneeId,
              assignedById,
              displayTeamId: displayTeamPerAssignee?.[assigneeId] ?? null,
              note: note ?? null,
              updatedAt: new Date(),
            }))
          )
          .onConflictDoNothing({
            target: [
              activityFlags.activityId,
              activityFlags.teamId,
              activityFlags.assigneeId,
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
              inArray(activityFlags.assigneeId, toRemove)
            )
          );
      }

      for (const assigneeId of toAdd) {
        const assigneeName =
          assigneeNameById.get(assigneeId) ?? String(assigneeId);
        await this.activityHistoryService.recordChange(
          activityId,
          assignedById,
          'flag_assigned',
          [
            {
              field: 'flag.assigneeName',
              oldValue: null,
              newValue: assigneeName,
            },
          ]
        );
      }

      const existingNameById = new Map(
        existingFlags.map((row) => [row.assigneeId, row.name] as const)
      );
      for (const assigneeId of toRemove) {
        const assigneeName =
          existingNameById.get(assigneeId) ?? String(assigneeId);
        await this.activityHistoryService.recordChange(
          activityId,
          assignedById,
          'flag_removed',
          [
            {
              field: 'flag.assigneeName',
              oldValue: assigneeName,
              newValue: null,
            },
          ]
        );
      }
    });

    return {
      addedAssigneeIds: toAdd,
      removedAssigneeIds: toRemove,
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
        assigneeId: activityFlags.assigneeId,
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.assigneeId))
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
        [{ field: 'flag.assigneeName', oldValue: row.name, newValue: null }]
      );
    }
  }

  /**
   * Remove a single assignee flag for a given (activity, team, assignee) tuple.
   * No-op if the row does not exist.
   */
  async removeAssigneeFlag(
    activityId: number,
    teamId: number,
    assigneeId: number,
    removedById: number
  ): Promise<void> {
    const db = this.databaseService.db;

    const [existing] = await db
      .select({
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.assigneeId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId),
          eq(activityFlags.assigneeId, assigneeId)
        )
      )
      .limit(1);
    const assigneeName = existing?.name ?? null;

    if (!existing) {
      return;
    }

    await db
      .delete(activityFlags)
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId),
          eq(activityFlags.assigneeId, assigneeId)
        )
      );

    await this.activityHistoryService.recordChange(
      activityId,
      removedById,
      'flag_removed',
      [{ field: 'flag.assigneeName', oldValue: assigneeName, newValue: null }]
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

    const rows = await db
      .select({
        activityId: activityFlags.activityId,
        teamId: activityFlags.teamId,
        teamName: teams.name,
        displayTeamId: activityFlags.displayTeamId,
        displayTeamName: sql<
          string | null
        >`(SELECT name FROM teams WHERE id = ${activityFlags.displayTeamId})`,
        assigneeId: activityFlags.assigneeId,
        assigneeName: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
        assignedById: activityFlags.assignedById,
        note: activityFlags.note,
        assigneeFlagColour: userSettings.flagColour,
        createdAt: activityFlags.createdAt,
        updatedAt: activityFlags.updatedAt,
      })
      .from(activityFlags)
      .innerJoin(teams, eq(activityFlags.teamId, teams.id))
      .innerJoin(users, eq(activityFlags.assigneeId, users.id))
      .leftJoin(userSettings, eq(userSettings.userId, activityFlags.assigneeId))
      .where(
        and(
          inArray(activityFlags.activityId, activityIds),
          inArray(activityFlags.teamId, teamIds)
        )
      );

    const map = new Map<number, ActivityFlagResponse[]>();
    for (const row of rows) {
      const flag: ActivityFlagResponse = {
        teamId: row.teamId,
        teamName: row.teamName,
        displayTeamId: row.displayTeamId,
        displayTeamName: row.displayTeamName,
        assigneeId: row.assigneeId,
        assigneeName: row.assigneeName,
        assignedById: row.assignedById,
        note: row.note,
        assigneeFlagColour: row.assigneeFlagColour ?? null,
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
