import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { activityHistory, users } from '@corpcal/database/schema';
import type { ActivityHistory } from '@corpcal/database/types';
import type {
  ActivityHistoryEntry,
  HistoryChange,
} from '@corpcal/shared/api/types';

import { DatabaseService } from '../../database/database.service';

/**
 * Service for tracking and retrieving activity change history
 */
@Injectable()
export class ActivityHistoryService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Deep equality comparison for any two values
   * Handles primitives, arrays, and objects recursively
   */
  private isDeepEqual(a: unknown, b: unknown): boolean {
    // Handle null/undefined
    if (a === null || a === undefined) {
      return b === null || b === undefined;
    }
    if (b === null || b === undefined) {
      return a === null || a === undefined;
    }

    // Handle primitives
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.isDeepEqual(val, b[idx]));
    }

    // Handle objects
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      this.isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  /**
   * Record a change to an activity
   * @param activityId - ID of the activity being changed
   * @param userId - ID of the user making the change
   * @param actionType - Type of action: 'created', 'updated', 'deleted', 'published', 'draft_saved', etc.
   * @param changes - Array of field-level changes (optional)
   * @param notes - Optional notes about the change
   */
  async recordChange(
    activityId: number,
    userId: number,
    actionType: string,
    changes?: HistoryChange[],
    notes?: string
  ): Promise<ActivityHistory> {
    const [historyEntry] = await this.databaseService.db
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
    const userMap = new Map(
      userRows.map((u) => [
        u.id,
        u.adDisplayName || u.adUsername || `User ${u.id}`,
      ])
    );

    return historyEntries.map((entry) => ({
      ...entry,
      changes: (entry.changes as ActivityHistoryEntry['changes']) ?? null,
      timestamp:
        entry.timestamp instanceof Date
          ? entry.timestamp.toISOString()
          : String(entry.timestamp),
      userName: userMap.get(entry.userId) ?? `User ${entry.userId}`,
    }));
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
      if (!this.isDeepEqual(oldValue, newValue)) {
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
