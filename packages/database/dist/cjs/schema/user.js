"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRelations = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const ministry_1 = require("./ministry");
/**
 * User table - System users for authentication and authorization
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/User.cs
 */
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull().default('ReadOnly'), // SecurityRole enum
    groupId: (0, pg_core_1.integer)('group_id'), // FK to Groups TODO
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    // Active Directory
    externalId: (0, pg_core_1.varchar)('external_id', { length: 255 }), // Active Directory user ID
    adUsername: (0, pg_core_1.varchar)('ad_username', { length: 255 }), // Active Directory username
    adDisplayName: (0, pg_core_1.varchar)('ad_display_name', { length: 255 }), // Active Directory display name
    adEmail: (0, pg_core_1.varchar)('ad_email', { length: 255 }), // Active Directory email
    adPhone: (0, pg_core_1.varchar)('ad_phone', { length: 50 }), // Active Directory phone
    adDivision: (0, pg_core_1.varchar)('ad_division', { length: 255 }), // Active Directory division
    adDepartment: (0, pg_core_1.varchar)('ad_department', { length: 255 }), // Active Directory department
    adJobTitle: (0, pg_core_1.varchar)('ad_job_title', { length: 255 }), // Active Directory job title
    // Additional user info
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    notes: (0, pg_core_1.text)('notes'),
    // Audit fields
    lastLoginDateTime: (0, pg_core_1.timestamp)('last_login_date_time', { withTimezone: true }),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }),
    createdBy: (0, pg_core_1.integer)('created_by'), // FK to User (self-reference)
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by'), // FK to User (self-reference)
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
// Relations for User
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    // Self-referential relations for audit fields
    // Using the table directly since it's in the same file
    creator: one(exports.users, {
        fields: [exports.users.createdBy],
        references: [exports.users.id],
        relationName: 'createdBy',
    }),
    updater: one(exports.users, {
        fields: [exports.users.lastUpdatedBy],
        references: [exports.users.id],
        relationName: 'updatedBy',
    }),
    // Relations to other tables - using string references to avoid circular dependencies
    // Note: Reverse relations are defined in activity.ts and ministry.ts
    createdPods: many(ministry_1.pods, { relationName: 'podCreator' }),
    updatedPods: many(ministry_1.pods, { relationName: 'podUpdater' }),
}));
