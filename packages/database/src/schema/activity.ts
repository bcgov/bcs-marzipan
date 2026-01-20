import {
  pgTable,
  serial,
  timestamp,
  date,
  time,
  varchar,
  text,
  integer,
  boolean,
  uuid,
  bigint,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import {
  activityStatuses,
  dateStatuses,
  timeStatuses,
  eventPlanners,
  newsReleaseDistributions,
  premierRequested,
  newsReleaseOrigins,
} from './lookups';

import { organizations } from './organizations';
import { systemUsers } from './user';
import {
  activityThemes,
  activityTags,
  activitySubscriptions,
  activityCategories,
  activityCommsMaterials,
  activityTranslationsRequired,
  activityRepresentatives,
  activitySharedWithTeams,
  activityAdditionalCommsContacts,
  activitySectors,
  favoriteActivities,
  activityReportSettings,
} from './relations';
import { ministries } from './ministry';
import { venueAddresses } from './venue-address';

/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
export const activities = pgTable(
  'activities',
  {
    id: serial('id').primaryKey().notNull(),

    // Display ID (computed: {ministryAbbreviation}-{paddedLast6Digits} format)
    // Format: <ACRONYM>-<000001> (e.g., AG-000123, HLTH-456789)
    displayId: varchar('display_id', { length: 50 }).unique(), // Computed field: {ministryAbbreviation}-{paddedLast6Digits}
    isActive: boolean('is_active').notNull().default(true),

    // Overview and approval
    title: varchar('title', { length: 255 }).notNull(),
    leadOrgId: uuid('lead_org_id').references(() => organizations.id), // FK to Organizations (mutually exclusive with leadOrgName)
    leadOrgName: varchar('lead_org_name', { length: 255 }), // Free text for organizations not in Organizations table (mutually exclusive with leadOrgId)
    summary: text('summary').notNull(),
    significance: text('significance').notNull(),
    isIssue: boolean('is_issue').notNull().default(false),

    // Scheduling
    isAllDay: boolean('is_all_day').notNull().default(false),
    startDate: date('start_date'),
    endDate: date('end_date'),
    dateStatusId: integer('date_status_id')
      .notNull()
      .references(() => dateStatuses.id), // FK to DateStatus - maps to legacy isConfirmed field
    startTime: time('start_time'),
    endTime: time('end_time'),
    timeStatusId: integer('time_status_id')
      .notNull()
      .references(() => timeStatuses.id), // FK to TimeStatus

    schedulingNotes: text('scheduling_notes'), // (500 char limit) maps to legacy Schedule field
    strategy: text('strategy'), // Strategic information (legacy field)

    // News Release
    newsReleaseOriginId: integer('news_release_origin_id').references(
      () => newsReleaseOrigins.id
    ), // FK to NewsReleaseOrigin lookup table
    newsReleaseId: uuid('news_release_id'),
    newsReleaseDateTime: timestamp('news_release_date_time', {
      withTimezone: true,
    }), // News release date/time (legacy field)

    // Event
    eventPlannerLeadId: integer('event_planner_lead_id').references(
      () => eventPlanners.id
    ), // FK to EventPlanner (mutually exclusive with eventPlannerLeadName)
    eventPlannerLeadName: varchar('event_planner_lead_name', { length: 255 }), // Free text for non-system user event leads (mutually exclusive with eventPlannerLeadId)

    // Look Ahead
    executiveSummary: text('executive_summary'), // maps to legacy HqComments field
    lookAheadStatus: varchar('look_ahead_status', { length: 50 }), // 'none', 'new', 'changed'  maps to legacy HqStatusId field
    lookAheadSection: varchar('look_ahead_section', { length: 50 }), // 'events', 'issues', 'news', 'awareness' maps to legacy HqSection field

    // Confidential flag maps to "Not for Look Ahead" in UI
    isConfidential: boolean('is_confidential').notNull().default(false),

    // Notes and additional fields
    notes: text('notes'), // Maps to legacy Comments field
    pitchDate: date('pitch_date'), // Date when activity was or will be pitched (nullable)
    newsReleaseDistributionId: integer(
      'news_release_distribution_id'
    ).references(() => newsReleaseDistributions.id), // FK to NewsReleaseDistribution - maps to legacy NRDistributionId
    premierRequestedId: integer('premier_requested_id').references(
      () => premierRequested.id
    ), // FK to PremierRequested - maps to legacy PremierRequestedId
    visibility: varchar('visibility', { length: 50 })
      .notNull()
      .default('global'), // 'global' or 'team' - controls base access visibility

    commsContactLeadId: integer('comms_contact_lead_id')
      .notNull()
      .references(() => systemUsers.id), // FK to SystemUser
    leadMinistryId: uuid('lead_ministry_id')
      .notNull()
      .references(() => ministries.id), // FK to Ministry (required for displayId generation)
    activityStatusId: integer('activity_status_id')
      .notNull()
      .references(() => activityStatuses.id), // FK to ActivityStatus

    // Audit fields
    createdBy: integer('created_by')
      .notNull()
      .references(() => systemUsers.id), // FK to SystemUser
    lastUpdatedBy: integer('last_updated_by')
      .notNull()
      .references(() => systemUsers.id), // FK to SystemUser
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    rowVersion: bigint('row_version', { mode: 'number' }).notNull().default(0), // Optimistic concurrency control
  },
  (table) => [
    // CHECK constraint: exactly one of leadOrgId or leadOrgName must be provided (XOR)
    check(
      'lead_org_xor',
      sql`(${table.leadOrgId} IS NULL) <> (${table.leadOrgName} IS NULL)`
    ),
    // CHECK constraint: exactly one of eventPlannerLeadId or eventPlannerLeadName must be provided (XOR)
    check(
      'event_planner_lead_xor',
      sql`(${table.eventPlannerLeadId} IS NULL) <> (${table.eventPlannerLeadName} IS NULL)`
    ),
  ]
);

// Relations
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  activityStatus: one(activityStatuses, {
    fields: [activities.activityStatusId],
    references: [activityStatuses.id],
  }),
  dateStatus: one(dateStatuses, {
    fields: [activities.dateStatusId],
    references: [dateStatuses.id],
  }),
  timeStatus: one(timeStatuses, {
    fields: [activities.timeStatusId],
    references: [timeStatuses.id],
  }),
  leadOrg: one(organizations, {
    fields: [activities.leadOrgId],
    references: [organizations.id],
  }),
  newsReleaseOrigin: one(newsReleaseOrigins, {
    fields: [activities.newsReleaseOriginId],
    references: [newsReleaseOrigins.id],
    relationName: 'newsReleaseOrigin',
  }),
  eventLead: one(eventPlanners, {
    fields: [activities.eventPlannerLeadId],
    references: [eventPlanners.id],
    relationName: 'eventLead',
  }),
  commsContact: one(systemUsers, {
    fields: [activities.commsContactLeadId],
    references: [systemUsers.id],
    relationName: 'commsContact',
  }),
  createdByUser: one(systemUsers, {
    fields: [activities.createdBy],
    references: [systemUsers.id],
    relationName: 'createdBy',
  }),
  leadMinistry: one(ministries, {
    fields: [activities.leadMinistryId],
    references: [ministries.id],
    relationName: 'leadMinistry',
  }),
  newsReleaseDistribution: one(newsReleaseDistributions, {
    fields: [activities.newsReleaseDistributionId],
    references: [newsReleaseDistributions.id],
    relationName: 'newsReleaseDistribution',
  }),
  premierRequestedLookup: one(premierRequested, {
    fields: [activities.premierRequestedId],
    references: [premierRequested.id],
    relationName: 'premierRequestedLookup',
  }),

  // Junction tables
  activityCategories: many(activityCategories),
  activityCommsMaterials: many(activityCommsMaterials),
  activityTranslationsRequired: many(activityTranslationsRequired),
  activityRepresentatives: many(activityRepresentatives),
  activitySharedWithTeams: many(activitySharedWithTeams),
  activityAdditionalCommsContacts: many(activityAdditionalCommsContacts),
  activityThemes: many(activityThemes),
  activityTags: many(activityTags),
  activitySubscriptions: many(activitySubscriptions),
  activitySectors: many(activitySectors),
  favoriteActivities: many(favoriteActivities),
  reportSettings: many(activityReportSettings),
  venueAddress: one(venueAddresses, {
    fields: [activities.id],
    references: [venueAddresses.activityId],
  }),
}));
