"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityResponseSchema = exports.activityComputedFieldsSchema = exports.activityDbFieldsSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants/constants");
const activity_schema_1 = require("./activity.schema");
/**
 * Activity API Response Schema
 *
 * This schema uses 2 layers defined in Zod:
 * - Layer 1: activityDbFieldsSchema - Fields from database with API transformations
 * - Layer 2: activityComputedFieldsSchema - Fields computed from joins/lookups
 * - Final: activityResponseSchema - Merged schema for API responses
 */
/**
 * Venue Address Schema for responses
 * Uses base schema from activity.schema.ts with nullable modifier
 */
const venueAddressSchema = activity_schema_1.venueAddressSchema.nullable();
/**
 * Layer 1: Database Fields Schema
 *
 * These fields come directly from the database activities table.
 * Types are transformed for API consumption:
 * - Date/time fields -> ISO strings
 * - rowVersion is omitted (internal field)
 *
 * ID Type Strategy:
 * - Serial IDs (auto-increment): Use z.number().int() - matches database type
 * - UUID IDs: Use z.string().uuid() - matches database type
 *
 * This provides true end-to-end type safety with no conversion required.
 * Serial IDs remain numbers throughout the stack (database -> API -> frontend -> API -> database).
 *
 * Fields here must exist in the database Activity type.
 * See validate-types.ts for compile-time verification.
 */
exports.activityDbFieldsSchema = zod_1.z.object({
    // Primary key
    id: zod_1.z.number().int(),
    displayId: zod_1.z.string().nullable(), // May be null during creation, then set after activity ID is generated
    // Status flags
    isIssue: zod_1.z.boolean(),
    isConfidential: zod_1.z.boolean(),
    // Overview
    title: zod_1.z.string(),
    summary: zod_1.z.string(),
    significance: zod_1.z.string(),
    // Lead organization (mutually exclusive: either ID or Name)
    leadOrgId: zod_1.z.string().uuid().nullable(),
    leadOrgName: zod_1.z.string().nullable(),
    // Scheduling
    isAllDay: zod_1.z.boolean(),
    startDate: zod_1.z.string().nullable(),
    endDate: zod_1.z.string().nullable(),
    dateStatusId: zod_1.z.number().int(),
    startTime: zod_1.z.string().nullable(),
    endTime: zod_1.z.string().nullable(),
    timeStatusId: zod_1.z.number().int(),
    schedulingNotes: zod_1.z.string().nullable(),
    // News Release
    newsReleaseOriginId: zod_1.z.number().int().nullable(),
    newsReleaseId: zod_1.z.string().uuid().nullable(),
    newsReleaseDistributionId: zod_1.z.number().int().nullable(),
    // Event lead/planner (mutually exclusive: either ID or Name)
    eventPlannerLeadId: zod_1.z.number().int().nullable(),
    eventPlannerLeadName: zod_1.z.string().nullable(),
    // Look Ahead
    executiveSummary: zod_1.z.string().nullable(),
    lookAheadStatus: zod_1.z.enum(constants_1.LOOK_AHEAD_STATUS).nullable(),
    lookAheadSection: zod_1.z.enum(constants_1.LOOK_AHEAD_SECTION).nullable(),
    // Notes and additional fields
    notes: zod_1.z.string().nullable(),
    pitchDate: zod_1.z.string().nullable(), // Date when activity was or will be pitched
    pitchRequired: zod_1.z.boolean().nullable(), // Whether pitch is required (can override category default)
    premierRequestedId: zod_1.z.number().int().nullable(),
    visibility: zod_1.z.enum(constants_1.VISIBILITY), // 'global' or 'team' - controls base access visibility
    // Ownership
    leadMinistryId: zod_1.z.string().uuid(),
    activityStatusId: zod_1.z.number().int(),
    // Audit fields (transformed to ISO strings for API)
    createdBy: zod_1.z.number().int(),
    lastUpdatedBy: zod_1.z.number().int(),
    createdDateTime: zod_1.z.string().datetime(),
    lastUpdatedDateTime: zod_1.z.string().datetime(),
});
/**
 * Tag Schema for computed fields
 */
const tagSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    text: zod_1.z.string(),
});
/**
 * Representative Attending Schema
 */
const representativeAttendingSchema = zod_1.z.object({
    representative: zod_1.z.string(),
});
/**
 * Report Setting Schema
 * Includes whether the activity is omitted from this report
 */
const reportSettingSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string(),
    omitted: zod_1.z.boolean(),
});
/**
 * Layer 2: Computed Fields Schema
 *
 * These fields are computed from joins and lookups - they don't exist
 * directly in the database activities table.
 * They are populated by the service layer during response mapping.
 *
 * IMPORTANT: Display names/values from lookups.
 * Forms submit IDs for database storage.
 * UI components should display these name fields.
 */
exports.activityComputedFieldsSchema = zod_1.z.object({
    // Junction table data (from many-to-many relationships)
    // These arrays contain names or display names from lookups.
    // Using .default([]) ensures clients always receive arrays instead of undefined.
    category: zod_1.z.array(zod_1.z.string()).default([]),
    tags: zod_1.z.array(tagSchema).default([]),
    commsMaterials: zod_1.z.array(zod_1.z.string()).default([]),
    translationsRequired: zod_1.z.array(zod_1.z.string()).default([]),
    representativesAttending: zod_1.z.array(representativeAttendingSchema).default([]),
    sharedWith: zod_1.z.array(zod_1.z.string()).default([]), // Team names the activity is shared with
    commsContacts: zod_1.z
        .array(zod_1.z.object({
        userId: zod_1.z.number().int(),
        name: zod_1.z.string(),
        isLead: zod_1.z.boolean(),
    }))
        .default([]), // All comms contacts with isLead flag
    // Computed organization names (from organization ID lookups or free text names)
    // Uses organization displayName/name if leadOrgId is set, otherwise uses leadOrgName
    leadOrg: zod_1.z.string().nullable(),
    // Computed user names (from user ID lookups)
    eventLead: zod_1.z.string().nullable(),
    // Computed status names (from lookup table joins)
    dateStatus: zod_1.z.string(),
    timeStatus: zod_1.z.string(),
    activityStatus: zod_1.z.string(),
    // Computed lookup names
    newsReleaseOrigin: zod_1.z.string().nullable(),
    newsReleaseDistribution: zod_1.z.string().nullable(),
    premierRequested: zod_1.z.string().nullable(),
    // Venue address (from venue_addresses table join)
    venueAddress: venueAddressSchema,
    // Report settings (from activityReportSettings junction table)
    // Includes omitted flag for each report
    reportSettings: zod_1.z.array(reportSettingSchema).default([]),
});
/**
 * Activity Response Schema
 *
 * The complete API response schema, merging database fields with computed fields.
 * This is the single source of truth for the ActivityResponse type.
 */
// merge is deprecated in favor of extend, but extend causes type inference issues.
exports.activityResponseSchema = exports.activityDbFieldsSchema.merge(exports.activityComputedFieldsSchema);
