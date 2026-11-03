import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { governmentRepresentatives } from './lookups';
import { ministryGroups } from './ministry-groups';
import { organizations } from './organizations';
import { ministryUsers } from './relations';
import { teams } from './teams';
import { users } from './user';

/**
 * Ministry extension — 1:1 with an organization row (shared id).
 * Catalog fields (name, displayName, abbreviation, sort, active) live on `organizations`.
 */
export const ministries = pgTable('ministries', {
  id: integer('id')
    .primaryKey()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  /**
   * Designated minister (government representative) for this ministry.
   * FK to government_representatives.id is enforced in SQL migrations.
   */
  ministerGovernmentRepId: integer('minister_government_rep_id'),

  contactUserId: integer('contact_user_id').references(() => users.id),
  secondContactUserId: integer('second_contact_user_id').references(
    () => users.id
  ),

  ministryGroupId: integer('ministry_group_id').references(
    () => ministryGroups.id,
    { onDelete: 'set null' }
  ),

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
  organization: one(organizations, {
    fields: [ministries.id],
    references: [organizations.id],
  }),
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
  ministryGroup: one(ministryGroups, {
    fields: [ministries.ministryGroupId],
    references: [ministryGroups.id],
  }),
  ministerRep: one(governmentRepresentatives, {
    fields: [ministries.ministerGovernmentRepId],
    references: [governmentRepresentatives.id],
  }),
  ministryUsers: many(ministryUsers),
  podMinistries: many(podMinistries, { relationName: 'ministryPodMinistries' }),
}));

export const ministryGroupsRelations = relations(
  ministryGroups,
  ({ many }) => ({
    ministries: many(ministries),
  })
);

/**
 * Pods table - Collections of ministries defined by users
 */
export const pods = pgTable('pods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: varchar('description', { length: 500 }),
  visibility: varchar('visibility', { length: 50 })
    .notNull()
    .default('private'),
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

export const podMinistries = pgTable(
  'pod_ministries',
  {
    podId: integer('pod_id')
      .notNull()
      .references(() => pods.id),
    ministryId: integer('ministry_id')
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
