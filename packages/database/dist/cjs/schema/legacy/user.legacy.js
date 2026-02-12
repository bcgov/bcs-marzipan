"use strict";
/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemUserMinistriesRelations = exports.systemUserMinistries = exports.systemUsersRelations = exports.systemUsers = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const ministry_legacy_1 = require("./ministry.legacy");
const relations_legacy_1 = require("./relations.legacy");
/**
 * SystemUser table - System users for authentication and authorization
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/SystemUser.cs
 */
exports.systemUsers = (0, pg_core_1.pgTable)('system_users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 255 }).notNull().unique(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 255 }),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 255 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull().default('ReadOnly'), // SecurityRole enum
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    // Active Directory
    externalId: (0, pg_core_1.varchar)('external_id', { length: 255 }), // Keycloak user ID
    adUsername: (0, pg_core_1.varchar)('ad_username', { length: 255 }), // Legacy Active Directory username
    // Additional user info
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    department: (0, pg_core_1.varchar)('department', { length: 255 }),
    notes: (0, pg_core_1.text)('notes'),
    // Audit fields
    lastLoginDateTime: (0, pg_core_1.timestamp)('last_login_date_time', { withTimezone: true }),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }),
    createdBy: (0, pg_core_1.integer)('created_by'), // FK to SystemUser (self-reference)
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by'), // FK to SystemUser (self-reference)
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
// Relations for SystemUser
exports.systemUsersRelations = (0, drizzle_orm_1.relations)(exports.systemUsers, ({ one, many }) => ({
    // Self-referential relations for audit fields
    // Using the table directly since it's in the same file
    creator: one(exports.systemUsers, {
        fields: [exports.systemUsers.createdBy],
        references: [exports.systemUsers.id],
        relationName: 'createdBy',
    }),
    updater: one(exports.systemUsers, {
        fields: [exports.systemUsers.lastUpdatedBy],
        references: [exports.systemUsers.id],
        relationName: 'updatedBy',
    }),
    // Relations to other tables - using string references to avoid circular dependencies
    // Note: Reverse relations are defined in activity.ts and ministry.ts
    systemUserMinistries: many(exports.systemUserMinistries),
    favoriteActivities: many(relations_legacy_1.favoriteActivities),
}));
/**
 * SystemUserMinistry junction table - Many-to-many relationship between SystemUsers and Ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/SystemUserMinistry.cs
 */
exports.systemUserMinistries = (0, pg_core_1.pgTable)('system_user_ministries', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL, Identity) in SystemUserMinistry.cs
    systemUserId: (0, pg_core_1.integer)('system_user_id').references(() => exports.systemUsers.id), // int, nullable in SystemUserMinistry.cs - FK to SystemUser
    ministryId: (0, pg_core_1.uuid)('ministry_id').references(() => ministry_legacy_1.ministries.id), // uniqueidentifier, nullable in SystemUserMinistry.cs - FK to Ministry
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit (NOT NULL) in SystemUserMinistry.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // datetime, nullable in SystemUserMinistry.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => exports.systemUsers.id), // int, nullable in SystemUserMinistry.cs - FK to SystemUser
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }), // datetime, nullable in SystemUserMinistry.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => exports.systemUsers.id), // int, nullable in SystemUserMinistry.cs - FK to SystemUser
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // timestamp (NOT NULL, Computed) in SystemUserMinistry.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // uniqueidentifier (NOT NULL) in SystemUserMinistry.cs
});
// Relations for SystemUserMinistry
exports.systemUserMinistriesRelations = (0, drizzle_orm_1.relations)(exports.systemUserMinistries, ({ one }) => ({
    systemUser: one(exports.systemUsers, {
        fields: [exports.systemUserMinistries.systemUserId],
        references: [exports.systemUsers.id],
    }),
    ministry: one(ministry_legacy_1.ministries, {
        fields: [exports.systemUserMinistries.ministryId],
        references: [ministry_legacy_1.ministries.id],
    }),
    createdByUser: one(exports.systemUsers, {
        fields: [exports.systemUserMinistries.createdBy],
        references: [exports.systemUsers.id],
        relationName: 'systemUserMinistryCreatedBy',
    }),
    updatedByUser: one(exports.systemUsers, {
        fields: [exports.systemUserMinistries.lastUpdatedBy],
        references: [exports.systemUsers.id],
        relationName: 'systemUserMinistryUpdatedBy',
    }),
}));
