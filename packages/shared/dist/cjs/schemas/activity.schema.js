"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteRequestSchema = exports.updateActivityRequestSchema = exports.createActivityRequestSchema = exports.venueAddressFieldsSchema = exports.venueAddressSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants/constants");
/**
 * Activity Zod Schemas
 *
 * These schemas are source of truth for and define API request/response contracts.
 * The database schema (Drizzle) is the source of truth for DB types.
 * Compile-time checks in schema-helpers.ts ensure alignment.
 */
// ============================================================================
// Shared Field Schemas
// ============================================================================
/**
 * Base Venue Address Schema - nested object for venue address fields
 * This is the single source of truth for venue address structure.
 * Use with appropriate modifiers (.nullable(), .optional()) as needed.
 */
exports.venueAddressSchema = zod_1.z.object({
    venueName: zod_1.z.string().nullable(),
    street: zod_1.z.string().nullable(),
    city: zod_1.z.string().nullable(),
    provinceOrState: zod_1.z.string().nullable(),
    country: zod_1.z.string().nullable(),
});
/**
 * Venue Address Schema for requests (nullable and optional)
 */
exports.venueAddressFieldsSchema = exports.venueAddressSchema
    .nullable()
    .optional();
/**
 * Preprocess helper for UUID fields that may receive empty strings from forms
 */
const emptyStringToNull = (val) => (val === '' ? null : val);
// ============================================================================
// Database Field Schemas (for request validation)
// ============================================================================
/**
 * Core activity fields schema
 * These fields exist in the database activities table
 */
const activityCoreFieldsSchema = zod_1.z.object({
    // Required fields
    title: zod_1.z.string().min(1).max(255),
    summary: zod_1.z.string().max(1000),
    significance: zod_1.z.string().max(1000),
    schedulingNotes: zod_1.z.string().max(500).optional().nullable(),
    // Status IDs (required, numbers for database)
    // Note: These are numbers in requests (matching database schema) but converted to strings
    // in responses for consistent JSON serialization. See activity-response.schema.ts for details.
    dateStatusId: zod_1.z.number().int(),
    timeStatusId: zod_1.z.number().int(),
    activityStatusId: zod_1.z.number().int(),
    // Boolean flags
    isIssue: zod_1.z.boolean().default(false),
    isAllDay: zod_1.z.boolean().default(false),
    isConfidential: zod_1.z.boolean().default(false),
    // Visibility control
    visibility: zod_1.z.enum(constants_1.VISIBILITY).default('global'), // 'global' or 'team' - controls base access visibility
    // Optional scheduling fields (YYYY-MM-DD for dates, HH:mm for times)
    startDate: zod_1.z.string().date().nullable().optional(),
    endDate: zod_1.z.string().date().nullable().optional(),
    startTime: zod_1.z.string().time().nullable().optional(),
    endTime: zod_1.z.string().time().nullable().optional(),
    pitchDate: zod_1.z.string().date().nullable().optional(), // Date when activity was or will be pitched
    // Optional text fields
    notes: zod_1.z.string().nullable().optional(), // Maps to legacy Comments
    executiveSummary: zod_1.z.string().nullable().optional(),
    pitchRequired: zod_1.z.boolean().nullable().optional(), // Whether pitch is required (can override category default)
    // Optional enum fields
    lookAheadStatus: zod_1.z.enum(constants_1.LOOK_AHEAD_STATUS).nullable().optional(),
    lookAheadSection: zod_1.z.enum(constants_1.LOOK_AHEAD_SECTION).nullable().optional(),
    // Optional foreign key fields (with empty string preprocessing)
    leadOrgId: zod_1.z.preprocess(emptyStringToNull, zod_1.z.string().uuid().nullable().optional()),
    leadOrgName: zod_1.z.string().max(255).nullable().optional(),
    newsReleaseId: zod_1.z.preprocess(emptyStringToNull, zod_1.z.string().uuid().nullable().optional()),
    newsReleaseOriginId: zod_1.z.number().int().nullable().optional(),
    leadMinistryId: zod_1.z.preprocess(emptyStringToNull, zod_1.z.string().uuid()), // Required for displayId generation
    // Optional user ID fields
    eventPlannerLeadId: zod_1.z.number().int().nullable().optional(),
    eventPlannerLeadName: zod_1.z.string().max(255).nullable().optional(),
    // Optional lookup ID fields
    newsReleaseDistributionId: zod_1.z.number().int().nullable().optional(),
    premierRequestedId: zod_1.z.number().int().nullable().optional(),
});
// ============================================================================
// Request Schemas
// ============================================================================
/**
 * Representative schema
 * Supports either representativeId (from lookup table) or representativeName (freeform text)
 */
const representativeSchema = zod_1.z
    .object({
    representativeId: zod_1.z.number().int().optional(),
    representativeName: zod_1.z.string().max(255).optional(),
})
    .refine((data) => data.representativeId !== undefined ||
    data.representativeName !== undefined, {
    message: 'Either representativeId or representativeName must be provided',
})
    .refine((data) => !(data.representativeId !== undefined &&
    data.representativeName !== undefined), {
    message: 'Cannot provide both representativeId and representativeName',
});
/**
 * Report setting schema
 * Defines whether an activity is omitted from a specific report
 */
const reportSettingSchema = zod_1.z.preprocess((val) => {
    // Normalize incoming shape: accept `{ id: number }` (older clients)
    // and map it to `{ reportId: number }` so validation passes.
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        const v = val;
        if (v.reportId === undefined && v.id !== undefined) {
            return { ...v, reportId: v.id };
        }
    }
    return val;
}, zod_1.z.object({
    reportId: zod_1.z.number().int(),
    omitted: zod_1.z.boolean().default(false),
}));
/**
 * Comms contact schema
 * Supports identifying the lead contact via isLead flag
 */
const commsContactSchema = zod_1.z.object({
    userId: zod_1.z.number().int(),
    isLead: zod_1.z.boolean().default(false),
});
/**
 * Junction table ID arrays for request payloads
 * These fields create many-to-many relationships
 */
const junctionTableIdsSchema = zod_1.z.object({
    categoryIds: zod_1.z.array(zod_1.z.number().int()).optional(),
    tagIds: zod_1.z.array(zod_1.z.number().int()).optional(),
    commsMaterialIds: zod_1.z.array(zod_1.z.number().int()).optional(),
    translationLanguageIds: zod_1.z.array(zod_1.z.number().int()).optional(),
    representatives: zod_1.z.array(representativeSchema).optional(),
    sharedWithTeamIds: zod_1.z.array(zod_1.z.number().int()).optional(), // Editor-type teams the activity is shared with
    commsContacts: zod_1.z.array(commsContactSchema).optional(), // Comms contacts with isLead flag (exactly one must have isLead=true)
    reportSettings: zod_1.z.array(reportSettingSchema).optional(), // Report settings for the activity
});
/**
 * Schema for creating a new activity via HTTP request
 *
 * Includes core activity fields plus junction table ID arrays and venue address.
 * Excludes auto-generated fields (id, displayId, audit fields, rowVersion).
 */
// merge is deprecated in favor of extend, but extend causes type inference issues.
exports.createActivityRequestSchema = activityCoreFieldsSchema
    .merge(junctionTableIdsSchema)
    .extend({
    venueAddress: exports.venueAddressFieldsSchema,
});
/**
 * Schema for updating an activity via HTTP request
 *
 * All fields are optional (partial update).
 * ID comes from URL parameter, not request body.
 *
 * Note: XOR validation (leadOrgId/leadOrgName, etc.) is handled by
 * database CHECK constraints, not duplicated here.
 */
exports.updateActivityRequestSchema = exports.createActivityRequestSchema.partial();
/**
 * Schema for soft deleting an activity
 * Requires a reason to be provided for audit and admin review purposes
 */
exports.softDeleteRequestSchema = zod_1.z.object({
    reason: zod_1.z
        .string()
        .min(10, 'Reason must be at least 10 characters')
        .max(1000, 'Reason must not exceed 1000 characters')
        .trim(),
});
