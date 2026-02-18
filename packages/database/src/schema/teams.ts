import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { podSharedWithTeams } from './ministry';
import { teamCategories, teamMinistries, userTeams } from './relations';
import { users } from './user';

/**
 * Teams table - Groups of users
 * Represents a group of users and is used to scope data access to activities, categories, tags, etc.
 */
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

// Relations for Teams
export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
    relationName: 'teamCreator',
  }),
  updater: one(users, {
    fields: [teams.lastUpdatedBy],
    references: [users.id],
    relationName: 'teamUpdater',
  }),
  teamCategories: many(teamCategories),
  teamMinistries: many(teamMinistries),
  userTeams: many(userTeams),
  podSharedWithTeams: many(podSharedWithTeams, {
    relationName: 'teamPodSharedWithTeams',
  }),
}));
