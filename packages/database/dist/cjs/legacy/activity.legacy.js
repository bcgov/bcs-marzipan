"use strict";
/**
 * LEGACY SCHEMA - FOR REFERENCE ONLY
 *
 * Source: Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 *
 * - This schema should NOT be imported in production code
 * - This schema should NOT be modified (it represents the legacy structure)
 * - Use when creating migration transformers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyActivitiesRelations = exports.legacyActivities = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// Import table objects for relations
const lookups_1 = require("../schema/lookups");
const ministry_1 = require("../schema/ministry");
const user_1 = require("../schema/user");
const relations_1 = require("../schema/relations");
/**
 * Legacy Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
exports.legacyActivities = (0, pg_core_1.pgTable)('activities_legacy_reference', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    // Date/Time fields
    startDateTime: (0, pg_core_1.timestamp)('start_date_time', { withTimezone: true }),
    endDateTime: (0, pg_core_1.timestamp)('end_date_time', { withTimezone: true }),
    nrDateTime: (0, pg_core_1.timestamp)('nr_date_time', { withTimezone: true }), // News Release date
    // Text fields
    title: (0, pg_core_1.varchar)('title', { length: 500 }),
    details: (0, pg_core_1.text)('details'),
    comments: (0, pg_core_1.text)('comments'),
    hqComments: (0, pg_core_1.text)('hq_comments'), // Only visible to HQ users
    leadOrganization: (0, pg_core_1.varchar)('lead_organization', { length: 255 }),
    venue: (0, pg_core_1.varchar)('venue', { length: 500 }),
    otherCity: (0, pg_core_1.varchar)('other_city', { length: 255 }),
    schedule: (0, pg_core_1.text)('schedule'),
    significance: (0, pg_core_1.text)('significance'),
    strategy: (0, pg_core_1.text)('strategy'),
    potentialDates: (0, pg_core_1.text)('potential_dates'),
    translations: (0, pg_core_1.text)('translations'),
    // Foreign keys
    statusId: (0, pg_core_1.integer)('status_id'), // FK to Status
    hqStatusId: (0, pg_core_1.integer)('hq_status_id'), // FK to Status
    nrDistributionId: (0, pg_core_1.integer)('nr_distribution_id'), // FK to NRDistribution
    premierRequestedId: (0, pg_core_1.integer)('premier_requested_id'), // FK to PremierRequested
    contactMinistryId: (0, pg_core_1.uuid)('contact_ministry_id'), // FK to Ministry
    governmentRepresentativeId: (0, pg_core_1.integer)('government_representative_id'), // FK to GovernmentRepresentative
    communicationContactId: (0, pg_core_1.integer)('communication_contact_id'), // FK to CommunicationContact
    eventPlannerId: (0, pg_core_1.integer)('event_planner_id'), // FK to EventPlanner
    // videographerId: integer('videographer_id'), // FK to Videographer
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
    isSchedulingConsiderationsNeedsReview: (0, pg_core_1.boolean)('is_scheduling_considerations_needs_review')
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
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true }),
    createdBy: (0, pg_core_1.integer)('created_by'), // FK to SystemUser
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    }),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by'), // FK to SystemUser
    rowVersion: (0, pg_core_1.bigint)('row_version', { mode: 'number' }).notNull().default(0), // Optimistic concurrency control
    rowGuid: (0, pg_core_1.uuid)('row_guid'),
});
// Note: These relations reference the current schema tables for type safety,
// but represent the legacy relationship structure
exports.legacyActivitiesRelations = (0, drizzle_orm_1.relations)(exports.legacyActivities, ({ one, many }) => ({
    status: one(lookups_1.activityStatuses, {
        fields: [exports.legacyActivities.statusId],
        references: [lookups_1.activityStatuses.id],
    }),
    hqStatus: one(lookups_1.activityStatuses, {
        fields: [exports.legacyActivities.hqStatusId],
        references: [lookups_1.activityStatuses.id],
        relationName: 'hqStatus',
    }),
    contactMinistry: one(ministry_1.ministries, {
        fields: [exports.legacyActivities.contactMinistryId],
        references: [ministry_1.ministries.id],
    }),
    city: one(lookups_1.cities, {
        fields: [exports.legacyActivities.cityId],
        references: [lookups_1.cities.id],
    }),
    governmentRepresentative: one(lookups_1.governmentRepresentatives, {
        fields: [exports.legacyActivities.governmentRepresentativeId],
        references: [lookups_1.governmentRepresentatives.id],
    }),
    communicationContact: one(lookups_1.communicationContacts, {
        fields: [exports.legacyActivities.communicationContactId],
        references: [lookups_1.communicationContacts.id],
    }),
    eventPlanner: one(lookups_1.eventPlanners, {
        fields: [exports.legacyActivities.eventPlannerId],
        references: [lookups_1.eventPlanners.id],
    }),
    // videographer: one(videographers, {
    //   fields: [legacyActivities.videographerId],
    //   references: [videographers.id],
    // }),
    createdByUser: one(user_1.systemUsers, {
        fields: [exports.legacyActivities.createdBy],
        references: [user_1.systemUsers.id],
        relationName: 'createdBy',
    }),
    updatedByUser: one(user_1.systemUsers, {
        fields: [exports.legacyActivities.lastUpdatedBy],
        references: [user_1.systemUsers.id],
        relationName: 'updatedBy',
    }),
    // Legacy junction table references (preserved for documentation)
    // @ts-expect-error - Junction table references for documentation only
    activityCategories: many('activityCategories'),
    activityThemes: many(relations_1.activityThemes),
    // @ts-expect-error - Junction table references for documentation only
    activityInitiatives: many('activityInitiatives'),
    // @ts-expect-error - Junction table references for documentation only
    activityKeywords: many('activityKeywords'),
    activityTags: many(relations_1.activityTags),
    // @ts-expect-error - Junction table references for documentation only
    activitySharedWiths: many('activitySharedWiths'),
    // @ts-expect-error - Junction table references for documentation only
    activityCommunicationMaterials: many('activityCommunicationMaterials'),
    // @ts-expect-error - Junction table references for documentation only
    activityNROrigins: many('activityNROrigins'),
    // @ts-expect-error - Junction table references for documentation only
    activitySectors: many('activitySectors'),
    // @ts-expect-error - Junction table references for documentation only
    activityFiles: many('activityFiles'),
    // @ts-expect-error - Junction table references for documentation only
    activityFavorites: many('activityFavorites'),
    // @ts-expect-error - Junction table references for documentation only
    logs: many('logs'),
    // @ts-expect-error - Junction table references for documentation only
    newsFeeds: many('newsFeeds'),
}));
