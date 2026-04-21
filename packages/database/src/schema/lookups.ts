import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { ministries } from './ministry';
import { teamCategories, teamTags } from './relations';
import { users } from './user';

/**
 * ActivityStatus lookup table - Activity statuses
 * Used for both activity entry status and field review statuses
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Status.cs
 * Values: 'new', 'reviewed', 'changed', 'deleted', 'delete_requested', 'completed', 'on_hold'
 */
export const activityStatuses = pgTable('activity_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * Category lookup table - Classification categories for activities
 * Extensible by admins via admin UI.
 * Values: 'event', 'release', 'awareness', 'conference', 'fyi', 'social media', 'speech', 'tv radio'
 *
 * Access Control:
 * Categories can be restricted to specific teams via the visibility field and teamCategories junction table.
 * - visibility = 'global': Category is viewable by all teams
 * - visibility = 'team': Category is viewable only by teams listed in the teamCategories junction table
 */
export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    visibility: varchar('visibility', { length: 50 })
      .notNull()
      .default('global'), // 'global' or 'team'
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'),
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastUpdatedBy: integer('last_updated_by')
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    // Trigram index for ILIKE search on display_name
    index('idx_categories_display_name_trgm').using(
      'gin',
      sql`lower(${table.displayName}) gin_trgm_ops`
    ),
  ]
);

/**
 * DateStatus lookup table - Date statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
export const dateStatuses = pgTable('date_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * TimeStatus lookup table - Time statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
export const timeStatuses = pgTable('time_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * PitchRequiredStatus lookup table - Tri-state for whether pitch is required
 * Values: 'pending', 'required', 'not_required'
 */
export const pitchRequiredStatuses = pgTable('pitch_required_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * TranslationRequiredStatus lookup table - Tri-state for whether translations are required
 * Values: 'pending', 'required', 'not_required'
 */
export const translationRequiredStatuses = pgTable(
  'translation_required_statuses',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'),
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastUpdatedBy: integer('last_updated_by')
      .notNull()
      .references(() => users.id),
  }
);

/**
 * VenueStatus lookup table — linked from activities.venue_status_id
 * Values: TBC, TBD (see seed data for `name` / `display_name`)
 */
export const venueStatuses = pgTable('venue_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * City lookup table - Cities for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/City.cs
 * TODO: Consider address complete common component
 */
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  provinceOrState: varchar('province_or_state', { length: 255 }),
  country: varchar('country', { length: 255 }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * Government Representative lookup table - Representatives for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/GovernmentRepresentative.cs
 * TODO: Consider ministry API
 */
export const governmentRepresentatives = pgTable('government_representatives', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  title: varchar('title', { length: 255 }),
  ministryId: integer('ministry_id').references(() => ministries.id), // Nullable FK - links ministers to ministries
  representativeType: varchar('representative_type', { length: 50 }), // 'premier', 'minister', 'cabinet_member', 'mla', 'other'
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * CommsContact lookup table - Comms contacts for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/CommunicationContact.cs
 * TODO: this might be related to user accounts in the future and replaced by AD integration
 */
export const commsContacts = pgTable('comms_contacts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * Event Planner lookup table - Event planners for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/EventPlanner.cs
 */
export const eventPlanners = pgTable('event_planners', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * Theme lookup table - Classification themes for activities
 * Legacy: used UUID primary key.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Theme.cs
 * Note: The `key` column was removed as a legacy field
 */
export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  topReleaseId: uuid('top_release_id'), // FK to News Release (integration)
  featureReleaseId: uuid('feature_release_id'), // FK to News Release (integration)
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * Tag lookup table - Classification tags for activities
 * Renamed from keywords table. Uses serial primary key.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Keyword.cs
 *
 * Access Control:
 * Tags can be restricted to specific teams via the visibility field and teamTags junction table.
 * - visibility = 'global': Tag is viewable by all teams
 * - visibility = 'team': Tag is viewable only by teams listed in the teamTags junction table
 */
export const tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    visibility: varchar('visibility', { length: 50 })
      .notNull()
      .default('global'), // 'global' or 'team' - future feature flag use `global` for now
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'),
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastUpdatedBy: integer('last_updated_by')
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    // Trigram index for ILIKE search on display_name
    index('idx_tags_display_name_trgm').using(
      'gin',
      sql`lower(${table.displayName}) gin_trgm_ops`
    ),
  ]
);

/**
 * PitchStatus lookup table - Pitch approval statuses
 * Values: 'not required', 'submitted', 'pitched', 'approved'
 */
export const pitchStatuses = pgTable('pitch_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * CommsMaterials lookup table - Comms materials types
 * Values: 'Backgrounder','Digital Content','Event or Media Plan','Factsheet','IGRS: Biography','IGRS: Briefing Note','IGRS: Gift','Information Bulletin','Issues Note','Itinerary','Key Messages','Media Advisory','Minister's Message','News Release','NYCU News You Can Use','Opinion Editorial','Press Conference','Q&As','Quote','Report','Speaking Notes','Statement','Tech Briefing' (user editable)
 */
export const commsMaterials = pgTable('comms_materials', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * TranslatedLanguage lookup table - Languages for translations (user-editable list).
 * shortcode: internal language code for display and APIs (not necessarily BCP 47).
 */
export const translatedLanguages = pgTable('translated_languages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  /** Internal language code (e.g. AR, SC, FR) */
  shortcode: varchar('shortcode', { length: 15 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * News Release Origin lookup table - News release origins
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/NROrigin.cs (legacy entity name)
 */
export const newsReleaseOrigins = pgTable('news_release_origins', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * Sector lookup table - Government sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Sector.cs
 */
export const sectors = pgTable('sectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * NewsReleaseDistribution lookup table - News release distribution types
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/NRDistribution.cs
 */
export const newsReleaseDistributions = pgTable('news_release_distributions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * PremierRequested lookup table - Premier request types
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/PremierRequested.cs
 */
export const premierRequested = pgTable('premier_requested', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

/**
 * ActivityFilter table - Saved filter queries for activities
 * Allows users to save and reuse complex filter configurations
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityFilter.cs
 */
export const activityFilters = pgTable('activity_filters', {
  id: serial('id').primaryKey(),
  queryString: varchar('query_string', { length: 300 }), // Query string representing the filter
  name: varchar('name', { length: 200 }), // Name of the saved filter
  sortOrder: integer('sort_order'), // Sort order for display purposes
  isActive: boolean('is_active'), // Whether the filter is active
  createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Date and time the record was created
  createdBy: integer('created_by').references(() => users.id), // User who created the record
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  }), // Date and time the record was last updated
  lastUpdatedBy: integer('last_updated_by').references(() => users.id), // User who last updated the record
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(), // Row version timestamp
});

/**
 * Reports lookup table - Report types and their configuration
 * Defines different report types and their settings
 * Examples: 'look-ahead', 'thirty-sixty-ninety', and future custom reports
 */
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(), // Unique identifier like 'look-ahead', 'thirty-sixty-ninety'
  displayName: varchar('display_name', { length: 255 }).notNull(), // User-friendly name like 'Look Ahead', '30/60/90 Day Report'
  sortOrder: integer('sort_order').notNull().default(0),

  // Report active status (boolean, consistent with other lookup tables)
  isActive: boolean('is_active').notNull().default(true),

  // Visibility: 'global' or 'team' (multi-team support deferred to future work)
  visibility: varchar('visibility', { length: 50 }).notNull().default('team'),

  // Report configuration (JSONB)
  // Type: ReportConfig from @corpcal/shared/schemas/report-config.schema
  // Structure: { fields: string[], globalFilter?: FilterConfig, sections: Array<{id, name, order, filter?}> }
  // globalFilter applies to all activities; section filters augment/update the global filter
  config: jsonb('config'),

  description: text('description'), // Optional description of the report

  // Audit fields
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

// Relations for lookup tables
// Note: Reverse relations are defined in activity.ts to avoid circular dependencies
export const governmentRepresentativesRelations = relations(
  governmentRepresentatives,
  ({ one }) => ({
    ministry: one(ministries, {
      fields: [governmentRepresentatives.ministryId],
      references: [ministries.id],
    }),
  })
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  teamCategories: many(teamCategories),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  teamTags: many(teamTags),
}));
