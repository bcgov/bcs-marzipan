import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ministries } from './ministry';
import { systemUsers } from './user';

/**
 * ActivityStatus lookup table - Activity statuses
 * Used for both activity entry status and field review statuses
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Status.cs
 * Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
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
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * Category lookup table - Classification categories for activities
 * Extensible by admins via admin UI.
 * Values: 'event', 'release', 'awareness', 'conference', 'fyi', 'social media', 'speech', 'tv radio'
 */
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  pitchRequired: boolean('pitch_required').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

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
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
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
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * VenueStatus lookup table - Venue statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
export const venueStatuses = pgTable('venue_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
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
  province: varchar('province', { length: 100 }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * Venue lookup table - Venues for activities
 * TODO: Consider address complete common component
 */
export const venues = pgTable('venues', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  address: jsonb('address'), // {street, city, provinceOrState, country} (address complete common component)
  acId: varchar('ac_id', { length: 255 }), // AC ID (address complete ID)
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * Government Representative lookup table - Representatives for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/GovernmentRepresentative.cs
 * TODO: Consider ministry API
 */
export const governmentRepresentatives = pgTable('government_representatives', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  title: varchar('title', { length: 255 }),
  email: varchar('email', { length: 255 }),
  ministryId: uuid('ministry_id').references(() => ministries.id), // Nullable FK - links ministers to ministries
  representativeType: varchar('representative_type', { length: 50 }), // 'premier', 'minister', 'cabinet_member', 'mla', 'other'
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * Communication Contact lookup table - Communication contacts for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/CommunicationContact.cs
 * TODO: this might be related to user accounts in the future and replaced by AD integration
 */
export const communicationContacts = pgTable('communication_contacts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * Graphics users lookup table - Graphics usersfor activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Graphic.cs
 * TODO: Consider replacing with systemUsers table
 */
export const graphicsUsers = pgTable('graphics_users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * Theme lookup table - Classification themes for activities
 * Uses UUID primary key (unlike Category which uses serial).
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Theme.cs
 */
export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  topReleaseId: uuid('top_release_id'), // FK to News Release (integration)
  featureReleaseId: uuid('feature_release_id'), // FK to News Release (integration)
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
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
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * PitchStatus lookup table - Pitch approval statuses
 * Values: 'not required', 'submitted', 'pitched', 'approved'
 */
export const pitchStatuses = pgTable('pitch_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * CommsMaterials lookup table - Communication materials types
 * Values: 'Backgrounder','Digital Content','Event or Media Plan','Factsheet','IGRS: Biography','IGRS: Briefing Note','IGRS: Gift','Information Bulletin','Issues Note','Itinerary','Key Messages','Media Advisory','Minister's Message','News Release','NYCU News You Can Use','Opinion Editorial','Press Conference','Q&As','Quote','Report','Speaking Notes','Statement','Tech Briefing' (user editable)
 */
export const commsMaterials = pgTable('comms_materials', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

/**
 * TranslatedLanguage lookup table - Languages for translations
 * Values: 'Arabic','Chinese Simplified','Chinese Traditional','Dutch','Farsi','Finnish','French','Gujarati','Hebrew','Hindi','Indonesian','Japanese','Korean','Portuguese','Punjabi','Russian','Somali','Spanish','Swahili','Tagalog','Ukrainian','Urdu','Vietnamese' (user editable)
 */
export const translatedLanguages = pgTable('translated_languages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
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
