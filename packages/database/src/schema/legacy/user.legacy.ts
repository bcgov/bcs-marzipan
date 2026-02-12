/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */

import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { ministries } from './ministry.legacy';
import { favoriteActivities } from './relations.legacy';

/**
 * SystemUser table - System users for authentication and authorization
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/SystemUser.cs
 */

export const systemUsers = pgTable('system_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('ReadOnly'), // SecurityRole enum
  isActive: boolean('is_active').notNull().default(true),

  // Active Directory
  externalId: varchar('external_id', { length: 255 }), // Keycloak user ID
  adUsername: varchar('ad_username', { length: 255 }), // Legacy Active Directory username

  // Additional user info
  phone: varchar('phone', { length: 50 }),
  department: varchar('department', { length: 255 }),
  notes: text('notes'),

  // Audit fields
  lastLoginDateTime: timestamp('last_login_date_time', { withTimezone: true }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true }),
  createdBy: integer('created_by'), // FK to SystemUser (self-reference)
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  }),
  lastUpdatedBy: integer('last_updated_by'), // FK to SystemUser (self-reference)
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations for SystemUser
export const systemUsersRelations = relations(systemUsers, ({ one, many }) => ({
  // Self-referential relations for audit fields
  // Using the table directly since it's in the same file
  creator: one(systemUsers, {
    fields: [systemUsers.createdBy],
    references: [systemUsers.id],
    relationName: 'createdBy',
  }),
  updater: one(systemUsers, {
    fields: [systemUsers.lastUpdatedBy],
    references: [systemUsers.id],
    relationName: 'updatedBy',
  }),

  // Relations to other tables - using string references to avoid circular dependencies
  // Note: Reverse relations are defined in activity.ts and ministry.ts
  systemUserMinistries: many(systemUserMinistries),
  favoriteActivities: many(favoriteActivities),
}));

/**
 * SystemUserMinistry junction table - Many-to-many relationship between SystemUsers and Ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/SystemUserMinistry.cs
 */
export const systemUserMinistries = pgTable('system_user_ministries', {
  id: serial('id').primaryKey(), // int (NOT NULL, Identity) in SystemUserMinistry.cs
  systemUserId: integer('system_user_id').references(() => systemUsers.id), // int, nullable in SystemUserMinistry.cs - FK to SystemUser
  ministryId: uuid('ministry_id').references(() => ministries.id), // uniqueidentifier, nullable in SystemUserMinistry.cs - FK to Ministry
  isActive: boolean('is_active').notNull().default(true), // bit (NOT NULL) in SystemUserMinistry.cs
  createdDateTime: timestamp('created_date_time', { withTimezone: true }), // datetime, nullable in SystemUserMinistry.cs
  createdBy: integer('created_by').references(() => systemUsers.id), // int, nullable in SystemUserMinistry.cs - FK to SystemUser
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  }), // datetime, nullable in SystemUserMinistry.cs
  lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // int, nullable in SystemUserMinistry.cs - FK to SystemUser
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(), // timestamp (NOT NULL, Computed) in SystemUserMinistry.cs
  rowGuid: uuid('row_guid').notNull().defaultRandom(), // uniqueidentifier (NOT NULL) in SystemUserMinistry.cs
});

// Relations for SystemUserMinistry
export const systemUserMinistriesRelations = relations(
  systemUserMinistries,
  ({ one }) => ({
    systemUser: one(systemUsers, {
      fields: [systemUserMinistries.systemUserId],
      references: [systemUsers.id],
    }),
    ministry: one(ministries, {
      fields: [systemUserMinistries.ministryId],
      references: [ministries.id],
    }),
    createdByUser: one(systemUsers, {
      fields: [systemUserMinistries.createdBy],
      references: [systemUsers.id],
      relationName: 'systemUserMinistryCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
      fields: [systemUserMinistries.lastUpdatedBy],
      references: [systemUsers.id],
      relationName: 'systemUserMinistryUpdatedBy',
    }),
  })
);
