import {
  pgTable,
  integer,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  varchar,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activities } from './activity';
import {
  themes,
  tags,
  categories,
  commsMaterials,
  translatedLanguages,
  sectors,
  reports,
} from './lookups';
import { ministries } from './ministry';
import { systemUsers } from './user';
import { teams } from './teams';

/**
 * ActivityThemes junction table - Many-to-many relationship between Activities and Themes
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTheme.cs
 */
export const activityThemes = pgTable(
  'activity_themes',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.themeId] })]
);

/**
 * ActivitySubscriptions junction table - Many-to-many relationship between Activities and Tags (subscriptions)
 * Renamed from activityTags. This table is for activity subscriptions to tags.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
 */
export const activitySubscriptions = pgTable(
  'activity_subscriptions',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.tagId] })]
);

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
}));

export const activitySubscriptionsRelations = relations(
  activitySubscriptions,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activitySubscriptions.activityId],
      references: [activities.id],
    }),
    tag: one(tags, {
      fields: [activitySubscriptions.tagId],
      references: [tags.id],
    }),
  })
);

/**
 * ActivityCategories junction table - Many-to-many relationship between Activities and Categories
 */
export const activityCategories = pgTable(
  'activity_categories',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.categoryId] })]
);

/**
 * ActivityCommsMaterials junction table - Many-to-many relationship between Activities and CommsMaterials
 */
export const activityCommsMaterials = pgTable(
  'activity_comms_materials',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    commsMaterialId: integer('comms_material_id')
      .notNull()
      .references(() => commsMaterials.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.commsMaterialId] }),
  ]
);

/**
 * ActivityTranslationLanguages junction table - Many-to-many relationship between Activities and TranslatedLanguages
 */
export const activityTranslationsRequired = pgTable(
  'activity_translation_languages',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    languageId: integer('language_id')
      .notNull()
      .references(() => translatedLanguages.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.languageId] })]
);

/**
 * ActivityRepresentatives junction table - Many-to-many relationship between Activities and Representatives
 * Optional free text representativeName for representatives not in the governmentRepresentatives lookup table
 */
export const activityRepresentatives = pgTable('activity_representatives', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activities.id),
  representativeId: integer('representative_id'),
  representativeName: varchar('representative_name', { length: 255 }), // Free text for representatives
  isActive: boolean('is_active').notNull().default(true),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * activitySharedWithTeams junction table - Many-to-many relationship between Activities and Teams
 * Indicates which teams an activity is shared with (Editor-type teams).
 * Sharing grants access when visibility='team' and marks activities as important/highlighted.
 */
export const activitySharedWithTeams = pgTable(
  'activity_shared_with_teams',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.teamId] })]
);

/**
 * ActivityAdditionalCommsContacts junction table - Many-to-many relationship between Activities and SystemUsers (additional comms contacts)
 */
export const activityAdditionalCommsContacts = pgTable(
  'activity_additional_comms_contacts',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    userId: integer('user_id')
      .notNull()
      .references(() => systemUsers.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.userId] })]
);

// Relations for new junction tables
export const activityCategoriesRelations = relations(
  activityCategories,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityCategories.activityId],
      references: [activities.id],
    }),
    category: one(categories, {
      fields: [activityCategories.categoryId],
      references: [categories.id],
    }),
  })
);

export const activityCommsMaterialsRelations = relations(
  activityCommsMaterials,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityCommsMaterials.activityId],
      references: [activities.id],
    }),
    commsMaterial: one(commsMaterials, {
      fields: [activityCommsMaterials.commsMaterialId],
      references: [commsMaterials.id],
    }),
  })
);

export const activityTranslationsRequiredRelations = relations(
  activityTranslationsRequired,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityTranslationsRequired.activityId],
      references: [activities.id],
    }),
    language: one(translatedLanguages, {
      fields: [activityTranslationsRequired.languageId],
      references: [translatedLanguages.id],
    }),
  })
);

export const activityRepresentativesRelations = relations(
  activityRepresentatives,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityRepresentatives.activityId],
      references: [activities.id],
    }),
  })
);

export const activitySharedWithTeamsRelations = relations(
  activitySharedWithTeams,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activitySharedWithTeams.activityId],
      references: [activities.id],
    }),
    team: one(teams, {
      fields: [activitySharedWithTeams.teamId],
      references: [teams.id],
    }),
  })
);

export const activityAdditionalCommsContactsRelations = relations(
  activityAdditionalCommsContacts,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityAdditionalCommsContacts.activityId],
      references: [activities.id],
    }),
    user: one(systemUsers, {
      fields: [activityAdditionalCommsContacts.userId],
      references: [systemUsers.id],
    }),
  })
);

/**
 * MinistrySystemUsers junction table - Many-to-many relationship between Ministries and SystemUsers
 */
export const ministrySystemUsers = pgTable(
  'ministry_system_users',
  {
    ministryId: uuid('ministry_id')
      .notNull()
      .references(() => ministries.id),
    userId: integer('user_id')
      .notNull()
      .references(() => systemUsers.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.ministryId, table.userId] })]
);

export const ministrySystemUsersRelations = relations(
  ministrySystemUsers,
  ({ one }) => ({
    ministry: one(ministries, {
      fields: [ministrySystemUsers.ministryId],
      references: [ministries.id],
    }),
    user: one(systemUsers, {
      fields: [ministrySystemUsers.userId],
      references: [systemUsers.id],
    }),
  })
);

/**
 * TeamCategories junction table - Many-to-many relationship between Categories and Teams
 * Controls which teams can view specific categories.
 * If a category has no entries in this table, it is viewable by all teams.
 * If a category has entries, only those teams can view it.
 */
export const teamCategories = pgTable(
  'team_categories',
  {
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.teamId] })]
);

export const teamCategoriesRelations = relations(teamCategories, ({ one }) => ({
  category: one(categories, {
    fields: [teamCategories.categoryId],
    references: [categories.id],
  }),
  team: one(teams, {
    fields: [teamCategories.teamId],
    references: [teams.id],
  }),
}));

/**
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Renamed from activityKeywords. This table links activities to tags.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityKeywords.cs
 * Previously defined as ActivityKeywords in legacy schema - used for HQ Tags
 */
export const activityTags = pgTable(
  'activity_tags',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.tagId] })]
);

/**
 * ActivitySectors junction table - Many-to-many relationship between Activities and Sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySectors.cs
 */
export const activitySectors = pgTable(
  'activity_sectors',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    sectorId: uuid('sector_id')
      .notNull()
      .references(() => sectors.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.sectorId] })]
);

/**
 * FavoriteActivity junction table - Many-to-many relationship between SystemUsers and Activities (Watch Lists/Favorites)
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/FavoriteActivity.cs
 */
export const favoriteActivities = pgTable(
  'favorite_activities',
  {
    systemUserId: integer('system_user_id')
      .notNull()
      .references(() => systemUsers.id),
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
  },
  (table) => [primaryKey({ columns: [table.systemUserId, table.activityId] })]
);

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
export const activityReportSettings = pgTable(
  'activity_report_settings',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    reportId: integer('report_id')
      .notNull()
      .references(() => reports.id),

    // Whether this activity is omitted from this report
    // If true: activity is omitted (regardless of isConfidential)
    // If false: activity is included (standard if !isConfidential, placeholder if isConfidential)
    omitted: boolean('omitted').notNull().default(false),

    // Book-keeping
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.reportId] }),
    // Indexes for performance
    index('idx_activity_report_settings_activity_id').on(table.activityId),
    index('idx_activity_report_settings_report_id').on(table.reportId),
    index('idx_activity_report_settings_activity_report').on(
      table.activityId,
      table.reportId
    ),
    index('idx_activity_report_settings_omitted').on(table.omitted),
  ]
);

// Relations for new junction tables
export const activityTagsRelations = relations(activityTags, ({ one }) => ({
  activity: one(activities, {
    fields: [activityTags.activityId],
    references: [activities.id],
  }),
  tag: one(tags, {
    fields: [activityTags.tagId],
    references: [tags.id],
  }),
}));

export const activitySectorsRelations = relations(
  activitySectors,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activitySectors.activityId],
      references: [activities.id],
    }),
    sector: one(sectors, {
      fields: [activitySectors.sectorId],
      references: [sectors.id],
    }),
  })
);

export const favoriteActivitiesRelations = relations(
  favoriteActivities,
  ({ one }) => ({
    systemUser: one(systemUsers, {
      fields: [favoriteActivities.systemUserId],
      references: [systemUsers.id],
    }),
    activity: one(activities, {
      fields: [favoriteActivities.activityId],
      references: [activities.id],
    }),
  })
);

export const activityReportSettingsRelations = relations(
  activityReportSettings,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityReportSettings.activityId],
      references: [activities.id],
    }),
    report: one(reports, {
      fields: [activityReportSettings.reportId],
      references: [reports.id],
    }),
  })
);
