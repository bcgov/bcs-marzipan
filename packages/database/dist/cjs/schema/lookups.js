"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRelations = exports.governmentRepresentativesRelations = exports.reports = exports.activityFilters = exports.premierRequested = exports.newsReleaseDistributions = exports.sectors = exports.newsReleaseOrigins = exports.translatedLanguages = exports.commsMaterials = exports.pitchStatuses = exports.tags = exports.themes = exports.eventPlanners = exports.commsContacts = exports.governmentRepresentatives = exports.venues = exports.cities = exports.venueStatuses = exports.timeStatuses = exports.dateStatuses = exports.categories = exports.activityStatuses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const ministry_1 = require("./ministry");
const user_1 = require("./user");
const relations_1 = require("./relations");
/**
 * ActivityStatus lookup table - Activity statuses
 * Used for both activity entry status and field review statuses
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Status.cs
 * Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
 */
exports.activityStatuses = (0, pg_core_1.pgTable)('activity_statuses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
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
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    allowsPitch: (0, pg_core_1.boolean)('allows_pitch').notNull().default(true),
    visibility: (0, pg_core_1.varchar)('visibility', { length: 50 }).notNull().default('global'), // 'global' or 'team'
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * DateStatus lookup table - Date statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
exports.dateStatuses = (0, pg_core_1.pgTable)('date_statuses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * TimeStatus lookup table - Time statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
exports.timeStatuses = (0, pg_core_1.pgTable)('time_statuses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * VenueStatus lookup table - Venue statuses
 * Values: 'unknown', 'tentative', 'confirmed'
 */
exports.venueStatuses = (0, pg_core_1.pgTable)('venue_statuses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * City lookup table - Cities for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/City.cs
 * TODO: Consider address complete common component
 */
exports.cities = (0, pg_core_1.pgTable)('cities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    province: (0, pg_core_1.varchar)('province', { length: 100 }),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * Venue lookup table - Venues for activities
 * TODO: Consider address complete common component
 */
exports.venues = (0, pg_core_1.pgTable)('venues', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    address: (0, pg_core_1.jsonb)('address'), // {street, city, provinceOrState, country}
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * Government Representative lookup table - Representatives for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/GovernmentRepresentative.cs
 * TODO: Consider ministry API
 */
exports.governmentRepresentatives = (0, pg_core_1.pgTable)('government_representatives', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    title: (0, pg_core_1.varchar)('title', { length: 255 }),
    ministryId: (0, pg_core_1.uuid)('ministry_id').references(() => ministry_1.ministries.id), // Nullable FK - links ministers to ministries
    representativeType: (0, pg_core_1.varchar)('representative_type', { length: 50 }), // 'premier', 'minister', 'cabinet_member', 'mla', 'other'
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * CommsContact lookup table - Comms contacts for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/CommunicationContact.cs
 * TODO: this might be related to user accounts in the future and replaced by AD integration
 */
exports.commsContacts = (0, pg_core_1.pgTable)('comms_contacts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * Event Planner lookup table - Event planners for activities
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/EventPlanner.cs
 */
exports.eventPlanners = (0, pg_core_1.pgTable)('event_planners', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * Theme lookup table - Classification themes for activities
 * Uses UUID primary key (unlike Category which uses serial).
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Theme.cs
 */
exports.themes = (0, pg_core_1.pgTable)('themes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    key: (0, pg_core_1.varchar)('key', { length: 100 }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    topReleaseId: (0, pg_core_1.uuid)('top_release_id'), // FK to News Release (integration)
    featureReleaseId: (0, pg_core_1.uuid)('feature_release_id'), // FK to News Release (integration)
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * Tag lookup table - Classification tags for activities
 * Renamed from keywords table. Uses serial primary key.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Keyword.cs
 *
 * Access Control:
 * Tags can be restricted to specific teams via the visibility field (future feature flag).
 * - visibility = 'global': Tag is viewable by all teams (current default - all tags are global)
 * - visibility = 'team': Tag is viewable only by specific teams (future feature - not yet implemented)
 * NOTE: All tags are currently global. Team visibility is a future feature flag.
 */
exports.tags = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    visibility: (0, pg_core_1.varchar)('visibility', { length: 50 }).notNull().default('global'), // 'global' or 'team' - future feature flag use `global` for now
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * PitchStatus lookup table - Pitch approval statuses
 * Values: 'not required', 'submitted', 'pitched', 'approved'
 */
exports.pitchStatuses = (0, pg_core_1.pgTable)('pitch_statuses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * CommsMaterials lookup table - Comms materials types
 * Values: 'Backgrounder','Digital Content','Event or Media Plan','Factsheet','IGRS: Biography','IGRS: Briefing Note','IGRS: Gift','Information Bulletin','Issues Note','Itinerary','Key Messages','Media Advisory','Minister's Message','News Release','NYCU News You Can Use','Opinion Editorial','Press Conference','Q&As','Quote','Report','Speaking Notes','Statement','Tech Briefing' (user editable)
 */
exports.commsMaterials = (0, pg_core_1.pgTable)('comms_materials', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * TranslatedLanguage lookup table - Languages for translations
 * Values: 'Arabic','Chinese Simplified','Chinese Traditional','Dutch','Farsi','Finnish','French','Gujarati','Hebrew','Hindi','Indonesian','Japanese','Korean','Portuguese','Punjabi','Russian','Somali','Spanish','Swahili','Tagalog','Ukrainian','Urdu','Vietnamese' (user editable)
 */
exports.translatedLanguages = (0, pg_core_1.pgTable)('translated_languages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * News Release Origin lookup table - News release origins
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/NROrigin.cs (legacy entity name)
 */
exports.newsReleaseOrigins = (0, pg_core_1.pgTable)('news_release_origins', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * Sector lookup table - Government sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Sector.cs
 */
exports.sectors = (0, pg_core_1.pgTable)('sectors', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * NewsReleaseDistribution lookup table - News release distribution types
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/NRDistribution.cs
 */
exports.newsReleaseDistributions = (0, pg_core_1.pgTable)('news_release_distributions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * PremierRequested lookup table - Premier request types
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/PremierRequested.cs
 */
exports.premierRequested = (0, pg_core_1.pgTable)('premier_requested', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    description: (0, pg_core_1.text)('description'),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * ActivityFilter table - Saved filter queries for activities
 * Allows users to save and reuse complex filter configurations
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityFilter.cs
 */
exports.activityFilters = (0, pg_core_1.pgTable)('activity_filters', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    queryString: (0, pg_core_1.varchar)('query_string', { length: 300 }), // Query string representing the filter
    name: (0, pg_core_1.varchar)('name', { length: 200 }), // Name of the saved filter
    sortOrder: (0, pg_core_1.integer)('sort_order'), // Sort order for display purposes
    isActive: (0, pg_core_1.boolean)('is_active'), // Whether the filter is active
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Date and time the record was created
    createdBy: (0, pg_core_1.integer)('created_by').references(() => user_1.users.id), // User who created the record
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }), // Date and time the record was last updated
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by').references(() => user_1.users.id), // User who last updated the record
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // Row version timestamp
});
/**
 * Reports lookup table - Report types and their configuration
 * Defines different report types and their settings
 * Examples: 'look-ahead', 'thirty-sixty-ninety', and future custom reports
 */
exports.reports = (0, pg_core_1.pgTable)('reports', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull().unique(), // Unique identifier like 'look-ahead', 'thirty-sixty-ninety'
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(), // User-friendly name like 'Look Ahead', '30/60/90 Day Report'
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    // Report active status (boolean, consistent with other lookup tables)
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    // Visibility: 'global' or 'team' (multi-team support deferred to future work)
    visibility: (0, pg_core_1.varchar)('visibility', { length: 50 }).notNull().default('team'),
    // Report configuration (JSONB)
    // Type: ReportConfig from @corpcal/shared/schemas/report-config.schema
    // Structure: { fields: string[], globalFilter?: FilterConfig, sections: Array<{id, name, order, filter?}> }
    // globalFilter applies to all activities; section filters augment/update the global filter
    config: (0, pg_core_1.jsonb)('config'),
    description: (0, pg_core_1.text)('description'), // Optional description of the report
    // Audit fields
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
// Relations for lookup tables
// Note: Reverse relations are defined in activity.ts to avoid circular dependencies
exports.governmentRepresentativesRelations = (0, drizzle_orm_1.relations)(exports.governmentRepresentatives, ({ one }) => ({
    ministry: one(ministry_1.ministries, {
        fields: [exports.governmentRepresentatives.ministryId],
        references: [ministry_1.ministries.id],
    }),
}));
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, ({ many }) => ({
    teamCategories: many(relations_1.teamCategories),
}));
