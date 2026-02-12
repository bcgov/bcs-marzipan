/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
import { pgTable, integer, boolean, timestamp, uuid, primaryKey, serial, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activities } from './activity.legacy';
import { themes, tags, categories } from './lookups.legacy';
import { systemUsers } from './user.legacy';
import { ministries } from './ministry.legacy';
/**
 * ActivityThemes junction table - Many-to-many relationship between Activities and Themes
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityThemes.cs
 */
export const activityThemes = pgTable('activity_themes', {
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // PK, FK, int, not null
    themeId: uuid('theme_id')
        .notNull()
        .references(() => themes.id), // PK, FK, uniqueidentifier, not null
    isActive: boolean('is_active').notNull().default(true), // bit, not null
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(), // datetime, not null
    createdBy: integer('created_by')
        .notNull()
        .references(() => systemUsers.id), // int, not null
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: integer('last_updated_by')
        .notNull()
        .references(() => systemUsers.id), // int, not null
}, (table) => ({
    pk: primaryKey({ columns: [table.activityId, table.themeId] }),
}));
/**
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
 */
export const activityTags = pgTable('activity_tags', {
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // PK, FK, int, not null
    tagId: uuid('tag_id')
        .notNull()
        .references(() => tags.id), // PK, FK, uniqueidentifier, not null
    isActive: boolean('is_active').notNull().default(true), // bit, not null
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(), // datetime, not null
    createdBy: integer('created_by')
        .notNull()
        .references(() => systemUsers.id), // int, not null
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: integer('last_updated_by')
        .notNull()
        .references(() => systemUsers.id), // int, not null
}, (table) => ({
    pk: primaryKey({ columns: [table.activityId, table.tagId] }),
}));
// Relations for junction tables
export const activityThemesRelations = relations(activityThemes, ({ one }) => ({
    activity: one(activities, {
        fields: [activityThemes.activityId],
        references: [activities.id],
    }),
    theme: one(themes, {
        fields: [activityThemes.themeId],
        references: [themes.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activityThemes.createdBy],
        references: [systemUsers.id],
        relationName: 'activityThemeCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityThemes.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityThemeUpdatedBy',
    }),
}));
export const activityTagsRelations = relations(activityTags, ({ one }) => ({
    activity: one(activities, {
        fields: [activityTags.activityId],
        references: [activities.id],
    }),
    tag: one(tags, {
        fields: [activityTags.tagId],
        references: [tags.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activityTags.createdBy],
        references: [systemUsers.id],
        relationName: 'activityTagCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityTags.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityTagUpdatedBy',
    }),
}));
/**
 * ActivityCategories junction table - Many-to-many relationship between Activities and Categories
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityCategories.cs
 */
export const activityCategories = pgTable('activity_categories', {
    id: serial('id').primaryKey(), // PK, int, not null
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // FK, int, not null
    categoryId: integer('category_id')
        .notNull()
        .references(() => categories.id), // FK, int, not null
    isActive: boolean('is_active').notNull().default(true), // bit, not null
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // datetime, null
    createdBy: integer('created_by').references(() => systemUsers.id), // FK, int, null
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // FK, int, null
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // Timestamp, not null
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // unique identifier, not null
});
/**
 * ActivityCommunicationMaterials junction table - Many-to-many relationship between Activities and CommunicationMaterials
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityCommunicationMaterial.cs
 */
export const activityCommunicationMaterials = pgTable('activity_communication_materials', {
    id: serial('id').primaryKey(), // int (NOT NULL) in ActivityCommunicationMaterial.cs
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // int (NOT NULL) in ActivityCommunicationMaterial.cs
    communicationMaterialId: integer('communication_material_id').notNull(), // int (NOT NULL) in ActivityCommunicationMaterial.cs - FK to CommunicationMaterial
    isActive: boolean('is_active').notNull().default(true), // bool (NOT NULL) in ActivityCommunicationMaterial.cs
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivityCommunicationMaterial.cs
    createdBy: integer('created_by').references(() => systemUsers.id), // Nullable<int> in ActivityCommunicationMaterial.cs
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // DateTime (NOT NULL) in ActivityCommunicationMaterial.cs
    lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // Nullable<int> in ActivityCommunicationMaterial.cs
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivityCommunicationMaterial.cs
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivityCommunicationMaterial.cs
});
/**
 * ActivityInitiatives junction table - Many-to-many relationship between Activities and Initiatives
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityInitiatives.cs
 */
export const activityInitiatives = pgTable('activity_initiatives', {
    id: serial('id').primaryKey(), // PK, int, not null
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // FK, int, not null
    initiativeId: integer('initiative_id').notNull(), // FK, int, not null (Initiative table not yet defined)
    isActive: boolean('is_active').notNull().default(true), // bit, not null
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // datetime, null
    createdBy: integer('created_by').references(() => systemUsers.id), // FK, int, null
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null (verified from ActivityInitiative.cs)
    lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // FK, int, null
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // timestamp (byte[] in C#), not null
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // uniqueidentifier, not null
});
/**
 * ActivityKeywords junction table - Many-to-many relationship between Activities and Keywords
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityKeywords.cs
 */
export const activityKeywords = pgTable('activity_keywords', {
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // PK, FK, int, not null
    keywordId: integer('keyword_id').notNull(), // PK, FK, int, not null (Keyword table not yet defined)
    isActive: boolean('is_active').notNull().default(true), // bit, not null
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: integer('last_updated_by')
        .notNull()
        .references(() => systemUsers.id), // int, not null
}, (table) => ({
    pk: primaryKey({ columns: [table.activityId, table.keywordId] }),
}));
/**
 * ActivityNROrigins junction table - Many-to-many relationship between Activities and NROrigins
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityNROrigins.cs
 */
export const activityNROrigins = pgTable('activity_nr_origins', {
    id: serial('id').primaryKey(), // int (NOT NULL) in ActivityNROrigin.cs
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // int (NOT NULL) in ActivityNROrigin.cs
    nrOriginId: integer('nr_origin_id').notNull(), // int (NOT NULL) in ActivityNROrigin.cs - FK to NROrigin
    isActive: boolean('is_active').notNull().default(true), // bool (NOT NULL) in ActivityNROrigin.cs
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivityNROrigin.cs
    createdBy: integer('created_by').references(() => systemUsers.id), // Nullable<int> in ActivityNROrigin.cs
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // DateTime (NOT NULL) in ActivityNROrigin.cs
    lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // Nullable<int> in ActivityNROrigin.cs
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivityNROrigin.cs
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivityNROrigin.cs
});
/**
 * ActivitySectors junction table - Many-to-many relationship between Activities and Sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySectors.cs
 */
export const activitySectors = pgTable('activity_sectors', {
    id: serial('id').primaryKey(), // int (NOT NULL) in ActivitySector.cs
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // int (NOT NULL) in ActivitySector.cs
    sectorId: uuid('sector_id').notNull(), // Guid (NOT NULL) in ActivitySector.cs - FK to Sector
    isActive: boolean('is_active').notNull().default(true), // bool (NOT NULL) in ActivitySector.cs
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivitySector.cs
    createdBy: integer('created_by').references(() => systemUsers.id), // Nullable<int> in ActivitySector.cs
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // DateTime (NOT NULL) in ActivitySector.cs
    lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // Nullable<int> in ActivitySector.cs
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivitySector.cs
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivitySector.cs
});
/**
 * ActivitySharedWith junction table - Many-to-many relationship between Activities and Ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySharedWith.cs
 */
export const activitySharedWith = pgTable('activity_shared_with', {
    id: serial('id').primaryKey(), // int (NOT NULL) in ActivitySharedWith.cs
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // int (NOT NULL) in ActivitySharedWith.cs
    ministryId: uuid('ministry_id')
        .notNull()
        .references(() => ministries.id), // Guid (NOT NULL) in ActivitySharedWith.cs
    isActive: boolean('is_active').notNull().default(true), // bool (NOT NULL) in ActivitySharedWith.cs
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivitySharedWith.cs
    createdBy: integer('created_by').references(() => systemUsers.id), // Nullable<int> in ActivitySharedWith.cs
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    }), // Nullable<DateTime> in ActivitySharedWith.cs
    lastUpdatedBy: integer('last_updated_by').references(() => systemUsers.id), // Nullable<int> in ActivitySharedWith.cs
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivitySharedWith.cs
    rowGuid: uuid('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivitySharedWith.cs
});
// Relations for new junction tables
export const activityCategoriesRelations = relations(activityCategories, ({ one }) => ({
    activity: one(activities, {
        fields: [activityCategories.activityId],
        references: [activities.id],
    }),
    category: one(categories, {
        fields: [activityCategories.categoryId],
        references: [categories.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activityCategories.createdBy],
        references: [systemUsers.id],
        relationName: 'activityCategoryCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityCategories.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityCategoryUpdatedBy',
    }),
}));
export const activityCommunicationMaterialsRelations = relations(activityCommunicationMaterials, ({ one }) => ({
    activity: one(activities, {
        fields: [activityCommunicationMaterials.activityId],
        references: [activities.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activityCommunicationMaterials.createdBy],
        references: [systemUsers.id],
        relationName: 'activityCommunicationMaterialCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityCommunicationMaterials.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityCommunicationMaterialUpdatedBy',
    }),
}));
export const activityInitiativesRelations = relations(activityInitiatives, ({ one }) => ({
    activity: one(activities, {
        fields: [activityInitiatives.activityId],
        references: [activities.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activityInitiatives.createdBy],
        references: [systemUsers.id],
        relationName: 'activityInitiativeCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityInitiatives.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityInitiativeUpdatedBy',
    }),
}));
export const activityKeywordsRelations = relations(activityKeywords, ({ one }) => ({
    activity: one(activities, {
        fields: [activityKeywords.activityId],
        references: [activities.id],
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityKeywords.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityKeywordUpdatedBy',
    }),
}));
export const activityNROriginsRelations = relations(activityNROrigins, ({ one }) => ({
    activity: one(activities, {
        fields: [activityNROrigins.activityId],
        references: [activities.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activityNROrigins.createdBy],
        references: [systemUsers.id],
        relationName: 'activityNROriginCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activityNROrigins.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activityNROriginUpdatedBy',
    }),
}));
export const activitySectorsRelations = relations(activitySectors, ({ one }) => ({
    activity: one(activities, {
        fields: [activitySectors.activityId],
        references: [activities.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activitySectors.createdBy],
        references: [systemUsers.id],
        relationName: 'activitySectorCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activitySectors.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activitySectorUpdatedBy',
    }),
}));
export const activitySharedWithRelations = relations(activitySharedWith, ({ one }) => ({
    activity: one(activities, {
        fields: [activitySharedWith.activityId],
        references: [activities.id],
    }),
    ministry: one(ministries, {
        fields: [activitySharedWith.ministryId],
        references: [ministries.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activitySharedWith.createdBy],
        references: [systemUsers.id],
        relationName: 'activitySharedWithCreatedBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activitySharedWith.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'activitySharedWithUpdatedBy',
    }),
}));
/**
 * FavoriteActivity junction table - Many-to-many relationship between SystemUsers and Activities (Watch Lists/Favorites)
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/FavoriteActivity.cs
 */
export const favoriteActivities = pgTable('favorite_activities', {
    systemUserId: integer('system_user_id')
        .notNull()
        .references(() => systemUsers.id), // int (NOT NULL) in FavoriteActivity.cs - FK to SystemUser (part of composite PK)
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id), // int (NOT NULL) in FavoriteActivity.cs - FK to Activity (part of composite PK)
}, (table) => ({
    pk: primaryKey({ columns: [table.systemUserId, table.activityId] }),
}));
// Relations for FavoriteActivity
export const favoriteActivitiesRelations = relations(favoriteActivities, ({ one }) => ({
    systemUser: one(systemUsers, {
        fields: [favoriteActivities.systemUserId],
        references: [systemUsers.id],
    }),
    activity: one(activities, {
        fields: [favoriteActivities.activityId],
        references: [activities.id],
    }),
}));
