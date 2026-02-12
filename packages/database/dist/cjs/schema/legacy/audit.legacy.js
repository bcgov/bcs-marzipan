"use strict";
/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsFeedsRelations = exports.logsRelations = exports.newsFeeds = exports.logs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const activity_legacy_1 = require("./activity.legacy");
const user_legacy_1 = require("./user.legacy");
const ministry_legacy_1 = require("./ministry.legacy");
/**
 * Log table - Activity change log/audit trail
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Log.cs
 */
exports.logs = (0, pg_core_1.pgTable)('logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL, Identity) in Log.cs
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // int (NOT NULL) in Log.cs - FK to Activity
    logType: (0, pg_core_1.integer)('log_type').notNull(), // int (NOT NULL) in Log.cs - Type of log entry
    tableName: (0, pg_core_1.varchar)('table_name', { length: 50 }), // nvarchar(50), nullable in Log.cs
    fieldName: (0, pg_core_1.varchar)('field_name', { length: 1000 }), // nvarchar(1000), nullable in Log.cs
    oldValue: (0, pg_core_1.varchar)('old_value', { length: 1000 }), // nvarchar(1000), nullable in Log.cs
    newValue: (0, pg_core_1.varchar)('new_value', { length: 1000 }), // nvarchar(1000), nullable in Log.cs
    operation: (0, pg_core_1.varchar)('operation', { length: 50 }).notNull(), // nvarchar(50), NOT NULL in Log.cs
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit (NOT NULL) in Log.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // datetime, nullable in Log.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // int, nullable in Log.cs - FK to SystemUser
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime (NOT NULL) in Log.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // int, nullable in Log.cs - FK to SystemUser
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // timestamp (NOT NULL, Computed) in Log.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // uniqueidentifier (NOT NULL) in Log.cs
});
/**
 * NewsFeed table - News feed entries related to activities and ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/NewsFeed.cs
 */
exports.newsFeeds = (0, pg_core_1.pgTable)('news_feeds', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL, Identity) in NewsFeed.cs
    activityId: (0, pg_core_1.integer)('activity_id').references(() => activity_legacy_1.activities.id), // int, nullable in NewsFeed.cs - FK to Activity
    ministryId: (0, pg_core_1.uuid)('ministry_id')
        .notNull()
        .references(() => ministry_legacy_1.ministries.id), // uniqueidentifier (NOT NULL) in NewsFeed.cs - FK to Ministry
    text: (0, pg_core_1.varchar)('text', { length: 1000 }), // nvarchar(1000), nullable in NewsFeed.cs
    description: (0, pg_core_1.varchar)('description', { length: 50 }), // nvarchar(50), nullable in NewsFeed.cs
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit (NOT NULL) in NewsFeed.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // datetime, nullable in NewsFeed.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // int, nullable in NewsFeed.cs - FK to SystemUser
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }), // datetime, nullable in NewsFeed.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // int, nullable in NewsFeed.cs - FK to SystemUser
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // timestamp (NOT NULL, Computed) in NewsFeed.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // uniqueidentifier (NOT NULL) in NewsFeed.cs
});
// Relations for Log
exports.logsRelations = (0, drizzle_orm_1.relations)(exports.logs, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.logs.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.logs.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'logCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.logs.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'logUpdatedBy',
    }),
}));
// Relations for NewsFeed
exports.newsFeedsRelations = (0, drizzle_orm_1.relations)(exports.newsFeeds, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.newsFeeds.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    ministry: one(ministry_legacy_1.ministries, {
        fields: [exports.newsFeeds.ministryId],
        references: [ministry_legacy_1.ministries.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.newsFeeds.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'newsFeedCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.newsFeeds.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'newsFeedUpdatedBy',
    }),
}));
