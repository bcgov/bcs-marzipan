import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { activityHistory, users } from '@corpcal/database/schema';
import type { ActivityHistory } from '@corpcal/database/types';
import type {
  ActivityHistoryEntry,
  HistoryChange,
} from '@corpcal/shared/api/types';
import { isDeepEqual } from '@corpcal/shared/utils';

import type { Database } from '../../database/database.provider';
import { DatabaseService } from '../../database/database.service';

/**
 * Service for tracking and retrieving activity change history
 */
@Injectable()
export class ActivityHistoryService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async getUserMap(userIds: number[]): Promise<
    Map<
      number,
      {
        displayName: string;
        username: string | null;
      }
    >
  > {
    const userRows =
      userIds.length > 0
        ? await this.databaseService.db
            .select({
              id: users.id,
              adDisplayName: users.adDisplayName,
              adUsername: users.adUsername,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];

    return new Map(
      userRows.map((user) => [
        user.id,
        {
          displayName:
            user.adDisplayName || user.adUsername || `User ${user.id}`,
          username: user.adUsername ?? null,
        },
      ])
    );
  }

  private mapEntriesToResponse(
    entries: Array<{
      id: number;
      activityId: number;
      userId: number;
      actionType: string;
      changes: unknown;
      notes: string | null;
      timestamp: Date | string;
    }>,
    userMap: Map<number, { displayName: string; username: string | null }>
  ): ActivityHistoryEntry[] {
    return entries.map((entry) => {
      const actor = userMap.get(entry.userId);
      const displayName = actor?.displayName ?? `User ${entry.userId}`;

      return {
        ...entry,
        changes: (entry.changes as ActivityHistoryEntry['changes']) ?? null,
        timestamp:
          entry.timestamp instanceof Date
            ? entry.timestamp.toISOString()
            : String(entry.timestamp),
        actor: {
          id: entry.userId,
          displayName,
          username: actor?.username ?? null,
        },
        userName: displayName,
      };
    });
  }

  /**
   * Record a change to an activity
   * @param activityId - ID of the activity being changed
   * @param userId - ID of the user making the change
   * @param actionType - Type of action: 'created', 'updated', 'deleted', 'published', 'draft_saved', etc.
   * @param changes - Array of field-level changes (optional)
   * @param notes - Optional notes about the change
   * @param tx - Optional transaction client; when provided, insert runs inside that transaction
   */
  async recordChange(
    activityId: number,
    userId: number,
    actionType: string,
    changes?: HistoryChange[],
    notes?: string,
    tx?: Database
  ): Promise<ActivityHistory> {
    const db = tx ?? this.databaseService.db;
    const [historyEntry] = await db
      .insert(activityHistory)
      .values({
        activityId,
        userId,
        actionType,
        changes: changes ? (changes as unknown) : null,
        notes: notes || null,
      })
      .returning();

    return historyEntry;
  }

  /**
   * Get all history entries for an activity, ordered by most recent first
   */
  async getActivityHistory(
    activityId: number
  ): Promise<ActivityHistoryEntry[]> {
    const historyEntries = await this.databaseService.db
      .select({
        id: activityHistory.id,
        activityId: activityHistory.activityId,
        userId: activityHistory.userId,
        actionType: activityHistory.actionType,
        changes: activityHistory.changes,
        notes: activityHistory.notes,
        timestamp: activityHistory.timestamp,
      })
      .from(activityHistory)
      .where(eq(activityHistory.activityId, activityId))
      .orderBy(desc(activityHistory.timestamp));

    const userIds = [...new Set(historyEntries.map((e) => e.userId))];
    const userMap = await this.getUserMap(userIds);

    return this.mapEntriesToResponse(historyEntries, userMap);
  }

  async getActivityHistoryForActivityIds(
    activityIds: number[]
  ): Promise<ActivityHistoryEntry[]> {
    if (activityIds.length === 0) {
      return [];
    }

    const historyEntries = await this.databaseService.db
      .select({
        id: activityHistory.id,
        activityId: activityHistory.activityId,
        userId: activityHistory.userId,
        actionType: activityHistory.actionType,
        changes: activityHistory.changes,
        notes: activityHistory.notes,
        timestamp: activityHistory.timestamp,
      })
      .from(activityHistory)
      .where(inArray(activityHistory.activityId, activityIds))
      .orderBy(desc(activityHistory.timestamp), desc(activityHistory.id));

    const userIds = [...new Set(historyEntries.map((entry) => entry.userId))];
    const userMap = await this.getUserMap(userIds);

    return this.mapEntriesToResponse(historyEntries, userMap);
  }

  async getHistoryEntryById(id: number): Promise<ActivityHistoryEntry | null> {
    const [entry] = await this.databaseService.db
      .select({
        id: activityHistory.id,
        activityId: activityHistory.activityId,
        userId: activityHistory.userId,
        actionType: activityHistory.actionType,
        changes: activityHistory.changes,
        notes: activityHistory.notes,
        timestamp: activityHistory.timestamp,
      })
      .from(activityHistory)
      .where(eq(activityHistory.id, id))
      .limit(1);

    if (!entry) {
      return null;
    }

    const userMap = await this.getUserMap([entry.userId]);
    return this.mapEntriesToResponse([entry], userMap)[0] ?? null;
  }

  /**
   * Get the activity status ID that was set immediately before the activity
   * was marked delete_requested or soft_deleted. Used for restore.
   * Returns null if no such history entry or no activityStatusId change is found.
   */
  async getPreviousStatusIdBeforeDelete(
    activityId: number
  ): Promise<number | null> {
    const [entry] = await this.databaseService.db
      .select({ changes: activityHistory.changes })
      .from(activityHistory)
      .where(
        and(
          eq(activityHistory.activityId, activityId),
          inArray(activityHistory.actionType, [
            'delete_requested',
            'soft_deleted',
          ])
        )
      )
      .orderBy(desc(activityHistory.timestamp))
      .limit(1);

    if (!entry?.changes || !Array.isArray(entry.changes)) {
      return null;
    }

    const statusChange = (entry.changes as HistoryChange[]).find(
      (c) => c.field === 'activityStatusId'
    );
    if (
      statusChange?.oldValue !== undefined &&
      statusChange.oldValue !== null &&
      typeof statusChange.oldValue === 'number'
    ) {
      return statusChange.oldValue;
    }
    return null;
  }

  /**
   * Get the most recent published state of an activity
   * Returns the activity state at the time of the last 'published' action
   */
  async getLastPublishedState(
    activityId: number
  ): Promise<ActivityHistory | null> {
    const [publishedEntry] = await this.databaseService.db
      .select()
      .from(activityHistory)
      .where(
        and(
          eq(activityHistory.activityId, activityId),
          eq(activityHistory.actionType, 'published')
        )
      )
      .orderBy(desc(activityHistory.timestamp))
      .limit(1);

    return publishedEntry || null;
  }

  /**
   * Compare two activity objects and generate a list of changes
   * Useful for tracking what fields changed during an update
   *
   * @param oldActivity - The activity state before the change
   * @param newActivity - The activity state after the change
   * @returns Array of changes detected between the two states
   */
  generateChangeList(
    oldActivity: Record<string, unknown>,
    newActivity: Record<string, unknown>
  ): HistoryChange[] {
    const changes: HistoryChange[] = [];
    const allKeys = new Set([
      ...Object.keys(oldActivity),
      ...Object.keys(newActivity),
    ]);

    for (const key of allKeys) {
      const oldValue = oldActivity[key];
      const newValue = newActivity[key];

      // Skip audit fields and internal fields
      if (
        key === 'id' ||
        key === 'createdDateTime' ||
        key === 'lastUpdatedDateTime' ||
        key === 'rowVersion' ||
        key === 'displayId'
      ) {
        continue;
      }

      // Compare values using deep equality (handles objects and arrays)
      if (!isDeepEqual(oldValue, newValue)) {
        changes.push({
          field: key,
          oldValue: oldValue ?? null,
          newValue: newValue ?? null,
        });
      }
    }

    return changes;
  }
}
