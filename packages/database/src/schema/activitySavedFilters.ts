import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
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
 * Stores filterState (JSON) + searchKeyword in a global activity-list scope.
 * Per-user default for auto-apply is stored in user_activity_saved_filter_defaults.
 * Supports user-private, team-scoped, and global sharing via scopeType and scopeTeamId.
 */
export const activitySavedFilters = pgTable(
  'activity_saved_filters',
  {
    id: serial('id').primaryKey(),

    ownerUserId: integer('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 80 }).notNull(),

    /** Serialized ActivityFilterState object. */
    filterState: jsonb('filter_state').notNull(),

    searchKeyword: text('search_keyword').notNull().default(''),

    sortOrder: integer('sort_order').notNull().default(0),

    isActive: boolean('is_active').notNull().default(true),

    /**
     * Sharing scope type.
     * - 'user': private saved filter owned by a single user
     * - 'team': shared with members of scopeTeamId
     * - 'global': shared across the application
     */
    scopeType: varchar('scope_type', { length: 20 }).notNull().default('user'),

    /** Team ID when scopeType='team'; NULL for user-private and global filters. */
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
    scopeTypeIdx: index('asf_scope_type_idx').on(table.scopeType),
    scopeTeamIdx: index('asf_scope_team_id_idx').on(table.scopeTeamId),
    scopeTypeCheck: check(
      'asf_scope_type_check',
      sql`${table.scopeType} IN ('user', 'team', 'global')`
    ),
    scopeTeamConstraintCheck: check(
      'asf_scope_team_scope_check',
      sql`(
        (${table.scopeType} = 'team' AND ${table.scopeTeamId} IS NOT NULL)
        OR
        (${table.scopeType} IN ('user', 'global') AND ${table.scopeTeamId} IS NULL)
      )`
    ),
    uniqueUserScopeName: uniqueIndex('asf_unique_user_scope_name')
      .on(table.ownerUserId, sql`lower(${table.name})`)
      .where(sql`is_active = true AND scope_type = 'user'`),
    uniqueTeamScopeName: uniqueIndex('asf_unique_team_scope_name')
      .on(table.scopeTeamId, sql`lower(${table.name})`)
      .where(sql`is_active = true AND scope_type = 'team'`),
    uniqueGlobalScopeName: uniqueIndex('asf_unique_global_scope_name')
      .on(sql`lower(${table.name})`)
      .where(sql`is_active = true AND scope_type = 'global'`),
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
