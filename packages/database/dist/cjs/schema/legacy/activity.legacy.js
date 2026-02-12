"use strict";
/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitiesRelations = exports.activities = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// Import table objects for relations
const lookups_legacy_1 = require("./lookups.legacy");
const ministry_legacy_1 = require("./ministry.legacy");
const user_legacy_1 = require("./user.legacy");
const relations_legacy_1 = require("./relations.legacy");
const audit_legacy_1 = require("./audit.legacy");
/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
exports.activities = (0, pg_core_1.pgTable)('activities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    // Date/Time fields
    startDateTime: (0, pg_core_1.timestamp)('start_date_time', { withTimezone: true }),
    endDateTime: (0, pg_core_1.timestamp)('end_date_time', { withTimezone: true }),
    newsReleaseDateTime: (0, pg_core_1.timestamp)('news_release_date_time', {
        withTimezone: true,
    }), // News Release date
    // Text fields
    title: (0, pg_core_1.varchar)('title', { length: 500 }), // string (nullable in Activity.cs)
    details: (0, pg_core_1.varchar)('details', { length: 700 }), // string (nullable in Activity.cs)
    comments: (0, pg_core_1.varchar)('comments', { length: 4000 }), // string (nullable in Activity.cs)
    hqComments: (0, pg_core_1.varchar)('hq_comments', { length: 2000 }), // string (nullable in Activity.cs) - Only visible to HQ users
    leadOrganization: (0, pg_core_1.varchar)('lead_organization', { length: 100 }), // string (nullable in Activity.cs)
    venue: (0, pg_core_1.varchar)('venue', { length: 150 }), // string (nullable in Activity.cs)
    otherCity: (0, pg_core_1.varchar)('other_city', { length: 150 }), // string (nullable in Activity.cs)
    schedule: (0, pg_core_1.varchar)('schedule', { length: 500 }), // string (nullable in Activity.cs)
    significance: (0, pg_core_1.varchar)('significance', { length: 500 }), // string (nullable in Activity.cs)
    strategy: (0, pg_core_1.varchar)('strategy', { length: 500 }), // string (nullable in Activity.cs)
    potentialDates: (0, pg_core_1.varchar)('potential_dates', { length: 70 }), // string (nullable in Activity.cs)
    translations: (0, pg_core_1.varchar)('translations', { length: 500 }), // string (nullable in Activity.cs)
    // Foreign keys
    statusId: (0, pg_core_1.integer)('status_id'), // FK to Status
    hqStatusId: (0, pg_core_1.integer)('hq_status_id'), // FK to Status
    nrDistributionId: (0, pg_core_1.integer)('nr_distribution_id'), // FK to NRDistribution
    premierRequestedId: (0, pg_core_1.integer)('premier_requested_id'), // FK to PremierRequested
    contactMinistryId: (0, pg_core_1.uuid)('contact_ministry_id'), // FK to Ministry
    governmentRepresentativeId: (0, pg_core_1.integer)('government_representative_id'), // FK to GovernmentRepresentative
    communicationContactId: (0, pg_core_1.integer)('communication_contact_id'), // FK to CommunicationContact
    eventPlannerId: (0, pg_core_1.integer)('event_planner_id'), // FK to EventPlanner
    videographerId: (0, pg_core_1.integer)('videographer_id'), // FK to Videographer
    cityId: (0, pg_core_1.integer)('city_id'), // FK to City
    // Boolean flags
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(false),
    isConfirmed: (0, pg_core_1.boolean)('is_confirmed').notNull().default(false),
    isAllDay: (0, pg_core_1.boolean)('is_all_day').notNull().default(false),
    isAtLegislature: (0, pg_core_1.boolean)('is_at_legislature').notNull().default(false),
    isConfidential: (0, pg_core_1.boolean)('is_confidential').notNull().default(false),
    isCrossGovernment: (0, pg_core_1.boolean)('is_cross_government').notNull().default(false),
    isIssue: (0, pg_core_1.boolean)('is_issue').notNull().default(false),
    isMilestone: (0, pg_core_1.boolean)('is_milestone').notNull().default(false),
    // HQ Section (integer, not null in legacy)
    hqSection: (0, pg_core_1.integer)('hq_section').notNull().default(0),
    // "Needs Review" flags (15+ boolean fields for granular review)
    isTitleNeedsReview: (0, pg_core_1.boolean)('is_title_needs_review').notNull().default(false),
    isDetailsNeedsReview: (0, pg_core_1.boolean)('is_details_needs_review')
        .notNull()
        .default(false),
    isRepresentativeNeedsReview: (0, pg_core_1.boolean)('is_representative_needs_review')
        .notNull()
        .default(false),
    isCityNeedsReview: (0, pg_core_1.boolean)('is_city_needs_review').notNull().default(false),
    isStartDateNeedsReview: (0, pg_core_1.boolean)('is_start_date_needs_review')
        .notNull()
        .default(false),
    isEndDateNeedsReview: (0, pg_core_1.boolean)('is_end_date_needs_review')
        .notNull()
        .default(false),
    isCategoriesNeedsReview: (0, pg_core_1.boolean)('is_categories_needs_review')
        .notNull()
        .default(false),
    isActiveNeedsReview: (0, pg_core_1.boolean)('is_active_needs_review')
        .notNull()
        .default(false),
    isCommMaterialsNeedsReview: (0, pg_core_1.boolean)('is_comm_materials_needs_review')
        .notNull()
        .default(false),
    isSignificanceNeedsReview: (0, pg_core_1.boolean)('is_significance_needs_review')
        .notNull()
        .default(false),
    isStrategyNeedsReview: (0, pg_core_1.boolean)('is_strategy_needs_review')
        .notNull()
        .default(false),
    isschedulingNotesNeedsReview: (0, pg_core_1.boolean)('is_scheduling_considerations_needs_review')
        .notNull()
        .default(false),
    isInternalNotesNeedsReview: (0, pg_core_1.boolean)('is_internal_notes_needs_review')
        .notNull()
        .default(false),
    isLeadOrganizationNeedsReview: (0, pg_core_1.boolean)('is_lead_organization_needs_review')
        .notNull()
        .default(false),
    isInitiativesNeedsReview: (0, pg_core_1.boolean)('is_initiatives_needs_review')
        .notNull()
        .default(false),
    isTagsNeedsReview: (0, pg_core_1.boolean)('is_tags_needs_review').notNull().default(false),
    isOriginNeedsReview: (0, pg_core_1.boolean)('is_origin_needs_review')
        .notNull()
        .default(false),
    isDistributionNeedsReview: (0, pg_core_1.boolean)('is_distribution_needs_review')
        .notNull()
        .default(false),
    isTranslationsRequiredNeedsReview: (0, pg_core_1.boolean)('is_translations_required_needs_review')
        .notNull()
        .default(false),
    isPremierRequestedNeedsReview: (0, pg_core_1.boolean)('is_premier_requested_needs_review')
        .notNull()
        .default(false),
    isVenueNeedsReview: (0, pg_core_1.boolean)('is_venue_needs_review').notNull().default(false),
    isEventPlannerNeedsReview: (0, pg_core_1.boolean)('is_event_planner_needs_review')
        .notNull()
        .default(false),
    isDigitalNeedsReview: (0, pg_core_1.boolean)('is_digital_needs_review')
        .notNull()
        .default(false),
    // Audit fields
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }), // Nullable<DateTime> in Activity.cs
    createdBy: (0, pg_core_1.integer)('created_by'), // Nullable<int> in Activity.cs - FK to SystemUser
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }), // Nullable<DateTime> in Activity.cs
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by'), // Nullable<int> in Activity.cs - FK to SystemUser
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(), // byte[] (NOT NULL) in Activity.cs
    rowGuid: (0, pg_core_1.uuid)('row_guid'), // Nullable<Guid> in Activity.cs
});
// Relations - using actual table objects for type safety
exports.activitiesRelations = (0, drizzle_orm_1.relations)(exports.activities, ({ one, many }) => ({
    status: one(lookups_legacy_1.statuses, {
        fields: [exports.activities.statusId],
        references: [lookups_legacy_1.statuses.id],
    }),
    hqStatus: one(lookups_legacy_1.statuses, {
        fields: [exports.activities.hqStatusId],
        references: [lookups_legacy_1.statuses.id],
        relationName: 'hqStatus',
    }),
    contactMinistry: one(ministry_legacy_1.ministries, {
        fields: [exports.activities.contactMinistryId],
        references: [ministry_legacy_1.ministries.id],
    }),
    city: one(lookups_legacy_1.cities, {
        fields: [exports.activities.cityId],
        references: [lookups_legacy_1.cities.id],
    }),
    governmentRepresentative: one(lookups_legacy_1.governmentRepresentatives, {
        fields: [exports.activities.governmentRepresentativeId],
        references: [lookups_legacy_1.governmentRepresentatives.id],
    }),
    communicationContact: one(lookups_legacy_1.communicationContacts, {
        fields: [exports.activities.communicationContactId],
        references: [lookups_legacy_1.communicationContacts.id],
    }),
    eventPlanner: one(lookups_legacy_1.eventPlanners, {
        fields: [exports.activities.eventPlannerId],
        references: [lookups_legacy_1.eventPlanners.id],
    }),
    videographer: one(lookups_legacy_1.videographers, {
        fields: [exports.activities.videographerId],
        references: [lookups_legacy_1.videographers.id],
    }),
    createdByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activities.createdBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'createdBy',
    }),
    updatedByUser: one(user_legacy_1.systemUsers, {
        fields: [exports.activities.lastUpdatedBy],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'updatedBy',
    }),
    // Junction tables
    activityCategories: many(relations_legacy_1.activityCategories),
    activityThemes: many(relations_legacy_1.activityThemes),
    activityInitiatives: many(relations_legacy_1.activityInitiatives),
    activityKeywords: many(relations_legacy_1.activityKeywords),
    activityTags: many(relations_legacy_1.activityTags),
    activitySharedWiths: many(relations_legacy_1.activitySharedWith),
    activityCommunicationMaterials: many(relations_legacy_1.activityCommunicationMaterials),
    activityNROrigins: many(relations_legacy_1.activityNROrigins),
    activitySectors: many(relations_legacy_1.activitySectors),
    favoriteActivities: many(relations_legacy_1.favoriteActivities),
    logs: many(audit_legacy_1.logs),
    newsFeeds: many(audit_legacy_1.newsFeeds),
}));
