/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
import { pgTable, serial, timestamp, varchar, integer, boolean, uuid, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Import table objects for relations
import { statuses, cities, governmentRepresentatives, communicationContacts, eventPlanners, videographers, } from './lookups.legacy';
import { ministries } from './ministry.legacy';
import { systemUsers } from './user.legacy';
import { activityThemes, activityTags, activityCategories, activityCommunicationMaterials, activityInitiatives, activityKeywords, activityNROrigins, activitySectors, activitySharedWith, favoriteActivities, } from './relations.legacy';
import { logs, newsFeeds } from './audit.legacy';
/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
export const activities = pgTable('activities', {
    id: serial('id').primaryKey(),
    // Date/Time fields
    startDateTime: timestamp('start_date_time', { withTimezone: true }),
    endDateTime: timestamp('end_date_time', { withTimezone: true }),
    newsReleaseDateTime: timestamp('news_release_date_time', {
        withTimezone: true,
    }), // News Release date
    // Text fields
    title: varchar('title', { length: 500 }), // string (nullable in Activity.cs)
    details: varchar('details', { length: 700 }), // string (nullable in Activity.cs)
    comments: varchar('comments', { length: 4000 }), // string (nullable in Activity.cs)
    hqComments: varchar('hq_comments', { length: 2000 }), // string (nullable in Activity.cs) - Only visible to HQ users
    leadOrganization: varchar('lead_organization', { length: 100 }), // string (nullable in Activity.cs)
    venue: varchar('venue', { length: 150 }), // string (nullable in Activity.cs)
    otherCity: varchar('other_city', { length: 150 }), // string (nullable in Activity.cs)
    schedule: varchar('schedule', { length: 500 }), // string (nullable in Activity.cs)
    significance: varchar('significance', { length: 500 }), // string (nullable in Activity.cs)
    strategy: varchar('strategy', { length: 500 }), // string (nullable in Activity.cs)
    potentialDates: varchar('potential_dates', { length: 70 }), // string (nullable in Activity.cs)
    translations: varchar('translations', { length: 500 }), // string (nullable in Activity.cs)
    // Foreign keys
    statusId: integer('status_id'), // FK to Status
    hqStatusId: integer('hq_status_id'), // FK to Status
    nrDistributionId: integer('nr_distribution_id'), // FK to NRDistribution
    premierRequestedId: integer('premier_requested_id'), // FK to PremierRequested
    contactMinistryId: uuid('contact_ministry_id'), // FK to Ministry
    governmentRepresentativeId: integer('government_representative_id'), // FK to GovernmentRepresentative
    communicationContactId: integer('communication_contact_id'), // FK to CommunicationContact
    eventPlannerId: integer('event_planner_id'), // FK to EventPlanner
    videographerId: integer('videographer_id'), // FK to Videographer
    cityId: integer('city_id'), // FK to City
    // Boolean flags
    isActive: boolean('is_active').notNull().default(false),
    isConfirmed: boolean('is_confirmed').notNull().default(false),
    isAllDay: boolean('is_all_day').notNull().default(false),
    isAtLegislature: boolean('is_at_legislature').notNull().default(false),
    isConfidential: boolean('is_confidential').notNull().default(false),
    isCrossGovernment: boolean('is_cross_government').notNull().default(false),
    isIssue: boolean('is_issue').notNull().default(false),
    isMilestone: boolean('is_milestone').notNull().default(false),
    // HQ Section (integer, not null in legacy)
    hqSection: integer('hq_section').notNull().default(0),
    // "Needs Review" flags (15+ boolean fields for granular review)
    isTitleNeedsReview: boolean('is_title_needs_review').notNull().default(false),
    isDetailsNeedsReview: boolean('is_details_needs_review')
        .notNull()
        .default(false),
    isRepresentativeNeedsReview: boolean('is_representative_needs_review')
        .notNull()
        .default(false),
    isCityNeedsReview: boolean('is_city_needs_review').notNull().default(false),
    isStartDateNeedsReview: boolean('is_start_date_needs_review')
        .notNull()
        .default(false),
    isEndDateNeedsReview: boolean('is_end_date_needs_review')
        .notNull()
        .default(false),
    isCategoriesNeedsReview: boolean('is_categories_needs_review')
        .notNull()
        .default(false),
    isActiveNeedsReview: boolean('is_active_needs_review')
        .notNull()
        .default(false),
    isCommMaterialsNeedsReview: boolean('is_comm_materials_needs_review')
        .notNull()
        .default(false),
    isSignificanceNeedsReview: boolean('is_significance_needs_review')
        .notNull()
        .default(false),
    isStrategyNeedsReview: boolean('is_strategy_needs_review')
        .notNull()
        .default(false),
    isschedulingNotesNeedsReview: boolean('is_scheduling_considerations_needs_review')
        .notNull()
        .default(false),
    isInternalNotesNeedsReview: boolean('is_internal_notes_needs_review')
        .notNull()
        .default(false),
    isLeadOrganizationNeedsReview: boolean('is_lead_organization_needs_review')
        .notNull()
        .default(false),
    isInitiativesNeedsReview: boolean('is_initiatives_needs_review')
        .notNull()
        .default(false),
    isTagsNeedsReview: boolean('is_tags_needs_review').notNull().default(false),
    isOriginNeedsReview: boolean('is_origin_needs_review')
        .notNull()
        .default(false),
    isDistributionNeedsReview: boolean('is_distribution_needs_review')
        .notNull()
        .default(false),
    isTranslationsRequiredNeedsReview: boolean('is_translations_required_needs_review')
        .notNull()
        .default(false),
    isPremierRequestedNeedsReview: boolean('is_premier_requested_needs_review')
        .notNull()
        .default(false),
    isVenueNeedsReview: boolean('is_venue_needs_review').notNull().default(false),
    isEventPlannerNeedsReview: boolean('is_event_planner_needs_review')
        .notNull()
        .default(false),
    isDigitalNeedsReview: boolean('is_digital_needs_review')
        .notNull()
        .default(false),
    // Audit fields
    createdDateTime: timestamp('created_date_time', { withTimezone: true }), // Nullable<DateTime> in Activity.cs
    createdBy: integer('created_by'), // Nullable<int> in Activity.cs - FK to SystemUser
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    }), // Nullable<DateTime> in Activity.cs
    lastUpdatedBy: integer('last_updated_by'), // Nullable<int> in Activity.cs - FK to SystemUser
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in Activity.cs
    rowGuid: uuid('row_guid'), // Nullable<Guid> in Activity.cs
});
// Relations - using actual table objects for type safety
export const activitiesRelations = relations(activities, ({ one, many }) => ({
    status: one(statuses, {
        fields: [activities.statusId],
        references: [statuses.id],
    }),
    hqStatus: one(statuses, {
        fields: [activities.hqStatusId],
        references: [statuses.id],
        relationName: 'hqStatus',
    }),
    contactMinistry: one(ministries, {
        fields: [activities.contactMinistryId],
        references: [ministries.id],
    }),
    city: one(cities, {
        fields: [activities.cityId],
        references: [cities.id],
    }),
    governmentRepresentative: one(governmentRepresentatives, {
        fields: [activities.governmentRepresentativeId],
        references: [governmentRepresentatives.id],
    }),
    communicationContact: one(communicationContacts, {
        fields: [activities.communicationContactId],
        references: [communicationContacts.id],
    }),
    eventPlanner: one(eventPlanners, {
        fields: [activities.eventPlannerId],
        references: [eventPlanners.id],
    }),
    videographer: one(videographers, {
        fields: [activities.videographerId],
        references: [videographers.id],
    }),
    createdByUser: one(systemUsers, {
        fields: [activities.createdBy],
        references: [systemUsers.id],
        relationName: 'createdBy',
    }),
    updatedByUser: one(systemUsers, {
        fields: [activities.lastUpdatedBy],
        references: [systemUsers.id],
        relationName: 'updatedBy',
    }),
    // Junction tables
    activityCategories: many(activityCategories),
    activityThemes: many(activityThemes),
    activityInitiatives: many(activityInitiatives),
    activityKeywords: many(activityKeywords),
    activityTags: many(activityTags),
    activitySharedWiths: many(activitySharedWith),
    activityCommunicationMaterials: many(activityCommunicationMaterials),
    activityNROrigins: many(activityNROrigins),
    activitySectors: many(activitySectors),
    favoriteActivities: many(favoriteActivities),
    logs: many(logs),
    newsFeeds: many(newsFeeds),
}));
