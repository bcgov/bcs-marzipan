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
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import table objects for relations
import {
  activityStatuses,
  cities,
  pitchStatuses,
  schedulingStatuses,
} from './lookups';
import { ministries } from './ministry';
import { organizations } from './organizations';
import { systemUsers } from './user';
import {
  activityThemes,
  activityTags,
  activityCategories,
  activityJointOrganizations,
  activityRelatedEntries,
  activityCommsMaterials,
  activityTranslationLanguages,
  activityJointEventOrganizations,
  activityRepresentatives,
  activitySharedWithOrganizations,
  activityCanEditUsers,
  activityCanViewUsers,
  activityFieldReviewStatuses,
} from './relations';

/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),

  // Display ID (computed: MIN-###### format)
  displayId: varchar('display_id', { length: 50 }), // Computed field: {ministryAcronym}-{paddedId}

  // Scheduling

  startDate: date('start_date'),
  startTime: time('start_time'),
  endDate: date('end_date'),
  endTime: time('end_time'),

  schedulingStatusId: integer('scheduling_status_id'), // FK to SchedulingStatusˆ
  schedulingConsiderations: text('scheduling_considerations'), // Renamed from schedule (500 char limit)

  // Overview and approval
  title: varchar('title', { length: 500 }),
  summary: text('summary'), // Renamed from details (1000 char limit in new type)
  comments: text('comments'), // Deprecated - kept for backward compatibility
  leadOrganization: varchar('lead_organization', { length: 255 }), // Deprecated - replaced by leadOrgId
  venue: varchar('venue', { length: 500 }), // Deprecated - replaced by venueAddress
  venueAddress: jsonb('venue_address'), // New: {street, city, provinceOrState, country}
  significance: text('significance'),

  pitchComments: text('pitch_comments'), // New (500 char limit)
  newsReleaseId: uuid('news_release_id'), // New

  // Foreign keys (new)
  activityStatusId: integer('entry_status_id'), // FK to ActivityStatus
  pitchStatusId: integer('pitch_status_id'), // FK to PitchStatus
  leadOrgId: uuid('lead_org_id'), // FK to Organizations
  eventLeadOrgId: uuid('event_lead_org_id'), // FK to Organizations
  commsLeadId: integer('comms_lead_id'), // FK to SystemUser
  eventLeadId: integer('event_lead_id'), // FK to SystemUser (mutually exclusive with eventLeadName)
  eventLeadName: varchar('event_lead_name', { length: 255 }), // Free text for non-system user event leads (mutually exclusive with eventLeadId)
  graphicsUserId: integer('graphics_user_id'), // FK to SystemUser (replaces graphicsId lookup)
  ownerId: integer('owner_id'), // FK to SystemUser

  // Foreign keys
  nrDistributionId: integer('nr_distribution_id'), // FK to NRDistribution
  premierRequestedId: integer('premier_requested_id'), // FK to PremierRequested
  contactMinistryId: uuid('contact_ministry_id'), // FK to Ministry
  cityId: integer('city_id'), // FK to City

  // Boolean flags (new)
  isAllDay: boolean('is_all_day').notNull().default(false),
  oicRelated: boolean('oic_related').notNull().default(false), // New
  notForLookAhead: boolean('not_for_look_ahead').notNull().default(false), // New
  planningReport: boolean('planning_report').notNull().default(false), // New
  thirtySixtyNinetyReport: boolean('thirty_sixty_ninety_report')
    .notNull()
    .default(false), // New (fixed typo from "thrity")

  // Boolean flags
  isActive: boolean('is_active').notNull().default(true), // Relates to activityStatusId

  isConfidential: boolean('is_confidential').notNull().default(false), // Deprecated - use confidential
  isIssue: boolean('is_issue').notNull().default(false),

  // Enums (stored as varchar)
  lookAheadStatus: varchar('look_ahead_status', { length: 50 }), // 'none', 'new', 'changed'
  lookAheadSection: varchar('look_ahead_section', { length: 50 }), // 'events', 'issues', 'news', 'awareness'
  calendarVisibility: varchar('calendar_visibility', { length: 50 }), // 'visible', 'partial', 'hidden'

  // HQ Section (deprecated - kept for backward compatibility)
  hqSection: integer('hq_section').notNull().default(0), // TODO: unsure what this is for?

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

// Relations - using actual table objects for type safety
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  activityStatus: one(activityStatuses, {
    fields: [activities.activityStatusId],
    references: [activityStatuses.id],
  }),

  pitchStatus: one(pitchStatuses, {
    fields: [activities.pitchStatusId],
    references: [pitchStatuses.id],
  }),
  schedulingStatus: one(schedulingStatuses, {
    fields: [activities.schedulingStatusId],
    references: [schedulingStatuses.id],
  }),
  leadOrg: one(organizations, {
    fields: [activities.leadOrgId],
    references: [organizations.id],
  }),
  eventLeadOrg: one(organizations, {
    fields: [activities.eventLeadOrgId],
    references: [organizations.id],
    relationName: 'eventLeadOrg',
  }),
  commsLead: one(systemUsers, {
    fields: [activities.commsLeadId],
    references: [systemUsers.id],
    relationName: 'commsLead',
  }),
  eventLead: one(systemUsers, {
    fields: [activities.eventLeadId],
    references: [systemUsers.id],
    relationName: 'eventLead',
  }),
  graphics: one(systemUsers, {
    fields: [activities.graphicsUserId],
    references: [systemUsers.id],
    relationName: 'graphics',
  }),
  owner: one(systemUsers, {
    fields: [activities.ownerId],
    references: [systemUsers.id],
    relationName: 'owner',
  }),

  contactMinistry: one(ministries, {
    fields: [activities.contactMinistryId],
    references: [ministries.id],
  }),
  city: one(cities, {
    fields: [activities.cityId],
    references: [cities.id],
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

  // Junction tables (new)
  activityCategories: many(activityCategories),
  activityJointOrganizations: many(activityJointOrganizations),
  activityRelatedEntries: many(activityRelatedEntries),
  activityCommsMaterials: many(activityCommsMaterials),
  activityTranslationLanguages: many(activityTranslationLanguages),
  activityJointEventOrganizations: many(activityJointEventOrganizations),
  activityRepresentatives: many(activityRepresentatives),
  activitySharedWithOrganizations: many(activitySharedWithOrganizations),
  activityCanEditUsers: many(activityCanEditUsers),
  activityCanViewUsers: many(activityCanViewUsers),
  activityFieldReviewStatuses: many(activityFieldReviewStatuses),

  // Junction tables (existing)
  activityThemes: many(activityThemes),
  activityTags: many(activityTags),
}));
