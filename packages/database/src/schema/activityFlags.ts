import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { activities } from './activity';
import { teams } from './teams';
import { users } from './user';

/**
 * ActivityFlags table - Tracks which user is assigned ("flagged") per activity per team.
 * Rules:
 *   - Multiple assignees are allowed per (activity, team) pair.
 *   - At most one row per (activity, team, assignee) tuple.
 *   - Any team member with activities.flag permission can set or replace the flag.
 *   - Any active team member can remove the flag (no flag permission required).
 *   - Removing is done by deleting the row.
 */
export const activityFlags = pgTable(
  'activity_flags',
  {
    id: serial('id').primaryKey(),
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    assigneeId: integer('assignee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedById: integer('assigned_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayTeamId: integer('display_team_id').references(() => teams.id, {
      onDelete: 'set null',
    }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.activityId, table.teamId, table.assigneeId),
    index('activity_flags_activity_id_team_id_idx').on(
      table.activityId,
      table.teamId
    ),
  ]
);

export const activityFlagsRelations = relations(activityFlags, ({ one }) => ({
  activity: one(activities, {
    fields: [activityFlags.activityId],
    references: [activities.id],
  }),
  team: one(teams, {
    fields: [activityFlags.teamId],
    references: [teams.id],
  }),
  displayTeam: one(teams, {
    fields: [activityFlags.displayTeamId],
    references: [teams.id],
    relationName: 'displayTeam',
  }),
  assignee: one(users, {
    fields: [activityFlags.assigneeId],
    references: [users.id],
    relationName: 'flagAssignee',
  }),
  assignedBy: one(users, {
    fields: [activityFlags.assignedById],
    references: [users.id],
    relationName: 'flagAssignedBy',
  }),
}));
