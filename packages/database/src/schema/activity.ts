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
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import {
  activityStatuses,
  pitchStatuses,
  dateStatuses,
  timeStatuses,
  venueStatuses,
} from './lookups';

import { organizations } from './organizations';
import { systemUsers } from './user';
import {
  activityThemes,
  activityTags,
  activityCategories,
  activityJointOrgs,
  activityRelatedEntries,
  activityCommsMaterials,
  activityTranslationsRequired,
  activityJointEventOrgs,
  activityRepresentatives,
  activitySharedWithOrgs,
  activityCanEditUsers,
  activityCanViewUsers,
  activityAdditionalOwners,
} from './relations';
import { ministries } from './ministry';

/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
export const activities = pgTable(
  'activities',
  {
    id: serial('id').primaryKey().notNull(),

    // Display ID (computed: MIN-###### format)
    // TODO: derive display ID from ministry and activity ID
    displayId: varchar('display_id', { length: 50 }).unique().notNull(), // Computed field: {ministryAcronym}-{paddedId}
    isActive: boolean('is_active').notNull().default(true),

    // Overview and approval
    title: varchar('title', { length: 255 }).notNull(),
    leadOrgId: uuid('lead_org_id').references(() => organizations.id), // FK to Organizations (mutually exclusive with leadOrgName)
    leadOrgName: varchar('lead_org_name', { length: 255 }), // Free text for organizations not in Organizations table (mutually exclusive with leadOrgId)
    summary: text('summary').notNull().default(''), // Renamed from details (1000 char limit in new type)
    significance: text('significance').notNull().default(''),
    isIssue: boolean('is_issue').notNull().default(false),
    pitchStatusId: integer('pitch_status_id')
      .notNull()
      .references(() => pitchStatuses.id), // FK to PitchStatus
    pitchComments: text('pitch_comments'), // New (500 char limit)

    // Scheduling
    isAllDay: boolean('is_all_day').notNull().default(false),
    startDate: date('start_date'),
    endDate: date('end_date'),
    dateStatusId: integer('date_status_id')
      .notNull()
      .references(() => dateStatuses.id), // FK to DateStatus
    startTime: time('start_time'),
    endTime: time('end_time'),
    timeStatusId: integer('time_status_id')
      .notNull()
      .references(() => timeStatuses.id), // FK to TimeStatus

    schedulingConsiderations: text('scheduling_considerations')
      .notNull()
      .default(''), // (500 char limit)

    // News Release
    newsReleaseOriginId: uuid('news_release_origin_id').references(
      () => organizations.id
    ), // FK to Organizations (mutually exclusive with newsReleaseOriginName)
    newsReleaseOriginName: varchar('news_release_origin_name', { length: 255 }), // Free text for organizations not in Organizations table (mutually exclusive with newsReleaseOriginId)
    newsReleaseId: uuid('news_release_id'),

    // Event
    venue: varchar('venue', { length: 100 }), // Venue name
    venueAddress: jsonb('venue_address'), // {street, city, provinceOrState, country
    venueStatusId: integer('venue_status_id').references(
      () => venueStatuses.id
    ), // FK to VenueStatus

    eventLeadOrgId: uuid('event_lead_org_id').references(
      () => organizations.id
    ), // FK to Organizations (mutually exclusive with eventLeadOrgName)
    eventLeadOrgName: varchar('event_lead_org_name', { length: 255 }), // Free text for organizations not in Organizations table (mutually exclusive with eventLeadOrgId)
    eventLeadId: integer('event_lead_id').references(() => systemUsers.id), // FK to SystemUser (mutually exclusive with eventLeadName)
    eventLeadName: varchar('event_lead_name', { length: 255 }), // Free text for non-system user event leads (mutually exclusive with eventLeadId)
    graphicsUserId: integer('graphics_user_id').references(
      () => systemUsers.id
    ), // FK to SystemUser (replaces graphicsId lookup)

    // Boolean flags
    notForLookAhead: boolean('not_for_look_ahead').notNull().default(false),
    notForThirtySixtyNinety: boolean('not_for_thirty_sixty_ninety')
      .notNull()
      .default(false),

    // Enums (stored as varchar)
    lookAheadStatus: varchar('look_ahead_status', { length: 50 }), // 'none', 'new', 'changed'
    lookAheadSection: varchar('look_ahead_section', { length: 50 }), // 'events', 'issues', 'news', 'awareness'
    calendarVisibility: varchar('calendar_visibility', {
      length: 50,
    }).notNull(), // 'visible', 'partial', 'hidden'

    ownerId: integer('owner_id')
      .notNull()
      .references(() => systemUsers.id), // FK to SystemUser (replaces commsLeadId)
    ministryOwnerId: uuid('ministry_owner_id').references(() => ministries.id), // FK to Ministry
    activityStatusId: integer('entry_status_id')
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
    // CHECK constraint: exactly one of eventLeadOrgId or eventLeadOrgName must be provided (XOR)
    check(
      'event_lead_org_xor',
      sql`(${table.eventLeadOrgId} IS NULL) <> (${table.eventLeadOrgName} IS NULL)`
    ),
    // CHECK constraint: exactly one of eventLeadId or eventLeadName must be provided (XOR)
    check(
      'event_lead_xor',
      sql`(${table.eventLeadId} IS NULL) <> (${table.eventLeadName} IS NULL)`
    ),
    // CHECK constraint: exactly one of newsReleaseOriginId or newsReleaseOriginName must be provided (XOR)
    check(
      'news_release_origin_xor',
      sql`(${table.newsReleaseOriginId} IS NULL) <> (${table.newsReleaseOriginName} IS NULL)`
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
  pitchStatus: one(pitchStatuses, {
    fields: [activities.pitchStatusId],
    references: [pitchStatuses.id],
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
  newsReleaseOrigin: one(organizations, {
    fields: [activities.newsReleaseOriginId],
    references: [organizations.id],
    relationName: 'newsReleaseOrigin',
  }),
  eventLead: one(systemUsers, {
    fields: [activities.eventLeadId],
    references: [systemUsers.id],
    relationName: 'eventLead',
  }),
  graphicsUser: one(systemUsers, {
    fields: [activities.graphicsUserId],
    references: [systemUsers.id],
    relationName: 'graphicsUser',
  }),
  owner: one(systemUsers, {
    fields: [activities.ownerId],
    references: [systemUsers.id],
    relationName: 'owner',
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
  venueStatus: one(venueStatuses, {
    fields: [activities.venueStatusId],
    references: [venueStatuses.id],
  }),
  ministryOwner: one(ministries, {
    fields: [activities.ministryOwnerId],
    references: [ministries.id],
    relationName: 'ministryOwner',
  }),

  // Junction tables (new)
  activityCategories: many(activityCategories),
  activityJointOrgs: many(activityJointOrgs),
  activityRelatedEntries: many(activityRelatedEntries),
  activityCommsMaterials: many(activityCommsMaterials),
  activityTranslationsRequired: many(activityTranslationsRequired),
  activityJointEventOrgs: many(activityJointEventOrgs),
  activityRepresentatives: many(activityRepresentatives),
  activitySharedWithOrgs: many(activitySharedWithOrgs),
  activityCanEditUsers: many(activityCanEditUsers),
  activityCanViewUsers: many(activityCanViewUsers),
  activityAdditionalOwners: many(activityAdditionalOwners),
  activityThemes: many(activityThemes),
  activityTags: many(activityTags),
}));
