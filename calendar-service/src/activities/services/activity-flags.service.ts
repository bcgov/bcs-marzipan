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
   * Upsert the flag for the calling user's team on a given activity.
   * Replaces any existing flag for that (activity, team) pair.
   * The assignee must be a member of the same team.
   */
  async upsertFlag(
    activityId: number,
    teamId: number,
    assigneeId: number,
    assignedById: number,
    note?: string
  ): Promise<void> {
    const db = this.databaseService.db;

    // Validate activity exists
    const [activity] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    // Validate assignee is a member of the team
    const [membership] = await db
      .select({ userId: userTeams.userId })
      .from(userTeams)
      .where(
        and(
          eq(userTeams.userId, assigneeId),
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true)
        )
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException(
        'Assignee is not an active member of this team'
      );
    }

    // Look up existing assignee name before upsert
    const [existingFlag] = await db
      .select({
        existingName: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.assigneeId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId)
        )
      )
      .limit(1);
    const previousAssigneeName = existingFlag?.existingName ?? null;

    await db
      .insert(activityFlags)
      .values({
        activityId,
        teamId,
        assigneeId,
        assignedById,
        note: note ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [activityFlags.activityId, activityFlags.teamId],
        set: {
          assigneeId,
          assignedById,
          note: note ?? null,
          updatedAt: new Date(),
        },
      });

    // Look up new assignee display name for history
    const [assigneeUser] = await db
      .select({
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(users)
      .where(eq(users.id, assigneeId))
      .limit(1);
    const assigneeName = assigneeUser?.name ?? String(assigneeId);

    await this.activityHistoryService.recordChange(
      activityId,
      assignedById,
      'flag_assigned',
      [
        {
          field: 'flag.assigneeName',
          oldValue: previousAssigneeName,
          newValue: assigneeName,
        },
      ]
    );
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

    // Look up existing assignee name before deleting
    const [existing] = await db
      .select({
        name: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
      })
      .from(activityFlags)
      .innerJoin(users, eq(users.id, activityFlags.assigneeId))
      .where(
        and(
          eq(activityFlags.activityId, activityId),
          eq(activityFlags.teamId, teamId)
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
          eq(activityFlags.teamId, teamId)
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
        assigneeId: activityFlags.assigneeId,
        assigneeName: sql<string>`COALESCE(${users.adDisplayName}, ${users.adEmail})`,
        assignedById: activityFlags.assignedById,
        note: activityFlags.note,
        createdAt: activityFlags.createdAt,
        updatedAt: activityFlags.updatedAt,
      })
      .from(activityFlags)
      .innerJoin(teams, eq(activityFlags.teamId, teams.id))
      .innerJoin(users, eq(activityFlags.assigneeId, users.id))
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
        assigneeId: row.assigneeId,
        assigneeName: row.assigneeName,
        assignedById: row.assignedById,
        note: row.note,
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
