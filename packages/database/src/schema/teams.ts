import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { podSharedWithTeams } from './ministry';
import { permissions, roles } from './rbac';
import { teamCategories, teamMinistries, userTeams } from './relations';
import { users } from './user';

/**
 * TeamPermissions junction table - Maps permissions granted by team (for field-level etc.)
 * Used in effective permissions union at login; no seed data in initial phase.
 */
export const teamPermissions = pgTable(
  'team_permissions',
  {
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.permissionId] })]
);

export const teamPermissionsRelations = relations(
  teamPermissions,
  ({ one }) => ({
    team: one(teams, {
      fields: [teamPermissions.teamId],
      references: [teams.id],
    }),
    permission: one(permissions, {
      fields: [teamPermissions.permissionId],
      references: [permissions.id],
    }),
  })
);

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
  roleId: integer('role_id').references(() => roles.id, {
    onDelete: 'set null',
  }),
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
  role: one(roles, {
    fields: [teams.roleId],
    references: [roles.id],
  }),
  teamCategories: many(teamCategories),
  teamMinistries: many(teamMinistries),
  teamPermissions: many(teamPermissions),
  userTeams: many(userTeams),
  podSharedWithTeams: many(podSharedWithTeams, {
    relationName: 'teamPodSharedWithTeams',
  }),
}));
