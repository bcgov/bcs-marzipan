import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityHistory,
  activitySubscriptions,
  categories,
  tags,
  users,
} from '@corpcal/database/schema';
import type { ActivityHistory } from '@corpcal/database/types';
import type {
  ActivityHistoryEntry,
  HistoryChange,
} from '@corpcal/shared/api/types';
import { isDeepEqual } from '@corpcal/shared/utils';

import type { DrizzleDbExecutor } from '../../database/database.provider';
import { DatabaseService } from '../../database/database.service';

// Raw row shape returned by DB queries for activity history
// Keep in sync with the selected columns used in queries below
type RawHistoryRow = {
  id: number;
  activityId: number;
  userId: number;
  actionType: string;
  changes: unknown;
  notes: string | null;
  timestamp: Date | string;
};

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
    tx?: DrizzleDbExecutor
  ): Promise<ActivityHistory> {
    const db = tx ?? this.databaseService.db;
    // Fetch denormalized fields in the caller to avoid expensive triggers on write
    const [activityRow] = await db
      .select({ title: activities.title, displayId: activities.displayId })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    const [userRow] = await db
      .select({ displayName: users.adDisplayName, username: users.adUsername })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const categoryRows = await db
      .select({ name: categories.displayName })
      .from(activityCategories)
      .leftJoin(categories, eq(activityCategories.categoryId, categories.id))
      .where(eq(activityCategories.activityId, activityId));

    const tagRows = await db
      .select({ name: tags.displayName })
      .from(activitySubscriptions)
      .leftJoin(tags, eq(activitySubscriptions.tagId, tags.id))
      .where(eq(activitySubscriptions.activityId, activityId));

    const categoryTagsText = [
      ...(categoryRows.map((r: any) => r.name).filter(Boolean) as string[]),
      ...(tagRows.map((r: any) => r.name).filter(Boolean) as string[]),
    ].join(' ');

    // Insert denormalized fields. The TypeScript DB schema may not include
    // these new columns yet, so cast the values to `any` to avoid type errors
    // while the DB migration is staged separately.
    const [historyEntry] = await db
      .insert(activityHistory)
      .values({
        activityId,
        userId,
        actionType,
        changes: changes ? (changes as unknown) : null,
        notes: notes || null,
        activityTitle: activityRow?.title ?? null,
        activityDisplayId: activityRow?.displayId ?? null,
        actorDisplayName: userRow?.displayName ?? null,
        actorUsername: userRow?.username ?? null,
        categoryTagsText: categoryTagsText || null,
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

  async getActivityHistoryForActivityIdsPaged(
    activityIds: number[] | null,
    opts: {
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
      query?: string;
      // optional keyset cursor: base64(JSON.stringify({ t: ISOString, id: number }))
      cursor?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<{
    items: ActivityHistoryEntry[];
    page: number;
    pageSize: number;
    hasNext: boolean;
    totalItems: number;
    nextCursor?: string | null;
  }> {
    const MAX_PAGE_SIZE = 100;
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.pageSize ?? 50));

    if (activityIds !== null && activityIds.length === 0) {
      return {
        items: [],
        page,
        pageSize,
        hasNext: false,
        totalItems: 0,
      };
    }

    const limit = pageSize + 1;
    const offset = (page - 1) * pageSize;

    const useKeyset = Boolean(opts.cursor);
    let cursorTimestamp: Date | null = null;
    let cursorId: number | null = null;
    if (useKeyset) {
      try {
        const decoded = Buffer.from(opts.cursor as string, 'base64').toString();
        const parsed = JSON.parse(decoded) as { t: string; id: number };
        cursorTimestamp = new Date(parsed.t);
        cursorId = parsed.id;
        if (Number.isNaN(cursorTimestamp.getTime())) {
          cursorTimestamp = null;
          cursorId = null;
        }
      } catch {
        cursorTimestamp = null;
        cursorId = null;
      }
    }

    const whereClauses: unknown[] = [];
    if (activityIds !== null) {
      whereClauses.push(inArray(activityHistory.activityId, activityIds));
    }

    if (opts.startDate) {
      // startDate expected in YYYY-MM-DD
      const startIso = new Date(`${opts.startDate}T00:00:00.000Z`);
      whereClauses.push(gte(activityHistory.timestamp, startIso));
    }

    if (opts.endDate) {
      // include the end date up to end of day
      const endIso = new Date(`${opts.endDate}T23:59:59.999Z`);
      whereClauses.push(lte(activityHistory.timestamp, endIso));
    }

    if (opts.query) {
      const raw = String(opts.query).trim();
      if (raw.length > 0) {
        // Date detection: YYYY-MM-DD or 'Mar 20' / 'March 20' (optionally with year)
        const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const monthDayMatch = raw.match(
          /^([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/
        );
        if (isoMatch) {
          const startIso = new Date(`${raw}T00:00:00.000Z`);
          const endIso = new Date(`${raw}T23:59:59.999Z`);
          whereClauses.push(gte(activityHistory.timestamp, startIso));
          whereClauses.push(lte(activityHistory.timestamp, endIso));
        } else if (monthDayMatch) {
          const monthName = monthDayMatch[1];
          const day = parseInt(monthDayMatch[2], 10);
          const year = monthDayMatch[3]
            ? parseInt(monthDayMatch[3], 10)
            : new Date().getFullYear();
          const parsed = new Date(`${monthName} ${day} ${year}`);
          if (!Number.isNaN(parsed.getTime())) {
            const startIso = new Date(
              Date.UTC(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate(),
                0,
                0,
                0,
                0
              )
            );
            const endIso = new Date(
              Date.UTC(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate(),
                23,
                59,
                59,
                999
              )
            );
            whereClauses.push(gte(activityHistory.timestamp, startIso));
            whereClauses.push(lte(activityHistory.timestamp, endIso));
          }
        } else {
          const q = raw.toLowerCase();
          const term = `%${q}%`;

          // Join activities and users for searching fields on those tables
          // We'll add joins later when building the query

          // Numeric-only queries — treat as activity id OR match number part of displayId
          if (/^\d+$/.test(q)) {
            const num = Number(q);
            whereClauses.push(
              sql`(
                ${activityHistory.activityId} = ${num}
                OR lower(${activities.displayId}) like ${term}
              )`
            );
          } else {
            // General text matching across several fields, plus category/tag EXISTS
            whereClauses.push(
              sql`(
                lower(${activityHistory.actionType}) like ${term}
                OR lower(${activityHistory.notes}) like ${term}
                OR lower(${activities.title}) like ${term}
                OR lower(${activities.displayId}) like ${term}
                OR lower(${users.adDisplayName}) like ${term}
                OR lower(${users.adUsername}) like ${term}
                OR EXISTS(
                  select 1 from activity_categories ac
                  join categories c on ac.category_id = c.id
                  where ac.activity_id = ${activityHistory.activityId}
                    and lower(c.display_name) like ${term}
                )
                OR EXISTS(
                  select 1 from activity_subscriptions s
                  join tags t on s.tag_id = t.id
                  where s.activity_id = ${activityHistory.activityId}
                    and lower(t.display_name) like ${term}
                )
              )`
            );
          }
        }
      }
    }

    const whereExpr =
      whereClauses.length > 1
        ? and(...(whereClauses as Parameters<typeof and>))
        : whereClauses[0];

    let qBuilder = this.databaseService.db
      .select({
        id: activityHistory.id,
        activityId: activityHistory.activityId,
        userId: activityHistory.userId,
        actionType: activityHistory.actionType,
        changes: activityHistory.changes,
        notes: activityHistory.notes,
        timestamp: activityHistory.timestamp,
      })
      .from(activityHistory);

    // If query included fields on activities or users, join those tables for filtering
    if (opts.query) {
      qBuilder = (qBuilder as any)
        .leftJoin(activities, eq(activityHistory.activityId, activities.id))
        .leftJoin(users, eq(activityHistory.userId, users.id));
    }

    // determine ordering (default: desc)
    const order = (opts as any).order === 'asc' ? 'asc' : 'desc';
    const orderByExpr =
      order === 'asc'
        ? [asc(activityHistory.timestamp), asc(activityHistory.id)]
        : [desc(activityHistory.timestamp), desc(activityHistory.id)];

    // If using keyset cursor, combine cursor condition with existing where expression
    let finalWhereExpr = whereExpr;
    if (useKeyset && cursorTimestamp && cursorId !== null) {
      // For asc ordering: timestamp > cursorTimestamp OR (timestamp = cursorTimestamp AND id > cursorId)
      // For desc ordering: timestamp < cursorTimestamp OR (timestamp = cursorTimestamp AND id < cursorId)
      const cursorCondition =
        order === 'asc'
          ? sql`(
              (${activityHistory.timestamp} > ${cursorTimestamp})
              OR (
                ${activityHistory.timestamp} = ${cursorTimestamp}
                AND ${activityHistory.id} > ${cursorId}
              )
            )`
          : sql`(
              (${activityHistory.timestamp} < ${cursorTimestamp})
              OR (
                ${activityHistory.timestamp} = ${cursorTimestamp}
                AND ${activityHistory.id} < ${cursorId}
              )
            )`;
      finalWhereExpr = finalWhereExpr
        ? and(finalWhereExpr as Parameters<typeof and>[0], cursorCondition)
        : cursorCondition;
    }

    const query = (qBuilder as any)
      .where(finalWhereExpr)
      .orderBy(...orderByExpr)
      .limit(limit);

    if (!useKeyset) {
      query.offset(offset);
    }

    // Build count query using same joins/where to get total matching rows.
    // For keyset pagination we avoid expensive COUNT(*) and return 0 for totalItems
    let totalCount = 0;
    if (!useKeyset) {
      let countBuilder: any = this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityHistory as any);
      if (opts.query) {
        countBuilder = countBuilder
          .leftJoin(activities, eq(activityHistory.activityId, activities.id))
          .leftJoin(users, eq(activityHistory.userId, users.id));
      }
      countBuilder = countBuilder.where(whereExpr);

      const [{ count } = { count: 0 }] = await countBuilder;
      totalCount = count ?? 0;
    }

    const historyEntries: RawHistoryRow[] = await query;

    const hasNext = historyEntries.length > pageSize;
    const pageItems: RawHistoryRow[] = historyEntries.slice(0, pageSize);

    // compute nextCursor for keyset flows
    let nextCursor: string | null = null;
    if (useKeyset && hasNext) {
      const last = pageItems[pageItems.length - 1];
      if (last) {
        const cursorObj = {
          t:
            last.timestamp instanceof Date
              ? last.timestamp.toISOString()
              : String(last.timestamp),
          id: last.id,
        };
        nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
      }
    } else if (useKeyset && !hasNext) {
      nextCursor = null;
    }

    const userIds: number[] = [
      ...new Set(pageItems.map((entry) => entry.userId)),
    ];
    const userMap = await this.getUserMap(userIds);

    const items = this.mapEntriesToResponse(pageItems, userMap);
    return {
      items,
      page,
      pageSize,
      hasNext,
      totalItems: totalCount ?? 0,
      nextCursor,
    };
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
