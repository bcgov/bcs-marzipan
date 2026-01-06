import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * SystemUser table - System users for authentication and authorization
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/SystemUser.cs
 */

export const systemUsers = pgTable('system_users', {
  id: serial('id').primaryKey(),
  role: varchar('role', { length: 50 }).notNull().default('ReadOnly'), // SecurityRole enum
  groupId: integer('group_id'), // FK to Groups TODO
  isActive: boolean('is_active').notNull().default(true),

  // Active Directory
  externalId: varchar('external_id', { length: 255 }), // Active Directory user ID
  adUsername: varchar('ad_username', { length: 255 }), // Active Directory username
  adDisplayName: varchar('ad_display_name', { length: 255 }), // Active Directory display name
  adEmail: varchar('ad_email', { length: 255 }), // Active Directory email
  adPhone: varchar('ad_phone', { length: 50 }), // Active Directory phone
  adDivision: varchar('ad_division', { length: 255 }), // Active Directory division
  adDepartment: varchar('ad_department', { length: 255 }), // Active Directory department
  adJobTitle: varchar('ad_job_title', { length: 255 }), // Active Directory job title
  // Additional user info
  phone: varchar('phone', { length: 50 }),
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
export const systemUsersRelations = relations(systemUsers, ({ one }) => ({
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
}));
