/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
import { pgTable, serial, varchar, integer, boolean, text, timestamp, uuid, } from 'drizzle-orm/pg-core';
/**
 * Status lookup table - Activity statuses
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Status.cs
 */
export const statuses = pgTable('statuses', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * City lookup table - Cities for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/City.cs
 */
export const cities = pgTable('cities', {
    id: serial('id').primaryKey(), // int (NOT NULL) in City.cs
    name: varchar('name', { length: 50 }), // string (nullable) in City.cs
    isActive: boolean('is_active'), // Nullable<bool> in City.cs
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in City.cs
    rowGuid: uuid('row_guid'), // Nullable<Guid> in City.cs
    sortOrder: integer('sort_order'), // Nullable<int> in City.cs
});
/**
 * Government Representative lookup table - Representatives for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/GovernmentRepresentative.cs
 */
export const governmentRepresentatives = pgTable('government_representatives', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    title: varchar('title', { length: 255 }),
    email: varchar('email', { length: 255 }),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Communication Contact lookup table - Communication contacts for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/CommunicationContact.cs
 */
export const communicationContacts = pgTable('communication_contacts', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Event Planner lookup table - Event planners for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/EventPlanner.cs
 */
export const eventPlanners = pgTable('event_planners', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Videographer lookup table - Videographers for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Videographer.cs
 */
export const videographers = pgTable('videographers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * Category lookup table - Classification categories for activities
 * Extensible by admins via admin UI.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Category.cs
 */
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(), // PK, int, not null
    name: varchar('name', { length: 50 }), // nvarchar50, null
    sortOrder: integer('sort_order'), // int, null
    isActive: boolean('is_active').notNull().default(true), // bit, not null
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // Timestamp, not null
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // unique identifier, not null
});
/**
 * Theme lookup table - Classification themes for activities
 * Uses UUID primary key (unlike Category which uses serial).
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Theme.cs
 */
export const themes = pgTable('themes', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 100 }),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
    topReleaseId: uuid('top_release_id'), // FK to News Release (integration)
    featureReleaseId: uuid('feature_release_id'), // FK to News Release (integration)
});
/**
 * Tag lookup table - Classification tags for activities
 * Uses UUID primary key (unlike Category which uses serial).
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Tag.cs
 */
export const tags = pgTable('tags', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 100 }),
    displayName: varchar('display_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
});
/**
 * ActivityFilter table - Saved filter queries for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityFilter.cs
 */
export const activityFilters = pgTable('activity_filters', {
    id: serial('id').primaryKey(), // int (NOT NULL) in ActivityFilter.cs
    queryString: varchar('query_string', { length: 300 }), // string (nullable) in ActivityFilter.cs
    name: varchar('name', { length: 200 }), // string (nullable) in ActivityFilter.cs
    sortOrder: integer('sort_order'), // Nullable<int> in ActivityFilter.cs
    isActive: boolean('is_active'), // Nullable<bool> in ActivityFilter.cs
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivityFilter.cs
    createdBy: integer('created_by'), // Nullable<int> in ActivityFilter.cs - FK to SystemUser
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    }), // Nullable<DateTime> in ActivityFilter.cs
    lastUpdatedBy: integer('last_updated_by'), // Nullable<int> in ActivityFilter.cs - FK to SystemUser
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivityFilter.cs
    rowGuid: uuid('row_guid'), // Nullable<Guid> in ActivityFilter.cs
});
// Relations for lookup tables
// Note: Reverse relations are defined in activity.ts to avoid circular dependencies
