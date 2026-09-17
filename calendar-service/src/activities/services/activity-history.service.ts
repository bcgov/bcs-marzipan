import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityHistory,
  activitySubscriptions,
  categories,
  ministries,
  organizations,
  tags,
  teams,
  users,
} from '@corpcal/database/schema';
import type { ActivityHistory } from '@corpcal/database/types';
import {
  pacificCalendarDayEndInstant,
  pacificCalendarDayStartInstant,
} from '@corpcal/shared';
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
   * Record Look Ahead status resets for many activities with batched reads and a
   * single multi-row insert (same denormalized columns as {@link recordChange}).
   */
  async recordLookAheadStatusResetBatch(
    tx: DrizzleDbExecutor,
    params: {
      actorUserId: number;
      entries: Array<{
        activityId: number;
        oldLookAheadStatus: string | null;
      }>;
      notes: string;
    }
  ): Promise<void> {
    await this.recordLookAheadStatusChangeBatch(tx, {
      actorUserId: params.actorUserId,
      notes: params.notes,
      entries: params.entries.map((entry) => ({
        activityId: entry.activityId,
        oldLookAheadStatus: entry.oldLookAheadStatus,
        newLookAheadStatus: 'none',
      })),
    });
  }

  async recordLookAheadStatusChangeBatch(
    tx: DrizzleDbExecutor,
    params: {
      actorUserId: number;
      entries: Array<{
        activityId: number;
        oldLookAheadStatus: string | null;
        newLookAheadStatus: string | null;
      }>;
      notes: string;
    }
  ): Promise<void> {
    const { actorUserId, entries, notes } = params;
    if (entries.length === 0) return;

    const activityIds = entries.map((e) => e.activityId);
    const db = tx;

    const [userRow] = await db
      .select({
        displayName: users.adDisplayName,
        username: users.adUsername,
      })
      .from(users)
      .where(eq(users.id, actorUserId))
      .limit(1);

    const activityRows = await db
      .select({
        id: activities.id,
        title: activities.title,
        displayId: activities.displayId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const activityMap = new Map(activityRows.map((a) => [a.id, a]));

    const categoryNameRows = await db
      .select({
        activityId: activityCategories.activityId,
        name: categories.displayName,
      })
      .from(activityCategories)
      .leftJoin(categories, eq(activityCategories.categoryId, categories.id))
      .where(inArray(activityCategories.activityId, activityIds));

    const tagNameRows = await db
      .select({
        activityId: activitySubscriptions.activityId,
        name: tags.displayName,
      })
      .from(activitySubscriptions)
      .leftJoin(tags, eq(activitySubscriptions.tagId, tags.id))
      .where(inArray(activitySubscriptions.activityId, activityIds));

    const namesByActivity = new Map<number, string[]>();
    for (const id of activityIds) {
      namesByActivity.set(id, []);
    }
    for (const row of categoryNameRows) {
      if (row.name) {
        const list = namesByActivity.get(row.activityId) ?? [];
        list.push(row.name);
        namesByActivity.set(row.activityId, list);
      }
    }
    for (const row of tagNameRows) {
      if (row.name) {
        const list = namesByActivity.get(row.activityId) ?? [];
        list.push(row.name);
        namesByActivity.set(row.activityId, list);
      }
    }

    const valueRows = entries.map((entry) => {
      const act = activityMap.get(entry.activityId);
      const tagParts = namesByActivity.get(entry.activityId) ?? [];
      const changes: HistoryChange[] = [
        {
          field: 'lookAheadStatus',
          oldValue: entry.oldLookAheadStatus,
          newValue: entry.newLookAheadStatus,
        },
      ];
      return {
        activityId: entry.activityId,
        userId: actorUserId,
        actionType: 'updated',
        changes: changes,
        notes: notes || null,
        activityTitle: act?.title ?? null,
        activityDisplayId: act?.displayId ?? null,
        actorDisplayName: userRow?.displayName ?? null,
        actorUsername: userRow?.username ?? null,
        categoryTagsText: tagParts.length > 0 ? tagParts.join(' ') : null,
      };
    });

    await db.insert(activityHistory).values(valueRows);
  }

  /**
   * Record `displayId` changes for many activities (e.g. cascade from a team or
   * ministry abbreviation change) with batched reads and a single multi-row
   * insert. Each entry produces one `'updated'` history row containing a single
   * `{ field: 'displayId' }` change. The denormalized `activityDisplayId`
   * column stores the **new** value so history reflects post-update state.
   */
  async recordDisplayIdChangeBatch(
    tx: DrizzleDbExecutor,
    params: {
      actorUserId: number;
      entries: Array<{
        activityId: number;
        oldDisplayId: string | null;
        newDisplayId: string;
      }>;
      notes: string;
    }
  ): Promise<void> {
    const { actorUserId, entries, notes } = params;
    if (entries.length === 0) return;

    const activityIds = entries.map((e) => e.activityId);
    const db = tx;

    const [userRow] = await db
      .select({
        displayName: users.adDisplayName,
        username: users.adUsername,
      })
      .from(users)
      .where(eq(users.id, actorUserId))
      .limit(1);

    const activityRows = await db
      .select({
        id: activities.id,
        title: activities.title,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const activityMap = new Map(activityRows.map((a) => [a.id, a]));

    const categoryNameRows = await db
      .select({
        activityId: activityCategories.activityId,
        name: categories.displayName,
      })
      .from(activityCategories)
      .leftJoin(categories, eq(activityCategories.categoryId, categories.id))
      .where(inArray(activityCategories.activityId, activityIds));

    const tagNameRows = await db
      .select({
        activityId: activitySubscriptions.activityId,
        name: tags.displayName,
      })
      .from(activitySubscriptions)
      .leftJoin(tags, eq(activitySubscriptions.tagId, tags.id))
      .where(inArray(activitySubscriptions.activityId, activityIds));

    const namesByActivity = new Map<number, string[]>();
    for (const id of activityIds) {
      namesByActivity.set(id, []);
    }
    for (const row of categoryNameRows) {
      if (row.name) {
        const list = namesByActivity.get(row.activityId) ?? [];
        list.push(row.name);
        namesByActivity.set(row.activityId, list);
      }
    }
    for (const row of tagNameRows) {
      if (row.name) {
        const list = namesByActivity.get(row.activityId) ?? [];
        list.push(row.name);
        namesByActivity.set(row.activityId, list);
      }
    }

    const valueRows = entries.map((entry) => {
      const act = activityMap.get(entry.activityId);
      const tagParts = namesByActivity.get(entry.activityId) ?? [];
      const changes: HistoryChange[] = [
        {
          field: 'displayId',
          oldValue: entry.oldDisplayId,
          newValue: entry.newDisplayId,
        },
      ];
      return {
        activityId: entry.activityId,
        userId: actorUserId,
        actionType: 'updated',
        changes: changes,
        notes: notes || null,
        activityTitle: act?.title ?? null,
        activityDisplayId: entry.newDisplayId,
        actorDisplayName: userRow?.displayName ?? null,
        actorUsername: userRow?.username ?? null,
        categoryTagsText: tagParts.length > 0 ? tagParts.join(' ') : null,
      };
    });

    await db.insert(activityHistory).values(valueRows);
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
      // startDate expected in YYYY-MM-DD (Pacific calendar day)
      const startIso = pacificCalendarDayStartInstant(opts.startDate);
      if (startIso) {
        whereClauses.push(gte(activityHistory.timestamp, startIso));
      }
    }

    if (opts.endDate) {
      // include the end date through end of Pacific calendar day
      const endIso = pacificCalendarDayEndInstant(opts.endDate);
      if (endIso) {
        whereClauses.push(lte(activityHistory.timestamp, endIso));
      }
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
          const startIso = pacificCalendarDayStartInstant(raw);
          const endIso = pacificCalendarDayEndInstant(raw);
          if (startIso && endIso) {
            whereClauses.push(gte(activityHistory.timestamp, startIso));
            whereClauses.push(lte(activityHistory.timestamp, endIso));
          }
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
   * Resolves the userId values inside a comms-contacts array to display names,
   * returning `{ userName: string; isLead: boolean }[]` for human-readable
   * history storage.  Any userId not found in the DB falls back to `"User {id}"`.
   */
  async resolveCommsContacts(
    db: DrizzleDbExecutor,
    contacts: Array<{ userId: number; isLead: boolean }>
  ): Promise<Array<{ userName: string; isLead: boolean }>> {
    if (contacts.length === 0) return [];

    const userIds = [...new Set(contacts.map((c) => c.userId))];
    const rows = await db
      .select({
        id: users.id,
        adDisplayName: users.adDisplayName,
        adUsername: users.adUsername,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    const nameMap = new Map<number, string>();
    for (const r of rows) {
      nameMap.set(r.id, r.adDisplayName || r.adUsername || `User ${r.id}`);
    }

    return contacts.map((c) => ({
      userName: nameMap.get(c.userId) ?? `User ${c.userId}`,
      isLead: c.isLead,
    }));
  }

  /**
   * Fetches display-name maps for user, team, ministry, and org IDs that appear
   * in the given old/new activity objects for the five FK fields that store raw
   * IDs (lastUpdatedBy, createdBy, leadTeamId, leadMinistryId, leadOrgId).
   *
   * Returns a map of field name → (id → displayName) so that
   * generateChangeList can substitute readable labels instead of numeric IDs.
   */
  async buildEntityResolutionMaps(
    db: DrizzleDbExecutor,
    oldActivity: Record<string, unknown>,
    newActivity: Record<string, unknown>
  ): Promise<Map<string, Map<number, string>>> {
    const result = new Map<string, Map<number, string>>();

    const collectIds = (field: string): number[] => {
      const ids = new Set<number>();
      for (const obj of [oldActivity, newActivity]) {
        const v = obj[field];
        if (typeof v === 'number') ids.add(v);
      }
      return [...ids];
    };

    // Users: lastUpdatedBy, createdBy
    const userIds = [
      ...new Set([...collectIds('lastUpdatedBy'), ...collectIds('createdBy')]),
    ];
    if (userIds.length > 0) {
      const rows = await db
        .select({
          id: users.id,
          adDisplayName: users.adDisplayName,
          adUsername: users.adUsername,
        })
        .from(users)
        .where(inArray(users.id, userIds));
      const userMap = new Map<number, string>();
      for (const r of rows) {
        userMap.set(r.id, r.adDisplayName || r.adUsername || `User ${r.id}`);
      }
      result.set('lastUpdatedBy', userMap);
      result.set('createdBy', userMap);
    }

    // Teams: leadTeamId
    const teamIds = collectIds('leadTeamId');
    if (teamIds.length > 0) {
      const rows = await db
        .select({
          id: teams.id,
          displayName: teams.displayName,
          name: teams.name,
        })
        .from(teams)
        .where(inArray(teams.id, teamIds));
      const teamMap = new Map<number, string>();
      for (const r of rows) {
        teamMap.set(r.id, r.displayName || r.name);
      }
      result.set('leadTeamId', teamMap);
    }

    // Ministries: leadMinistryId
    const ministryIds = collectIds('leadMinistryId');
    if (ministryIds.length > 0) {
      const rows = await db
        .select({ id: ministries.id, displayName: ministries.displayName })
        .from(ministries)
        .where(inArray(ministries.id, ministryIds));
      const ministryMap = new Map<number, string>();
      for (const r of rows) {
        ministryMap.set(r.id, r.displayName);
      }
      result.set('leadMinistryId', ministryMap);
    }

    // Organizations: leadOrgId
    const orgIds = collectIds('leadOrgId');
    if (orgIds.length > 0) {
      const rows = await db
        .select({
          id: organizations.id,
          displayName: organizations.displayName,
        })
        .from(organizations)
        .where(inArray(organizations.id, orgIds));
      const orgMap = new Map<number, string>();
      for (const r of rows) {
        orgMap.set(r.id, r.displayName);
      }
      result.set('leadOrgId', orgMap);
    }

    return result;
  }

  /**
   * Compare two activity objects and generate a list of changes
   * Useful for tracking what fields changed during an update
   *
   * @param oldActivity - The activity state before the change
   * @param newActivity - The activity state after the change
   * @param resolutions - Optional map of field name → (id → displayName) for
   *   resolving FK fields to human-readable values before storing in history
   * @returns Array of changes detected between the two states
   */
  generateChangeList(
    oldActivity: Record<string, unknown>,
    newActivity: Record<string, unknown>,
    resolutions?: Map<string, Map<number, string>>
  ): HistoryChange[] {
    const changes: HistoryChange[] = [];
    const allKeys = new Set([
      ...Object.keys(oldActivity),
      ...Object.keys(newActivity),
    ]);

    const resolve = (field: string, value: unknown): unknown => {
      if (resolutions && typeof value === 'number') {
        const map = resolutions.get(field);
        if (map) return map.get(value) ?? value;
      }
      return value;
    };

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
          oldValue: resolve(key, oldValue) ?? null,
          newValue: resolve(key, newValue) ?? null,
        });
      }
    }

    return changes;
  }
}
