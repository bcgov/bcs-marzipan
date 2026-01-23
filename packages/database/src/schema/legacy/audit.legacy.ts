/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */

import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activities } from './activity.legacy';
import { systemUsers } from './user.legacy';
import { ministries } from './ministry.legacy';

/**
 * Log table - Activity change log/audit trail
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Log.cs
 */
export const logs = pgTable('logs', {
  id: serial('id').primaryKey(), // int (NOT NULL, Identity) in Log.cs
  activityId: integer('activity_id')
    .notNull()
    .references(() => activities.id), // int (NOT NULL) in Log.cs - FK to Activity
  logType: integer('log_type').notNull(), // int (NOT NULL) in Log.cs - Type of log entry
  tableName: varchar('table_name', { length: 50 }), // nvarchar(50), nullable in Log.cs
  fieldName: varchar('field_name', { length: 1000 }), // nvarchar(1000), nullable in Log.cs
  oldValue: varchar('old_value', { length: 1000 }), // nvarchar(1000), nullable in Log.cs
  newValue: varchar('new_value', { length: 1000 }), // nvarchar(1000), nullable in Log.cs
  operation: varchar('operation', { length: 50 }).notNull(), // nvarchar(50), NOT NULL in Log.cs
  isActive: boolean('is_active').notNull().default(true), // bit (NOT NULL) in Log.cs
  createdDateTime: timestamp('created_date_time', { withTimezone: true }), // datetime, nullable in Log.cs
  createdBy: integer('created_by').references(() => systemUsers.id), // int, nullable in Log.cs - FK to SystemUser
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(), // datetime (NOT NULL) in Log.cs
  lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // int, nullable in Log.cs - FK to SystemUser
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(), // timestamp (NOT NULL, Computed) in Log.cs
  rowGuid: uuid('row_guid').notNull().defaultRandom(), // uniqueidentifier (NOT NULL) in Log.cs
});

/**
 * NewsFeed table - News feed entries related to activities and ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/NewsFeed.cs
 */
export const newsFeeds = pgTable('news_feeds', {
  id: serial('id').primaryKey(), // int (NOT NULL, Identity) in NewsFeed.cs
  activityId: integer('activity_id').references(() => activities.id), // int, nullable in NewsFeed.cs - FK to Activity
  ministryId: uuid('ministry_id')
    .notNull()
    .references(() => ministries.id), // uniqueidentifier (NOT NULL) in NewsFeed.cs - FK to Ministry
  text: varchar('text', { length: 1000 }), // nvarchar(1000), nullable in NewsFeed.cs
  description: varchar('description', { length: 50 }), // nvarchar(50), nullable in NewsFeed.cs
  isActive: boolean('is_active').notNull().default(true), // bit (NOT NULL) in NewsFeed.cs
  createdDateTime: timestamp('created_date_time', { withTimezone: true }), // datetime, nullable in NewsFeed.cs
  createdBy: integer('created_by').references(() => systemUsers.id), // int, nullable in NewsFeed.cs - FK to SystemUser
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  }), // datetime, nullable in NewsFeed.cs
  lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // int, nullable in NewsFeed.cs - FK to SystemUser
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(), // timestamp (NOT NULL, Computed) in NewsFeed.cs
  rowGuid: uuid('row_guid').notNull().defaultRandom(), // uniqueidentifier (NOT NULL) in NewsFeed.cs
});

// Relations for Log
export const logsRelations = relations(logs, ({ one }) => ({
  activity: one(activities, {
    fields: [logs.activityId],
    references: [activities.id],
  }),
  createdByUser: one(systemUsers, {
    fields: [logs.createdBy],
    references: [systemUsers.id],
    relationName: 'logCreatedBy',
  }),
  updatedByUser: one(systemUsers, {
    fields: [logs.lastUpdatedBy],
    references: [systemUsers.id],
    relationName: 'logUpdatedBy',
  }),
}));

// Relations for NewsFeed
export const newsFeedsRelations = relations(newsFeeds, ({ one }) => ({
  activity: one(activities, {
    fields: [newsFeeds.activityId],
    references: [activities.id],
  }),
  ministry: one(ministries, {
    fields: [newsFeeds.ministryId],
    references: [ministries.id],
  }),
  createdByUser: one(systemUsers, {
    fields: [newsFeeds.createdBy],
    references: [systemUsers.id],
    relationName: 'newsFeedCreatedBy',
  }),
  updatedByUser: one(systemUsers, {
    fields: [newsFeeds.lastUpdatedBy],
    references: [systemUsers.id],
    relationName: 'newsFeedUpdatedBy',
  }),
}));
