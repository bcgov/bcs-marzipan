import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  activityStatuses,
  dateStatuses,
  newsReleaseDistributions,
  newsReleaseOrigins,
  premierRequested,
  timeStatuses,
  translationRequiredStatuses,
  venueStatuses,
} from './lookups';
import {
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityEventPlanners,
  activityOrganizations,
  activityRepresentatives,
  activitySectors,
  activitySharedWithTeams,
  activitySubscriptions,
  activityTags,
  activityThemes,
  activityTranslationsRequired,
} from './relations';
import { teams } from './teams';
import { users } from './user';
import { venueAddresses } from './venue-address';

/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
export const activities = pgTable(
  'activities',
  {
    id: serial('id').primaryKey().notNull(),

    // Display ID (computed): <prefix>-<numeric segment> (see shared buildActivityDisplayId)
    // Prefix from lead team abbreviation (normalized), or TEAM fallback when empty.
    // Numeric segment: full id zero-padded to min width 6 (e.g. AG-000123, HLTH-123456789).
    displayId: varchar('display_id', { length: 50 }).unique(),

    // Overview and approval
    title: varchar('title', { length: 255 }).notNull(),
    summary: text('summary').notNull(),
    significance: text('significance'),
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

    venueStatusId: integer('venue_status_id').references(
      () => venueStatuses.id
    ), // FK to VenueStatus (TBC / TBD)

    // News Release
    newsReleaseOriginId: integer('news_release_origin_id').references(
      () => newsReleaseOrigins.id
    ), // FK to NewsReleaseOrigin lookup table
    releaseSchedulingMode: varchar('release_scheduling_mode', { length: 50 }),
    releaseTimeOffsetMinutes: integer('release_time_offset_minutes'),
    releaseTime: timestamp('release_time', { withTimezone: true }),

    // Look Ahead
    executiveSummary: text('executive_summary'), // maps to legacy HqComments field
    lookAheadStatus: varchar('look_ahead_status', { length: 50 }), // 'none', 'new', 'changed'  maps to legacy HqStatusId field
    lookAheadSection: varchar('look_ahead_section', { length: 50 }), // 'events', 'issues', 'news', 'awareness' maps to legacy HqSection field

    // Highly confidential / sensitive; restricts visibility and shows badges in print.
    isConfidential: boolean('is_confidential').notNull().default(false),

    // Notes and additional fields
    notes: text('notes'), // Maps to legacy Comments field
    translationsRequiredStatusId: integer(
      'translations_required_status_id'
    ).references(() => translationRequiredStatuses.id), // tbd, required, no_translations, or null (N/A)
    newsReleaseDistributionId: integer(
      'news_release_distribution_id'
    ).references(() => newsReleaseDistributions.id), // FK to NewsReleaseDistribution - maps to legacy NRDistributionId
    premierRequestedId: integer('premier_requested_id').references(
      () => premierRequested.id
    ), // FK to PremierRequested - maps to legacy PremierRequestedId
    visibility: varchar('visibility', { length: 50 })
      .notNull()
      .default('global'), // 'global' or 'team' - controls base access visibility

    leadTeamId: integer('lead_team_id')
      .notNull()
      .references(() => teams.id), // FK to Teams - primary association for which team leads this activity
    activityStatusId: integer('activity_status_id')
      .notNull()
      .references(() => activityStatuses.id), // FK to ActivityStatus

    // Review snapshot: canonical form-data JSON captured when status transitions to 'reviewed'.
    // Used to compute per-field diff for reviewers. NULL when never reviewed or cleared on soft delete.
    reviewedFieldSnapshot: jsonb('reviewed_field_snapshot'),
    reviewedFieldSnapshotVersion: integer('reviewed_field_snapshot_version')
      .notNull()
      .default(1),

    // Audit fields
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id), // FK to User
    lastUpdatedBy: integer('last_updated_by')
      .notNull()
      .references(() => users.id), // FK to User
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    /** Last update visible to clients without edit access (may lag operational when deferred). */
    publicLastUpdatedBy: integer('public_last_updated_by')
      .notNull()
      .references(() => users.id),
    publicLastUpdatedDateTime: timestamp('public_last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    rowVersion: bigint('row_version', { mode: 'number' }).notNull().default(0), // Optimistic concurrency control
  },
  (table) => [
    // Trigram indexes for ILIKE search
    index('idx_activities_title_trgm').using(
      'gin',
      sql`lower(${table.title}) gin_trgm_ops`
    ),
    index('idx_activities_display_id_trgm').using(
      'gin',
      sql`lower(${table.displayId}) gin_trgm_ops`
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
  venueStatus: one(venueStatuses, {
    fields: [activities.venueStatusId],
    references: [venueStatuses.id],
  }),
  newsReleaseOrigin: one(newsReleaseOrigins, {
    fields: [activities.newsReleaseOriginId],
    references: [newsReleaseOrigins.id],
    relationName: 'newsReleaseOrigin',
  }),
  createdByUser: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  leadTeam: one(teams, {
    fields: [activities.leadTeamId],
    references: [teams.id],
    relationName: 'leadTeam',
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
  translationsRequiredStatus: one(translationRequiredStatuses, {
    fields: [activities.translationsRequiredStatusId],
    references: [translationRequiredStatuses.id],
    relationName: 'translationsRequiredStatus',
  }),

  // Junction tables
  activityCategories: many(activityCategories),
  activityCommsMaterials: many(activityCommsMaterials),
  activityEventPlanners: many(activityEventPlanners),
  activityOrganizations: many(activityOrganizations),
  activityTranslationsRequired: many(activityTranslationsRequired),
  activityRepresentatives: many(activityRepresentatives),
  activitySharedWithTeams: many(activitySharedWithTeams),
  activityCommsContacts: many(activityCommsContacts),
  activityThemes: many(activityThemes),
  activityTags: many(activityTags),
  activitySubscriptions: many(activitySubscriptions),
  activitySectors: many(activitySectors),
  venueAddress: one(venueAddresses, {
    fields: [activities.id],
    references: [venueAddresses.activityId],
  }),
}));
