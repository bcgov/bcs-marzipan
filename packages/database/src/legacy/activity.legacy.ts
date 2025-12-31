/**
 * LEGACY SCHEMA - FOR REFERENCE ONLY
 *
 * Source: Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 *
 * - This schema should NOT be imported in production code
 * - This schema should NOT be modified (it represents the legacy structure)
 * - Use when creating migration transformers
 */

import {
  pgTable,
  serial,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import table objects for relations
import {
  activityStatuses,
  cities,
  governmentRepresentatives,
  communicationContacts,
  // videographers,
} from '../schema/lookups';
import { ministries } from '../schema/ministry';
import { systemUsers } from '../schema/user';
import { activityThemes, activityTags } from '../schema/relations';

/**
 * Legacy Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
export const legacyActivities = pgTable('activities_legacy_reference', {
  id: serial('id').primaryKey(),

  // Date/Time fields
  startDateTime: timestamp('start_date_time', { withTimezone: true }),
  endDateTime: timestamp('end_date_time', { withTimezone: true }),
  nrDateTime: timestamp('nr_date_time', { withTimezone: true }), // News Release date

  // Text fields
  title: varchar('title', { length: 500 }),
  details: text('details'),
  comments: text('comments'),
  hqComments: text('hq_comments'), // Only visible to HQ users
  leadOrganization: varchar('lead_organization', { length: 255 }),
  venue: varchar('venue', { length: 500 }),
  otherCity: varchar('other_city', { length: 255 }),
  schedule: text('schedule'),
  significance: text('significance'),
  strategy: text('strategy'),
  potentialDates: text('potential_dates'),
  translations: text('translations'),

  // Foreign keys
  statusId: integer('status_id'), // FK to Status
  hqStatusId: integer('hq_status_id'), // FK to Status
  nrDistributionId: integer('nr_distribution_id'), // FK to NRDistribution
  premierRequestedId: integer('premier_requested_id'), // FK to PremierRequested
  contactMinistryId: uuid('contact_ministry_id'), // FK to Ministry
  governmentRepresentativeId: integer('government_representative_id'), // FK to GovernmentRepresentative
  communicationContactId: integer('communication_contact_id'), // FK to CommunicationContact
  // eventPlannerId: integer('event_planner_id'), // FK to EventPlanner (removed - replaced by eventLeadId in new schema)
  // videographerId: integer('videographer_id'), // FK to Videographer
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
  isSchedulingConsiderationsNeedsReview: boolean(
    'is_scheduling_considerations_needs_review'
  )
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
  isTranslationsRequiredNeedsReview: boolean(
    'is_translations_required_needs_review'
  )
    .notNull()
    .default(false),
  isPremierRequestedNeedsReview: boolean('is_premier_requested_needs_review')
    .notNull()
    .default(false),
  isVenueNeedsReview: boolean('is_venue_needs_review').notNull().default(false),
  // isEventPlannerNeedsReview: boolean('is_event_planner_needs_review') (removed - replaced by eventLeadId in new schema)
  isDigitalNeedsReview: boolean('is_digital_needs_review')
    .notNull()
    .default(false),

  // Audit fields
  createdDateTime: timestamp('created_date_time', { withTimezone: true }),
  createdBy: integer('created_by'), // FK to SystemUser
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  }),
  lastUpdatedBy: integer('last_updated_by'), // FK to SystemUser
  rowVersion: bigint('row_version', { mode: 'number' }).notNull().default(0), // Optimistic concurrency control
  rowGuid: uuid('row_guid'),
});

// Note: These relations reference the current schema tables for type safety,
// but represent the legacy relationship structure
export const legacyActivitiesRelations = relations(
  legacyActivities,
  ({ one, many }) => ({
    status: one(activityStatuses, {
      fields: [legacyActivities.statusId],
      references: [activityStatuses.id],
    }),
    hqStatus: one(activityStatuses, {
      fields: [legacyActivities.hqStatusId],
      references: [activityStatuses.id],
      relationName: 'hqStatus',
    }),
    contactMinistry: one(ministries, {
      fields: [legacyActivities.contactMinistryId],
      references: [ministries.id],
    }),
    city: one(cities, {
      fields: [legacyActivities.cityId],
      references: [cities.id],
    }),
    governmentRepresentative: one(governmentRepresentatives, {
      fields: [legacyActivities.governmentRepresentativeId],
      references: [governmentRepresentatives.id],
    }),
    communicationContact: one(communicationContacts, {
      fields: [legacyActivities.communicationContactId],
      references: [communicationContacts.id],
    }),
    // eventPlanner: one(eventPlanners, { (removed - replaced by eventLeadId in new schema)
    //   fields: [legacyActivities.eventPlannerId],
    //   references: [eventPlanners.id],
    // }),
    // videographer: one(videographers, {
    //   fields: [legacyActivities.videographerId],
    //   references: [videographers.id],
    // }),
    createdByUser: one(systemUsers, {
      fields: [legacyActivities.createdBy],
      references: [systemUsers.id],
      relationName: 'createdBy',
    }),
    updatedByUser: one(systemUsers, {
      fields: [legacyActivities.lastUpdatedBy],
      references: [systemUsers.id],
      relationName: 'updatedBy',
    }),

    // Legacy junction table references (preserved for documentation)
    // @ts-expect-error - Junction table references for documentation only
    activityCategories: many('activityCategories'),
    activityThemes: many(activityThemes),
    // @ts-expect-error - Junction table references for documentation only
    activityInitiatives: many('activityInitiatives'),
    // @ts-expect-error - Junction table references for documentation only
    activityKeywords: many('activityKeywords'),
    activityTags: many(activityTags),
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
  })
);
