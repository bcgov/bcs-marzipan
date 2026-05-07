import { relations } from 'drizzle-orm';
import {
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
 *   - At most one flag per (activity, team) pair.
 *   - Any team member with activities.flag permission can set or remove the flag.
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
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.activityId, table.teamId)]
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
