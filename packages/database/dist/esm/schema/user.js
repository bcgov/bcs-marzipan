import { pgTable, serial, varchar, integer, boolean, text, timestamp, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pods } from './ministry';
/**
 * User table - System users for authentication and authorization
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/User.cs
 */
export const users = pgTable('users', {
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
    createdBy: integer('created_by'), // FK to User (self-reference)
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    }),
    lastUpdatedBy: integer('last_updated_by'), // FK to User (self-reference)
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
// Relations for User
export const usersRelations = relations(users, ({ one, many }) => ({
    // Self-referential relations for audit fields
    // Using the table directly since it's in the same file
    creator: one(users, {
        fields: [users.createdBy],
        references: [users.id],
        relationName: 'createdBy',
    }),
    updater: one(users, {
        fields: [users.lastUpdatedBy],
        references: [users.id],
        relationName: 'updatedBy',
    }),
    // Relations to other tables - using string references to avoid circular dependencies
    // Note: Reverse relations are defined in activity.ts and ministry.ts
    createdPods: many(pods, { relationName: 'podCreator' }),
    updatedPods: many(pods, { relationName: 'podUpdater' }),
}));
