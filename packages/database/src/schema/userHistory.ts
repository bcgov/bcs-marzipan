import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * UserHistory table - Tracks all admin changes to users (teams, roles, status, transfers)
 * Mirrors activity_history pattern including notes field for audit trail.
 */
export const userHistory = pgTable(
  'user_history',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    changedByUserId: integer('changed_by_user_id')
      .notNull()
      .references(() => users.id),
    actionType: varchar('action_type', { length: 50 }).notNull(), // 'team_added', 'team_removed', 'team_role_changed', 'role_changed', 'activated', 'deactivated', 'activities_transferred', etc.
    changes: jsonb('changes'), // Array of change objects: [{field, oldValue, newValue}]
    notes: text('notes'), // Admin notes explaining the change
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('user_history_user_id_idx').on(table.userId),
    index('user_history_changed_by_user_id_idx').on(table.changedByUserId),
    index('user_history_timestamp_idx').on(table.timestamp),
    index('user_history_user_id_timestamp_idx').on(
      table.userId,
      table.timestamp
    ),
  ]
);

export const userHistoryRelations = relations(userHistory, ({ one }) => ({
  user: one(users, {
    fields: [userHistory.userId],
    references: [users.id],
    relationName: 'userHistoryUser',
  }),
  changedByUser: one(users, {
    fields: [userHistory.changedByUserId],
    references: [users.id],
    relationName: 'userHistoryChangedBy',
  }),
}));
