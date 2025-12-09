import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ministries } from './ministry';

/**
 * ActivityStatus lookup table - Activity statuses
 * Used for both activity entry status and field review statuses
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Status.cs
 * Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
 */
export const activityStatuses = pgTable('activity_statuses', {
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
 * TODO: Consider address complete common component
 */
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  province: varchar('province', { length: 100 }),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Communication Contact lookup table - Communication contacts for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/CommunicationContact.cs
 * TODO: this might be related to user accounts in the future
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
 * Values: 'event', 'release', 'awareness', 'conference', 'fyi', 'social media', 'speech', 'tv radio'
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Category.cs
 */
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  pitchNotRequired: boolean('pitch_not_required').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * SchedulingStatus lookup table - Event scheduling statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
export const schedulingStatuses = pgTable('scheduling_statuses', {
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
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
