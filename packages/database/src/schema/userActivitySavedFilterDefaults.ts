import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { activitySavedFilters } from './activitySavedFilters';
import { users } from './user';

/**
 * Per-user default saved filter for an activity list context (tab).
 * References a visible row in activity_saved_filters.
 */
export const userActivitySavedFilterDefaults = pgTable(
  'user_activity_saved_filter_defaults',
  {
    id: serial('id').primaryKey(),

    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    contextKey: varchar('context_key', { length: 100 }).notNull(),

    savedFilterId: integer('saved_filter_id')
      .notNull()
      .references(() => activitySavedFilters.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userContextUnique: uniqueIndex('uasfd_user_context_unique').on(
      table.userId,
      table.contextKey
    ),
    userIdx: index('uasfd_user_id_idx').on(table.userId),
    savedFilterIdx: index('uasfd_saved_filter_id_idx').on(table.savedFilterId),
  })
);

export const userActivitySavedFilterDefaultsRelations = relations(
  userActivitySavedFilterDefaults,
  ({ one }) => ({
    user: one(users, {
      fields: [userActivitySavedFilterDefaults.userId],
      references: [users.id],
    }),
    savedFilter: one(activitySavedFilters, {
      fields: [userActivitySavedFilterDefaults.savedFilterId],
      references: [activitySavedFilters.id],
    }),
  })
);

export type UserActivitySavedFilterDefault =
  typeof userActivitySavedFilterDefaults.$inferSelect;
export type NewUserActivitySavedFilterDefault =
  typeof userActivitySavedFilterDefaults.$inferInsert;
