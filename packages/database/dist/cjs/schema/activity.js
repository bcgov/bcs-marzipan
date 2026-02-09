"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitiesRelations = exports.activities = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const lookups_1 = require("./lookups");
const organizations_1 = require("./organizations");
const user_1 = require("./user");
const relations_1 = require("./relations");
const ministry_1 = require("./ministry");
const venue_address_1 = require("./venue-address");
/**
 * Activity table - Core entity for calendar events
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Activity.cs
 */
exports.activities = (0, pg_core_1.pgTable)('activities', {
    id: (0, pg_core_1.serial)('id').primaryKey().notNull(),
    // Display ID (computed: {ministryAbbreviation}-{paddedLast6Digits} format)
    // Format: <ACRONYM>-<000001> (e.g., AG-000123, HLTH-456789)
    displayId: (0, pg_core_1.varchar)('display_id', { length: 50 }).unique(), // Computed field: {ministryAbbreviation}-{paddedLast6Digits}
    // Overview and approval
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    leadOrgId: (0, pg_core_1.uuid)('lead_org_id').references(() => organizations_1.organizations.id), // FK to Organizations (mutually exclusive with leadOrgName)
    leadOrgName: (0, pg_core_1.varchar)('lead_org_name', { length: 255 }), // Free text for organizations not in Organizations table (mutually exclusive with leadOrgId)
    summary: (0, pg_core_1.text)('summary').notNull(),
    significance: (0, pg_core_1.text)('significance').notNull(),
    isIssue: (0, pg_core_1.boolean)('is_issue').notNull().default(false),
    // Scheduling
    isAllDay: (0, pg_core_1.boolean)('is_all_day').notNull().default(false),
    startDate: (0, pg_core_1.date)('start_date'),
    endDate: (0, pg_core_1.date)('end_date'),
    dateStatusId: (0, pg_core_1.integer)('date_status_id')
        .notNull()
        .references(() => lookups_1.dateStatuses.id), // FK to DateStatus - maps to legacy isConfirmed field
    startTime: (0, pg_core_1.time)('start_time'),
    endTime: (0, pg_core_1.time)('end_time'),
    timeStatusId: (0, pg_core_1.integer)('time_status_id')
        .notNull()
        .references(() => lookups_1.timeStatuses.id), // FK to TimeStatus
    schedulingNotes: (0, pg_core_1.text)('scheduling_notes'), // (500 char limit) maps to legacy Schedule field
    strategy: (0, pg_core_1.text)('strategy'), // Strategic information (legacy field)
    // News Release
    newsReleaseOriginId: (0, pg_core_1.integer)('news_release_origin_id').references(() => lookups_1.newsReleaseOrigins.id), // FK to NewsReleaseOrigin lookup table
    newsReleaseId: (0, pg_core_1.uuid)('news_release_id'),
    newsReleaseDateTime: (0, pg_core_1.timestamp)('news_release_date_time', {
        withTimezone: true,
    }), // News release date/time (legacy field)
    // Event
    eventPlannerLeadId: (0, pg_core_1.integer)('event_planner_lead_id').references(() => lookups_1.eventPlanners.id), // FK to EventPlanner (mutually exclusive with eventPlannerLeadName)
    eventPlannerLeadName: (0, pg_core_1.varchar)('event_planner_lead_name', { length: 255 }), // Free text for non-user event leads (mutually exclusive with eventPlannerLeadId)
    // Look Ahead
    executiveSummary: (0, pg_core_1.text)('executive_summary'), // maps to legacy HqComments field
    lookAheadStatus: (0, pg_core_1.varchar)('look_ahead_status', { length: 50 }), // 'none', 'new', 'changed'  maps to legacy HqStatusId field
    lookAheadSection: (0, pg_core_1.varchar)('look_ahead_section', { length: 50 }), // 'events', 'issues', 'news', 'awareness' maps to legacy HqSection field
    // Confidential flag maps to "Not for Look Ahead" in UI
    isConfidential: (0, pg_core_1.boolean)('is_confidential').notNull().default(false),
    // Notes and additional fields
    notes: (0, pg_core_1.text)('notes'), // Maps to legacy Comments field
    pitchDate: (0, pg_core_1.date)('pitch_date'), // Date when activity was or will be pitched (nullable)
    pitchRequired: (0, pg_core_1.boolean)('pitch_required'), // Whether pitch is required for this activity (nullable - can override category default)
    newsReleaseDistributionId: (0, pg_core_1.integer)('news_release_distribution_id').references(() => lookups_1.newsReleaseDistributions.id), // FK to NewsReleaseDistribution - maps to legacy NRDistributionId
    premierRequestedId: (0, pg_core_1.integer)('premier_requested_id').references(() => lookups_1.premierRequested.id), // FK to PremierRequested - maps to legacy PremierRequestedId
    visibility: (0, pg_core_1.varchar)('visibility', { length: 50 })
        .notNull()
        .default('global'), // 'global' or 'team' - controls base access visibility
    leadMinistryId: (0, pg_core_1.uuid)('lead_ministry_id')
        .notNull()
        .references(() => ministry_1.ministries.id), // FK to Ministry (required for displayId generation)
    activityStatusId: (0, pg_core_1.integer)('activity_status_id')
        .notNull()
        .references(() => lookups_1.activityStatuses.id), // FK to ActivityStatus
    // Audit fields
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id), // FK to User
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id), // FK to User
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    rowVersion: (0, pg_core_1.bigint)('row_version', { mode: 'number' }).notNull().default(0), // Optimistic concurrency control
}, (table) => [
    // CHECK constraint: exactly one of leadOrgId or leadOrgName must be provided (XOR)
    (0, pg_core_1.check)('lead_org_xor', (0, drizzle_orm_1.sql) `(${table.leadOrgId} IS NULL) <> (${table.leadOrgName} IS NULL)`),
    // CHECK constraint: exactly one of eventPlannerLeadId or eventPlannerLeadName must be provided (XOR)
    (0, pg_core_1.check)('event_planner_lead_xor', (0, drizzle_orm_1.sql) `(${table.eventPlannerLeadId} IS NULL) <> (${table.eventPlannerLeadName} IS NULL)`),
]);
// Relations
exports.activitiesRelations = (0, drizzle_orm_1.relations)(exports.activities, ({ one, many }) => ({
    activityStatus: one(lookups_1.activityStatuses, {
        fields: [exports.activities.activityStatusId],
        references: [lookups_1.activityStatuses.id],
    }),
    dateStatus: one(lookups_1.dateStatuses, {
        fields: [exports.activities.dateStatusId],
        references: [lookups_1.dateStatuses.id],
    }),
    timeStatus: one(lookups_1.timeStatuses, {
        fields: [exports.activities.timeStatusId],
        references: [lookups_1.timeStatuses.id],
    }),
    leadOrg: one(organizations_1.organizations, {
        fields: [exports.activities.leadOrgId],
        references: [organizations_1.organizations.id],
    }),
    newsReleaseOrigin: one(lookups_1.newsReleaseOrigins, {
        fields: [exports.activities.newsReleaseOriginId],
        references: [lookups_1.newsReleaseOrigins.id],
        relationName: 'newsReleaseOrigin',
    }),
    eventLead: one(lookups_1.eventPlanners, {
        fields: [exports.activities.eventPlannerLeadId],
        references: [lookups_1.eventPlanners.id],
        relationName: 'eventLead',
    }),
    createdByUser: one(user_1.users, {
        fields: [exports.activities.createdBy],
        references: [user_1.users.id],
        relationName: 'createdBy',
    }),
    leadMinistry: one(ministry_1.ministries, {
        fields: [exports.activities.leadMinistryId],
        references: [ministry_1.ministries.id],
        relationName: 'leadMinistry',
    }),
    newsReleaseDistribution: one(lookups_1.newsReleaseDistributions, {
        fields: [exports.activities.newsReleaseDistributionId],
        references: [lookups_1.newsReleaseDistributions.id],
        relationName: 'newsReleaseDistribution',
    }),
    premierRequestedLookup: one(lookups_1.premierRequested, {
        fields: [exports.activities.premierRequestedId],
        references: [lookups_1.premierRequested.id],
        relationName: 'premierRequestedLookup',
    }),
    // Junction tables
    activityCategories: many(relations_1.activityCategories),
    activityCommsMaterials: many(relations_1.activityCommsMaterials),
    activityTranslationsRequired: many(relations_1.activityTranslationsRequired),
    activityRepresentatives: many(relations_1.activityRepresentatives),
    activitySharedWithTeams: many(relations_1.activitySharedWithTeams),
    activityCommsContacts: many(relations_1.activityCommsContacts),
    activityThemes: many(relations_1.activityThemes),
    activityTags: many(relations_1.activityTags),
    activitySubscriptions: many(relations_1.activitySubscriptions),
    activitySectors: many(relations_1.activitySectors),
    favoriteActivities: many(relations_1.favoriteActivities),
    reportSettings: many(relations_1.activityReportSettings),
    venueAddress: one(venue_address_1.venueAddresses, {
        fields: [exports.activities.id],
        references: [venue_address_1.venueAddresses.activityId],
    }),
}));
