import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { activities } from './activity';
import { governmentRepresentatives } from './lookups';
import { ministryUsers } from './relations';
import { teams } from './teams';
import { users } from './user';

/**
 * Ministry table - Government departments
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Ministry.cs
 * TODO: Consider ministry API for future.
 * TODO: This is a blend of ministries and groups. Use as basis for future group table.
 */
export const ministries = pgTable('ministries', {
  id: uuid('id').primaryKey().defaultRandom(),
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 10 }).notNull(),

  // Minister information
  ministerName: varchar('minister_name', { length: 255 }),

  // Contacts
  contactUserId: integer('contact_user_id').references(() => users.id), // FK to User
  secondContactUserId: integer('second_contact_user_id').references(
    () => users.id
  ), // FK to User

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

export const ministriesRelations = relations(ministries, ({ one, many }) => ({
  contactUser: one(users, {
    fields: [ministries.contactUserId],
    references: [users.id],
    relationName: 'contactUser',
  }),
  secondContactUser: one(users, {
    fields: [ministries.secondContactUserId],
    references: [users.id],
    relationName: 'secondContactUser',
  }),
  children: many(ministries, { relationName: 'parent' }),
  activities: many(activities),
  ministryUsers: many(ministryUsers),
  governmentRepresentatives: many(governmentRepresentatives),
  podMinistries: many(podMinistries, { relationName: 'ministryPodMinistries' }),
}));

/**
 * Pods table - Collections of ministries defined by users
 * Admins and editors can create pods with global, team-scoped, or private visibility.
 * Users access pods through their team memberships.
 */
export const pods = pgTable('pods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: varchar('description', { length: 500 }),
  visibility: varchar('visibility', { length: 50 })
    .notNull()
    .default('private'), // 'global', 'team', 'private'
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * PodMinistries junction table - Many-to-many relationship between Pods and Ministries
 * Defines which ministries are included in a pod
 */
export const podMinistries = pgTable(
  'pod_ministries',
  {
    podId: integer('pod_id')
      .notNull()
      .references(() => pods.id),
    ministryId: uuid('ministry_id')
      .notNull()
      .references(() => ministries.id),
    isPrimary: boolean('is_primary').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.podId, table.ministryId] })]
);

/**
 * PodSharedWithTeams junction table - Many-to-many relationship between Pods and Teams
 * Defines which teams can access a pod (used when visibility is 'team')
 */
export const podSharedWithTeams = pgTable(
  'pod_shared_with_teams',
  {
    podId: integer('pod_id')
      .notNull()
      .references(() => pods.id),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.podId, table.teamId] })]
);

// Relations for Pods
export const podsRelations = relations(pods, ({ one, many }) => ({
  creator: one(users, {
    fields: [pods.createdBy],
    references: [users.id],
    relationName: 'podCreator',
  }),
  updater: one(users, {
    fields: [pods.lastUpdatedBy],
    references: [users.id],
    relationName: 'podUpdater',
  }),
  ministries: many(podMinistries),
  sharedWithTeams: many(podSharedWithTeams),
}));

// Relations for PodMinistries
export const podMinistriesRelations = relations(podMinistries, ({ one }) => ({
  pod: one(pods, {
    fields: [podMinistries.podId],
    references: [pods.id],
  }),
  ministry: one(ministries, {
    fields: [podMinistries.ministryId],
    references: [ministries.id],
  }),
}));

// Relations for PodSharedWithTeams
export const podSharedWithTeamsRelations = relations(
  podSharedWithTeams,
  ({ one }) => ({
    pod: one(pods, {
      fields: [podSharedWithTeams.podId],
      references: [pods.id],
    }),
    team: one(teams, {
      fields: [podSharedWithTeams.teamId],
      references: [teams.id],
    }),
  })
);
