"use strict";
/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityFilters = exports.tags = exports.themes = exports.categories = exports.videographers = exports.eventPlanners = exports.communicationContacts = exports.governmentRepresentatives = exports.cities = exports.statuses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
/**
 * Status lookup table - Activity statuses
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Status.cs
 */
exports.statuses = (0, pg_core_1.pgTable)('statuses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * City lookup table - Cities for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/City.cs
 */
exports.cities = (0, pg_core_1.pgTable)('cities', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL) in City.cs
    name: (0, pg_core_1.varchar)('name', { length: 50 }), // string (nullable) in City.cs
    isActive: (0, pg_core_1.boolean)('is_active'), // Nullable<bool> in City.cs
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in City.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid'), // Nullable<Guid> in City.cs
    sortOrder: (0, pg_core_1.integer)('sort_order'), // Nullable<int> in City.cs
});
/**
 * Government Representative lookup table - Representatives for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/GovernmentRepresentative.cs
 */
exports.governmentRepresentatives = (0, pg_core_1.pgTable)('government_representatives', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    title: (0, pg_core_1.varchar)('title', { length: 255 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Communication Contact lookup table - Communication contacts for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/CommunicationContact.cs
 */
exports.communicationContacts = (0, pg_core_1.pgTable)('communication_contacts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Event Planner lookup table - Event planners for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/EventPlanner.cs
 */
exports.eventPlanners = (0, pg_core_1.pgTable)('event_planners', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Videographer lookup table - Videographers for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Videographer.cs
 */
exports.videographers = (0, pg_core_1.pgTable)('videographers', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Category lookup table - Classification categories for activities
 * Extensible by admins via admin UI.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Category.cs
 */
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // PK, int, not null
    name: (0, pg_core_1.varchar)('name', { length: 50 }), // nvarchar50, null
    sortOrder: (0, pg_core_1.integer)('sort_order'), // int, null
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit, not null
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // Timestamp, not null
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // unique identifier, not null
});
/**
 * Theme lookup table - Classification themes for activities
 * Uses UUID primary key (unlike Category which uses serial).
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Theme.cs
 */
exports.themes = (0, pg_core_1.pgTable)('themes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    key: (0, pg_core_1.varchar)('key', { length: 100 }),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
    topReleaseId: (0, pg_core_1.uuid)('top_release_id'), // FK to News Release (integration)
    featureReleaseId: (0, pg_core_1.uuid)('feature_release_id'), // FK to News Release (integration)
});
/**
 * Tag lookup table - Classification tags for activities
 * Uses UUID primary key (unlike Category which uses serial).
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Tag.cs
 */
exports.tags = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    key: (0, pg_core_1.varchar)('key', { length: 100 }),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
});
/**
 * ActivityFilter table - Saved filter queries for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityFilter.cs
 */
exports.activityFilters = (0, pg_core_1.pgTable)('activity_filters', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL) in ActivityFilter.cs
    queryString: (0, pg_core_1.varchar)('query_string', { length: 300 }), // string (nullable) in ActivityFilter.cs
    name: (0, pg_core_1.varchar)('name', { length: 200 }), // string (nullable) in ActivityFilter.cs
    sortOrder: (0, pg_core_1.integer)('sort_order'), // Nullable<int> in ActivityFilter.cs
    isActive: (0, pg_core_1.boolean)('is_active'), // Nullable<bool> in ActivityFilter.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivityFilter.cs
    createdBy: (0, pg_core_1.integer)('created_by'), // Nullable<int> in ActivityFilter.cs - FK to SystemUser
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }), // Nullable<DateTime> in ActivityFilter.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by'), // Nullable<int> in ActivityFilter.cs - FK to SystemUser
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivityFilter.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid'), // Nullable<Guid> in ActivityFilter.cs
});
// Relations for lookup tables
// Note: Reverse relations are defined in activity.ts to avoid circular dependencies
