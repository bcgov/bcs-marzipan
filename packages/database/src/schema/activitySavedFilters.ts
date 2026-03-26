import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * ActivitySavedFilters table - User-scoped saved filter presets for the activity list.
 * Stores filterState (JSON) + searchKeyword per user per context (tab).
 * Supports a single default per user+context for auto-apply on page load.
 * Schema includes nullable team-sharing columns for future shared-filter support.
 */
export const activitySavedFilters = pgTable(
  'activity_saved_filters',
  {
    id: serial('id').primaryKey(),

    ownerUserId: integer('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Stable key identifying the activity list tab (e.g. 'all', 'my-activities', 'ministry:team:5'). */
    contextKey: varchar('context_key', { length: 100 }).notNull(),

    name: varchar('name', { length: 80 }).notNull(),

    /** Serialized ActivityFilterState object. */
    filterState: jsonb('filter_state').notNull(),

    searchKeyword: text('search_keyword').notNull().default(''),

    isDefault: boolean('is_default').notNull().default(false),

    sortOrder: integer('sort_order').notNull().default(0),

    isActive: boolean('is_active').notNull().default(true),

    /**
     * Future: scope type for sharing. 'user' = private, 'team' = shared with a team.
     * V1 enforces 'user' only.
     */
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('user'),

    /** Future: team ID when scopeType='team'. NULL for user-private filters. */
    scopeTeamId: integer('scope_team_id'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index('asf_owner_user_id_idx').on(table.ownerUserId),
    contextIdx: index('asf_context_key_idx').on(
      table.ownerUserId,
      table.contextKey
    ),
    uniqueName: uniqueIndex('asf_unique_name')
      .on(table.ownerUserId, table.contextKey, table.name)
      .where(sql`is_active = true`),
    scopeTeamIdx: index('asf_scope_team_id_idx').on(table.scopeTeamId),
  })
);

export const activitySavedFiltersRelations = relations(
  activitySavedFilters,
  ({ one }) => ({
    owner: one(users, {
      fields: [activitySavedFilters.ownerUserId],
      references: [users.id],
    }),
  })
);

export type ActivitySavedFilter = typeof activitySavedFilters.$inferSelect;
export type NewActivitySavedFilter = typeof activitySavedFilters.$inferInsert;
