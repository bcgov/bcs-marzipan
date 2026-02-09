"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityReportSettingsRelations = exports.favoriteActivitiesRelations = exports.activitySectorsRelations = exports.activityTagsRelations = exports.activityReportSettings = exports.favoriteActivities = exports.activitySectors = exports.activityTags = exports.teamCategoriesRelations = exports.teamCategories = exports.ministryUsersRelations = exports.ministryUsers = exports.activityCommsContactsRelations = exports.activitySharedWithTeamsRelations = exports.activityRepresentativesRelations = exports.activityTranslationsRequiredRelations = exports.activityCommsMaterialsRelations = exports.activityCategoriesRelations = exports.activityCommsContacts = exports.activitySharedWithTeams = exports.activityRepresentatives = exports.activityTranslationsRequired = exports.activityCommsMaterials = exports.activityCategories = exports.activitySubscriptionsRelations = exports.activityThemesRelations = exports.activitySubscriptions = exports.activityThemes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const activity_1 = require("./activity");
const lookups_1 = require("./lookups");
const ministry_1 = require("./ministry");
const user_1 = require("./user");
const teams_1 = require("./teams");
/**
 * ActivityThemes junction table - Many-to-many relationship between Activities and Themes
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTheme.cs
 */
exports.activityThemes = (0, pg_core_1.pgTable)('activity_themes', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    themeId: (0, pg_core_1.uuid)('theme_id')
        .notNull()
        .references(() => lookups_1.themes.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.themeId] })]);
/**
 * ActivitySubscriptions junction table - Many-to-many relationship between Activities and Tags (subscriptions)
 * Renamed from activityTags. This table is for activity subscriptions to tags.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
 */
exports.activitySubscriptions = (0, pg_core_1.pgTable)('activity_subscriptions', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    tagId: (0, pg_core_1.integer)('tag_id')
        .notNull()
        .references(() => lookups_1.tags.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.tagId] })]);
// Relations for junction tables
exports.activityThemesRelations = (0, drizzle_orm_1.relations)(exports.activityThemes, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityThemes.activityId],
        references: [activity_1.activities.id],
    }),
    theme: one(lookups_1.themes, {
        fields: [exports.activityThemes.themeId],
        references: [lookups_1.themes.id],
    }),
}));
exports.activitySubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.activitySubscriptions, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activitySubscriptions.activityId],
        references: [activity_1.activities.id],
    }),
    tag: one(lookups_1.tags, {
        fields: [exports.activitySubscriptions.tagId],
        references: [lookups_1.tags.id],
    }),
}));
/**
 * ActivityCategories junction table - Many-to-many relationship between Activities and Categories
 */
exports.activityCategories = (0, pg_core_1.pgTable)('activity_categories', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    categoryId: (0, pg_core_1.integer)('category_id')
        .notNull()
        .references(() => lookups_1.categories.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.categoryId] })]);
/**
 * ActivityCommsMaterials junction table - Many-to-many relationship between Activities and CommsMaterials
 */
exports.activityCommsMaterials = (0, pg_core_1.pgTable)('activity_comms_materials', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    commsMaterialId: (0, pg_core_1.integer)('comms_material_id')
        .notNull()
        .references(() => lookups_1.commsMaterials.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    (0, pg_core_1.primaryKey)({ columns: [table.activityId, table.commsMaterialId] }),
]);
/**
 * ActivityTranslationLanguages junction table - Many-to-many relationship between Activities and TranslatedLanguages
 */
exports.activityTranslationsRequired = (0, pg_core_1.pgTable)('activity_translation_languages', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    languageId: (0, pg_core_1.integer)('language_id')
        .notNull()
        .references(() => lookups_1.translatedLanguages.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.languageId] })]);
/**
 * ActivityRepresentatives junction table - Many-to-many relationship between Activities and Representatives
 * Optional free text representativeName for representatives not in the governmentRepresentatives lookup table
 */
exports.activityRepresentatives = (0, pg_core_1.pgTable)('activity_representatives', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    representativeId: (0, pg_core_1.integer)('representative_id'),
    representativeName: (0, pg_core_1.varchar)('representative_name', { length: 255 }), // Free text for representatives
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
/**
 * activitySharedWithTeams junction table - Many-to-many relationship between Activities and Teams
 * Indicates which teams an activity is shared with (Editor-type teams).
 * Sharing grants access when visibility='team' and marks activities as important/highlighted.
 */
exports.activitySharedWithTeams = (0, pg_core_1.pgTable)('activity_shared_with_teams', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    teamId: (0, pg_core_1.integer)('team_id')
        .notNull()
        .references(() => teams_1.teams.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.teamId] })]);
/**
 * ActivityCommsUsers junction table - Many-to-many relationship between Activities and Users (comms contacts)
 * Contains all comms contacts for an activity, with isLead flag to identify the lead contact.
 * Exactly one contact per activity must have isLead=true (enforced by application logic).
 */
exports.activityCommsContacts = (0, pg_core_1.pgTable)('activity_comms_contacts', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => user_1.users.id),
    isLead: (0, pg_core_1.boolean)('is_lead').notNull().default(false), // Exactly one per activity must be true
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.userId] })]);
// Relations for new junction tables
exports.activityCategoriesRelations = (0, drizzle_orm_1.relations)(exports.activityCategories, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityCategories.activityId],
        references: [activity_1.activities.id],
    }),
    category: one(lookups_1.categories, {
        fields: [exports.activityCategories.categoryId],
        references: [lookups_1.categories.id],
    }),
}));
exports.activityCommsMaterialsRelations = (0, drizzle_orm_1.relations)(exports.activityCommsMaterials, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityCommsMaterials.activityId],
        references: [activity_1.activities.id],
    }),
    commsMaterial: one(lookups_1.commsMaterials, {
        fields: [exports.activityCommsMaterials.commsMaterialId],
        references: [lookups_1.commsMaterials.id],
    }),
}));
exports.activityTranslationsRequiredRelations = (0, drizzle_orm_1.relations)(exports.activityTranslationsRequired, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityTranslationsRequired.activityId],
        references: [activity_1.activities.id],
    }),
    language: one(lookups_1.translatedLanguages, {
        fields: [exports.activityTranslationsRequired.languageId],
        references: [lookups_1.translatedLanguages.id],
    }),
}));
exports.activityRepresentativesRelations = (0, drizzle_orm_1.relations)(exports.activityRepresentatives, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityRepresentatives.activityId],
        references: [activity_1.activities.id],
    }),
}));
exports.activitySharedWithTeamsRelations = (0, drizzle_orm_1.relations)(exports.activitySharedWithTeams, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activitySharedWithTeams.activityId],
        references: [activity_1.activities.id],
    }),
    team: one(teams_1.teams, {
        fields: [exports.activitySharedWithTeams.teamId],
        references: [teams_1.teams.id],
    }),
}));
exports.activityCommsContactsRelations = (0, drizzle_orm_1.relations)(exports.activityCommsContacts, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityCommsContacts.activityId],
        references: [activity_1.activities.id],
    }),
    user: one(user_1.users, {
        fields: [exports.activityCommsContacts.userId],
        references: [user_1.users.id],
    }),
}));
/**
 * MinistryUsers junction table - Many-to-many relationship between Ministries and Users
 */
exports.ministryUsers = (0, pg_core_1.pgTable)('ministry_users', {
    ministryId: (0, pg_core_1.uuid)('ministry_id')
        .notNull()
        .references(() => ministry_1.ministries.id),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => user_1.users.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.ministryId, table.userId] })]);
exports.ministryUsersRelations = (0, drizzle_orm_1.relations)(exports.ministryUsers, ({ one }) => ({
    ministry: one(ministry_1.ministries, {
        fields: [exports.ministryUsers.ministryId],
        references: [ministry_1.ministries.id],
    }),
    user: one(user_1.users, {
        fields: [exports.ministryUsers.userId],
        references: [user_1.users.id],
    }),
}));
/**
 * TeamCategories junction table - Many-to-many relationship between Categories and Teams
 * Controls which teams can view specific categories.
 * If a category has no entries in this table, it is viewable by all teams.
 * If a category has entries, only those teams can view it.
 */
exports.teamCategories = (0, pg_core_1.pgTable)('team_categories', {
    categoryId: (0, pg_core_1.integer)('category_id')
        .notNull()
        .references(() => lookups_1.categories.id),
    teamId: (0, pg_core_1.integer)('team_id')
        .notNull()
        .references(() => teams_1.teams.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.categoryId, table.teamId] })]);
exports.teamCategoriesRelations = (0, drizzle_orm_1.relations)(exports.teamCategories, ({ one }) => ({
    category: one(lookups_1.categories, {
        fields: [exports.teamCategories.categoryId],
        references: [lookups_1.categories.id],
    }),
    team: one(teams_1.teams, {
        fields: [exports.teamCategories.teamId],
        references: [teams_1.teams.id],
    }),
}));
/**
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Renamed from activityKeywords. This table links activities to tags.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityKeywords.cs
 * Previously defined as ActivityKeywords in legacy schema - used for HQ Tags
 */
exports.activityTags = (0, pg_core_1.pgTable)('activity_tags', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    tagId: (0, pg_core_1.integer)('tag_id')
        .notNull()
        .references(() => lookups_1.tags.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.tagId] })]);
/**
 * ActivitySectors junction table - Many-to-many relationship between Activities and Sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySectors.cs
 */
exports.activitySectors = (0, pg_core_1.pgTable)('activity_sectors', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    sectorId: (0, pg_core_1.uuid)('sector_id')
        .notNull()
        .references(() => lookups_1.sectors.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.sectorId] })]);
/**
 * FavoriteActivity junction table - Many-to-many relationship between Users and Activities (Watch Lists/Favorites)
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/FavoriteActivity.cs
 */
exports.favoriteActivities = (0, pg_core_1.pgTable)('favorite_activities', {
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => user_1.users.id),
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.userId, table.activityId] })]);
/**
 * activityReportSettings junction table - Per-activity report settings
 * Stores whether an activity is omitted from a specific report.
 *
 * Every activity must have a setting for every active report.
 * When an activity is created, default rows are created with omitted=false.
 * Users can update the omitted value to exclude activities from specific reports.
 *
 * Inclusion logic:
 * - If omitted=true: activity is omitted from report (regardless of isConfidential)
 * - If omitted=false and isConfidential=false: activity included with standard details
 * - If omitted=false and isConfidential=true: activity included with placeholder (redacted) details
 */
exports.activityReportSettings = (0, pg_core_1.pgTable)('activity_report_settings', {
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    reportId: (0, pg_core_1.integer)('report_id')
        .notNull()
        .references(() => lookups_1.reports.id),
    // Whether this activity is omitted from this report
    // If true: activity is omitted (regardless of isConfidential)
    // If false: activity is included (standard if !isConfidential, placeholder if isConfidential)
    omitted: (0, pg_core_1.boolean)('omitted').notNull().default(false),
    // Book-keeping
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    (0, pg_core_1.primaryKey)({ columns: [table.activityId, table.reportId] }),
    // Indexes for performance
    (0, pg_core_1.index)('idx_activity_report_settings_activity_id').on(table.activityId),
    (0, pg_core_1.index)('idx_activity_report_settings_report_id').on(table.reportId),
    (0, pg_core_1.index)('idx_activity_report_settings_activity_report').on(table.activityId, table.reportId),
    (0, pg_core_1.index)('idx_activity_report_settings_omitted').on(table.omitted),
]);
// Relations for new junction tables
exports.activityTagsRelations = (0, drizzle_orm_1.relations)(exports.activityTags, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityTags.activityId],
        references: [activity_1.activities.id],
    }),
    tag: one(lookups_1.tags, {
        fields: [exports.activityTags.tagId],
        references: [lookups_1.tags.id],
    }),
}));
exports.activitySectorsRelations = (0, drizzle_orm_1.relations)(exports.activitySectors, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activitySectors.activityId],
        references: [activity_1.activities.id],
    }),
    sector: one(lookups_1.sectors, {
        fields: [exports.activitySectors.sectorId],
        references: [lookups_1.sectors.id],
    }),
}));
exports.favoriteActivitiesRelations = (0, drizzle_orm_1.relations)(exports.favoriteActivities, ({ one }) => ({
    user: one(user_1.users, {
        fields: [exports.favoriteActivities.userId],
        references: [user_1.users.id],
    }),
    activity: one(activity_1.activities, {
        fields: [exports.favoriteActivities.activityId],
        references: [activity_1.activities.id],
    }),
}));
exports.activityReportSettingsRelations = (0, drizzle_orm_1.relations)(exports.activityReportSettings, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityReportSettings.activityId],
        references: [activity_1.activities.id],
    }),
    report: one(lookups_1.reports, {
        fields: [exports.activityReportSettings.reportId],
        references: [lookups_1.reports.id],
    }),
}));
