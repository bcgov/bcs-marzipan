"use strict";
/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoriteActivitiesRelations = exports.favoriteActivities = exports.activitySharedWithRelations = exports.activitySectorsRelations = exports.activityNROriginsRelations = exports.activityKeywordsRelations = exports.activityInitiativesRelations = exports.activityCommunicationMaterialsRelations = exports.activityCategoriesRelations = exports.activitySharedWith = exports.activitySectors = exports.activityNROrigins = exports.activityKeywords = exports.activityInitiatives = exports.activityCommunicationMaterials = exports.activityCategories = exports.activityTagsRelations = exports.activityThemesRelations = exports.activityTags = exports.activityThemes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const activity_legacy_1 = require("./activity.legacy");
const lookups_legacy_1 = require("./lookups.legacy");
const user_legacy_1 = require("./user.legacy");
const ministry_legacy_1 = require("./ministry.legacy");
/**
 * ActivityThemes junction table - Many-to-many relationship between Activities and Themes
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityThemes.cs
 */
exports.activityThemes = (0, pg_core_1.pgTable)('activity_themes', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // PK, FK, int, not null
    themeId: (0, pg_core_1.uuid)('theme_id')
        .notNull()
        .references(() => lookups_legacy_1.themes.id), // PK, FK, uniqueidentifier, not null
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit, not null
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(), // datetime, not null
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_legacy_1.systemUsers.id), // int, not null
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_legacy_1.systemUsers.id), // int, not null
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.activityId, table.themeId] }),
}));
/**
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
 */
exports.activityTags = (0, pg_core_1.pgTable)('activity_tags', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // PK, FK, int, not null
    tagId: (0, pg_core_1.uuid)('tag_id')
        .notNull()
        .references(() => lookups_legacy_1.tags.id), // PK, FK, uniqueidentifier, not null
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit, not null
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(), // datetime, not null
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_legacy_1.systemUsers.id), // int, not null
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_legacy_1.systemUsers.id), // int, not null
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.activityId, table.tagId] }),
}));
// Relations for junction tables
exports.activityThemesRelations = (0, drizzle_orm_1.relations)(exports.activityThemes, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityThemes.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    theme: one(lookups_legacy_1.themes, {
        fields: [exports.activityThemes.themeId],
        references: [lookups_legacy_1.themes.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityThemes.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityThemeCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityThemes.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityThemeUpdatedBy',
    }),
}));
exports.activityTagsRelations = (0, drizzle_orm_1.relations)(exports.activityTags, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityTags.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    tag: one(lookups_legacy_1.tags, {
        fields: [exports.activityTags.tagId],
        references: [lookups_legacy_1.tags.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityTags.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityTagCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityTags.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityTagUpdatedBy',
    }),
}));
/**
 * ActivityCategories junction table - Many-to-many relationship between Activities and Categories
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityCategories.cs
 */
exports.activityCategories = (0, pg_core_1.pgTable)('activity_categories', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // PK, int, not null
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // FK, int, not null
    categoryId: (0, pg_core_1.integer)('category_id')
        .notNull()
        .references(() => lookups_legacy_1.categories.id), // FK, int, not null
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit, not null
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // datetime, null
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // FK, int, null
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // FK, int, null
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // Timestamp, not null
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // unique identifier, not null
});
/**
 * ActivityCommunicationMaterials junction table - Many-to-many relationship between Activities and CommunicationMaterials
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityCommunicationMaterial.cs
 */
exports.activityCommunicationMaterials = (0, pg_core_1.pgTable)('activity_communication_materials', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL) in ActivityCommunicationMaterial.cs
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // int (NOT NULL) in ActivityCommunicationMaterial.cs
    communicationMaterialId: (0, pg_core_1.integer)('communication_material_id').notNull(), // int (NOT NULL) in ActivityCommunicationMaterial.cs - FK to CommunicationMaterial
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bool (NOT NULL) in ActivityCommunicationMaterial.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivityCommunicationMaterial.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivityCommunicationMaterial.cs
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // DateTime (NOT NULL) in ActivityCommunicationMaterial.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivityCommunicationMaterial.cs
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivityCommunicationMaterial.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivityCommunicationMaterial.cs
});
/**
 * ActivityInitiatives junction table - Many-to-many relationship between Activities and Initiatives
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityInitiatives.cs
 */
exports.activityInitiatives = (0, pg_core_1.pgTable)('activity_initiatives', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // PK, int, not null
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // FK, int, not null
    initiativeId: (0, pg_core_1.integer)('initiative_id').notNull(), // FK, int, not null (Initiative table not yet defined)
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit, not null
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // datetime, null
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // FK, int, null
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null (verified from ActivityInitiative.cs)
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // FK, int, null
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // timestamp (byte[] in C#), not null
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // uniqueidentifier, not null
});
/**
 * ActivityKeywords junction table - Many-to-many relationship between Activities and Keywords
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityKeywords.cs
 */
exports.activityKeywords = (0, pg_core_1.pgTable)('activity_keywords', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // PK, FK, int, not null
    keywordId: (0, pg_core_1.integer)('keyword_id').notNull(), // PK, FK, int, not null (Keyword table not yet defined)
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bit, not null
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // datetime, not null
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_legacy_1.systemUsers.id), // int, not null
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.activityId, table.keywordId] }),
}));
/**
 * ActivityNROrigins junction table - Many-to-many relationship between Activities and NROrigins
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityNROrigins.cs
 */
exports.activityNROrigins = (0, pg_core_1.pgTable)('activity_nr_origins', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL) in ActivityNROrigin.cs
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // int (NOT NULL) in ActivityNROrigin.cs
    nrOriginId: (0, pg_core_1.integer)('nr_origin_id').notNull(), // int (NOT NULL) in ActivityNROrigin.cs - FK to NROrigin
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bool (NOT NULL) in ActivityNROrigin.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivityNROrigin.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivityNROrigin.cs
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // DateTime (NOT NULL) in ActivityNROrigin.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivityNROrigin.cs
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivityNROrigin.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivityNROrigin.cs
});
/**
 * ActivitySectors junction table - Many-to-many relationship between Activities and Sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySectors.cs
 */
exports.activitySectors = (0, pg_core_1.pgTable)('activity_sectors', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL) in ActivitySector.cs
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // int (NOT NULL) in ActivitySector.cs
    sectorId: (0, pg_core_1.uuid)('sector_id').notNull(), // Guid (NOT NULL) in ActivitySector.cs - FK to Sector
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bool (NOT NULL) in ActivitySector.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivitySector.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivitySector.cs
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(), // DateTime (NOT NULL) in ActivitySector.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivitySector.cs
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivitySector.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivitySector.cs
});
/**
 * ActivitySharedWith junction table - Many-to-many relationship between Activities and Ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySharedWith.cs
 */
exports.activitySharedWith = (0, pg_core_1.pgTable)('activity_shared_with', {
    id: (0, pg_core_1.serial)('id').primaryKey(), // int (NOT NULL) in ActivitySharedWith.cs
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // int (NOT NULL) in ActivitySharedWith.cs
    ministryId: (0, pg_core_1.uuid)('ministry_id')
        .notNull()
        .references(() => ministry_legacy_1.ministries.id), // Guid (NOT NULL) in ActivitySharedWith.cs
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true), // bool (NOT NULL) in ActivitySharedWith.cs
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Nullable<DateTime> in ActivitySharedWith.cs
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivitySharedWith.cs
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }), // Nullable<DateTime> in ActivitySharedWith.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_legacy_1.systemUsers.id), // Nullable<int> in ActivitySharedWith.cs
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in ActivitySharedWith.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid').notNull().defaultRandom(), // Guid (NOT NULL) in ActivitySharedWith.cs
});
// Relations for new junction tables
exports.activityCategoriesRelations = (0, drizzle_orm_1.relations)(exports.activityCategories, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityCategories.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    category: one(lookups_legacy_1.categories, {
        fields: [exports.activityCategories.categoryId],
        references: [lookups_legacy_1.categories.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityCategories.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityCategoryCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityCategories.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityCategoryUpdatedBy',
    }),
}));
exports.activityCommunicationMaterialsRelations = (0, drizzle_orm_1.relations)(exports.activityCommunicationMaterials, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityCommunicationMaterials.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityCommunicationMaterials.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityCommunicationMaterialCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityCommunicationMaterials.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityCommunicationMaterialUpdatedBy',
    }),
}));
exports.activityInitiativesRelations = (0, drizzle_orm_1.relations)(exports.activityInitiatives, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityInitiatives.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityInitiatives.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityInitiativeCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityInitiatives.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityInitiativeUpdatedBy',
    }),
}));
exports.activityKeywordsRelations = (0, drizzle_orm_1.relations)(exports.activityKeywords, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityKeywords.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityKeywords.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityKeywordUpdatedBy',
    }),
}));
exports.activityNROriginsRelations = (0, drizzle_orm_1.relations)(exports.activityNROrigins, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activityNROrigins.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityNROrigins.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityNROriginCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activityNROrigins.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activityNROriginUpdatedBy',
    }),
}));
exports.activitySectorsRelations = (0, drizzle_orm_1.relations)(exports.activitySectors, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activitySectors.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activitySectors.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activitySectorCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activitySectors.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activitySectorUpdatedBy',
    }),
}));
exports.activitySharedWithRelations = (0, drizzle_orm_1.relations)(exports.activitySharedWith, ({ one }) => ({
    activity: one(activity_legacy_1.activities, {
        fields: [exports.activitySharedWith.activityId],
        references: [activity_legacy_1.activities.id],
    }),
    ministry: one(ministry_legacy_1.ministries, {
        fields: [exports.activitySharedWith.ministryId],
        references: [ministry_legacy_1.ministries.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activitySharedWith.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activitySharedWithCreatedBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activitySharedWith.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'activitySharedWithUpdatedBy',
    }),
}));
/**
 * FavoriteActivity junction table - Many-to-many relationship between SystemUsers and Activities (Watch Lists/Favorites)
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/FavoriteActivity.cs
 */
exports.favoriteActivities = (0, pg_core_1.pgTable)('favorite_activities', {
    systemUserId: (0, pg_core_1.integer)('system_user_id')
        .notNull()
        .references(() => user_legacy_1.systemUsers.id), // int (NOT NULL) in FavoriteActivity.cs - FK to SystemUser (part of composite PK)
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_legacy_1.activities.id), // int (NOT NULL) in FavoriteActivity.cs - FK to Activity (part of composite PK)
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.systemUserId, table.activityId] }),
}));
// Relations for FavoriteActivity
exports.favoriteActivitiesRelations = (0, drizzle_orm_1.relations)(exports.favoriteActivities, ({ one }) => ({
    systemUser: one(user_legacy_1.systemUsers, {
        fields: [exports.favoriteActivities.systemUserId],
        references: [user_legacy_1.systemUsers.id],
    }),
    activity: one(activity_legacy_1.activities, {
        fields: [exports.favoriteActivities.activityId],
        references: [activity_legacy_1.activities.id],
    }),
}));
