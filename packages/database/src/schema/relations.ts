import {
  pgTable,
  integer,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  varchar,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activities } from './activity';
import {
  themes,
  tags,
  categories,
  commsMaterials,
  translatedLanguages,
} from './lookups';
import { organizations } from './organizations';
import { systemUsers } from './user';

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
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
 */
export const activityTags = pgTable(
  'activity_tags',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    tagId: uuid('tag_id')
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
 * activityJointOrgs junction table - Many-to-many relationship between Activities and Organizations (joint orgs)
 */
export const activityJointOrgs = pgTable(
  'activity_joint_organizations',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.organizationId] })]
);

/**
 * ActivityRelatedEntries junction table - Self-referential many-to-many relationship between Activities
 */
export const activityRelatedEntries = pgTable(
  'activity_related_entries',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    relatedActivityId: integer('related_activity_id')
      .notNull()
      .references(() => activities.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.relatedActivityId] }),
  ]
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
 * activityJointEventOrgs junction table - Many-to-many relationship between Activities and Organizations (joint event orgs)
 */
export const activityJointEventOrgs = pgTable(
  'activity_joint_event_organizations',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.organizationId] })]
);

/**
 * ActivityRepresentatives junction table - Many-to-many relationship between Activities and Representatives with attending status
 * Uses free-text representativeName (governmentRepresentatives lookup table has been removed)
 */
export const activityRepresentatives = pgTable('activity_representatives', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activities.id),
  representativeId: integer('representative_id'), // Legacy field - no longer references governmentRepresentatives
  representativeName: varchar('representative_name', { length: 255 }), // Free text for representatives
  attendingStatus: varchar('attending_status', { length: 50 }).notNull(), // 'requested', 'declined', 'confirmed'
  isActive: boolean('is_active').notNull().default(true),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * ActivitySharedWithOrgs junction table - Many-to-many relationship between Activities and Organizations shared with
 */
export const activitySharedWithOrgs = pgTable(
  'activity_shared_with_organizations',
  {
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    isActive: boolean('is_active').notNull().default(true),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.organizationId] })]
);

/**
 * ActivityCanEditUsers junction table - Many-to-many relationship between Activities and SystemUsers (can edit)
 */
export const activityCanEditUsers = pgTable(
  'activity_can_edit_users',
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

/**
 * ActivityCanViewUsers junction table - Many-to-many relationship between Activities and SystemUsers (can view)
 */
export const activityCanViewUsers = pgTable(
  'activity_can_view_users',
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

/**
 * ActivityAdditionalOwners junction table - Many-to-many relationship between Activities and SystemUsers (additional owners)
 */
export const activityAdditionalOwners = pgTable(
  'activity_additional_owners',
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

export const activityJointOrgsRelations = relations(
  activityJointOrgs,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityJointOrgs.activityId],
      references: [activities.id],
    }),
    organization: one(organizations, {
      fields: [activityJointOrgs.organizationId],
      references: [organizations.id],
    }),
  })
);

export const activityRelatedEntriesRelations = relations(
  activityRelatedEntries,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityRelatedEntries.activityId],
      references: [activities.id],
      relationName: 'activity',
    }),
    relatedActivity: one(activities, {
      fields: [activityRelatedEntries.relatedActivityId],
      references: [activities.id],
      relationName: 'relatedActivity',
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

export const activityJointEventOrgsRelations = relations(
  activityJointEventOrgs,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityJointEventOrgs.activityId],
      references: [activities.id],
    }),
    organization: one(organizations, {
      fields: [activityJointEventOrgs.organizationId],
      references: [organizations.id],
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

export const activitySharedWithOrgsRelations = relations(
  activitySharedWithOrgs,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activitySharedWithOrgs.activityId],
      references: [activities.id],
    }),
    organization: one(organizations, {
      fields: [activitySharedWithOrgs.organizationId],
      references: [organizations.id],
    }),
  })
);

export const activityCanEditUsersRelations = relations(
  activityCanEditUsers,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityCanEditUsers.activityId],
      references: [activities.id],
    }),
    user: one(systemUsers, {
      fields: [activityCanEditUsers.userId],
      references: [systemUsers.id],
    }),
  })
);

export const activityCanViewUsersRelations = relations(
  activityCanViewUsers,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityCanViewUsers.activityId],
      references: [activities.id],
    }),
    user: one(systemUsers, {
      fields: [activityCanViewUsers.userId],
      references: [systemUsers.id],
    }),
  })
);

export const activityAdditionalOwnersRelations = relations(
  activityAdditionalOwners,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityAdditionalOwners.activityId],
      references: [activities.id],
    }),
    user: one(systemUsers, {
      fields: [activityAdditionalOwners.userId],
      references: [systemUsers.id],
    }),
  })
);
