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

import { teams } from './teams';
import { users } from './user';

/**
 * TeamHistory table - Tracks all changes to teams (create, update including ministry list).
 * Mirrors user_history / activity_history pattern with notes field for audit trail.
 * Action types: 'created', 'updated' (ministry add/remove is part of updated changes).
 */
export const teamHistory = pgTable(
  'team_history',
  {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    changedByUserId: integer('changed_by_user_id')
      .notNull()
      .references(() => users.id),
    actionType: varchar('action_type', { length: 50 }).notNull(), // 'created', 'updated'
    changes: jsonb('changes'), // Array of change objects: [{field, oldValue, newValue}]
    notes: text('notes'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('team_history_team_id_idx').on(table.teamId),
    index('team_history_changed_by_user_id_idx').on(table.changedByUserId),
    index('team_history_timestamp_idx').on(table.timestamp),
    index('team_history_team_id_timestamp_idx').on(
      table.teamId,
      table.timestamp
    ),
  ]
);

export const teamHistoryRelations = relations(teamHistory, ({ one }) => ({
  team: one(teams, {
    fields: [teamHistory.teamId],
    references: [teams.id],
    relationName: 'teamHistoryTeam',
  }),
  changedByUser: one(users, {
    fields: [teamHistory.changedByUserId],
    references: [users.id],
    relationName: 'teamHistoryChangedBy',
  }),
}));
