import { z } from 'zod';

import {
  LOOK_AHEAD_SECTION,
  LOOK_AHEAD_STATUS,
  VISIBILITY,
} from '../constants/constants';

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
export const venueAddressSchema = z.object({
  venueName: z.string().nullable(),
  street: z.string().nullable(),
  city: z.string().nullable(),
  provinceOrState: z.string().nullable(),
  country: z.string().nullable(),
});

/**
 * Venue Address Schema for requests (nullable and optional)
 */
export const venueAddressFieldsSchema = venueAddressSchema
  .nullable()
  .optional();

/**
 * Base venue address object shape (all fields string | null).
 * Use this for normalization and when the value is known to be present.
 */
export type VenueAddressBase = z.infer<typeof venueAddressSchema>;

/**
 * Venue Address type inferred from schema
 */
export type VenueAddress = z.infer<typeof venueAddressFieldsSchema>;

/**
 * Preprocess helper for UUID fields that may receive empty strings from forms
 */
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

// ============================================================================
// Database Field Schemas (for request validation)
// ============================================================================

/**
 * Core activity fields schema
 * These fields exist in the database activities table
 */
const activityCoreFieldsSchema = z.object({
  // Required fields
  title: z.string().min(1).max(255),
  summary: z.string().max(1000),
  significance: z.string().max(1000),
  schedulingNotes: z.string().max(500).optional().nullable(),
  strategy: z.string().nullable().optional(),

  // Status IDs (required, numbers for database)
  // Note: These are numbers in requests (matching database schema) but converted to strings
  // in responses for consistent JSON serialization. See activity-response.schema.ts for details.
  // activityStatusId is optional on create; backend sets it from markAsReviewed + role (new or reviewed).
  dateStatusId: z.number().int(),
  timeStatusId: z.number().int(),
  activityStatusId: z.number().int().optional(),

  // Boolean flags
  isIssue: z.boolean().default(false),
  isAllDay: z.boolean().default(false),
  isConfidential: z.boolean().default(false),

  // Visibility control
  visibility: z.enum(VISIBILITY).default('global'), // 'global' or 'team' - controls base access visibility

  // Optional scheduling fields (YYYY-MM-DD for dates, HH:mm for times)
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  startTime: z.string().time().nullable().optional(),
  endTime: z.string().time().nullable().optional(),
  pitchDate: z.string().date().nullable().optional(), // Date when activity was or will be pitched

  // Optional text fields
  notes: z.string().nullable().optional(), // Maps to legacy Comments
  executiveSummary: z.string().nullable().optional(),
  pitchRequiredStatusId: z.number().int().nullable().optional(), // pending, required, not_required
  translationsRequiredStatusId: z.number().int().nullable().optional(), // pending, required, not_required

  // Optional enum fields
  lookAheadStatus: z.enum(LOOK_AHEAD_STATUS).nullable().optional(),
  lookAheadSection: z.enum(LOOK_AHEAD_SECTION).nullable().optional(),

  // Optional foreign key fields (with empty string preprocessing)
  leadOrgId: z.preprocess(
    emptyStringToNull,
    z.number().int().nullable().optional()
  ),
  leadOrgName: z.string().max(255).nullable().optional(),
  newsReleaseId: z.preprocess(
    emptyStringToNull,
    z.string().uuid().nullable().optional()
  ),
  newsReleaseOriginId: z.number().int().nullable().optional(),
  leadTeamId: z.number().int(), // Required - primary association for which team leads this activity
  leadMinistryId: z.preprocess(
    emptyStringToNull,
    z.number().int().nullable().optional()
  ), // Optional; derived from lead team's ministry

  // Optional user ID fields
  eventPlannerLeadId: z.number().int().nullable().optional(),
  eventPlannerLeadName: z.string().max(255).nullable().optional(),

  // Optional lookup ID fields
  newsReleaseDistributionId: z.number().int().nullable().optional(),
  premierRequestedId: z.number().int().nullable().optional(),

  // UI convenience: single comms lead (converted to commsContacts with isLead on submit)
  commsContactLeadId: z.number().int().nullable().optional(),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Representative schema
 * Supports either representativeId (from lookup table) or representativeName (freeform text)
 */
const representativeSchema = z
  .object({
    representativeId: z.number().int().optional(),
    representativeName: z.string().max(255).optional(),
  })
  .refine(
    (data) =>
      data.representativeId !== undefined ||
      data.representativeName !== undefined,
    {
      message: 'Either representativeId or representativeName must be provided',
    }
  )
  .refine(
    (data) =>
      !(
        data.representativeId !== undefined &&
        data.representativeName !== undefined
      ),
    {
      message: 'Cannot provide both representativeId and representativeName',
    }
  );

/**
 * Report setting schema
 * Defines whether an activity is omitted from a specific report
 */
const reportSettingSchema = z.preprocess(
  (val) => {
    // Normalize incoming shape: accept `{ id: number }` (older clients)
    // and map it to `{ reportId: number }` so validation passes.
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      if (v.reportId === undefined && v.id !== undefined) {
        return { ...v, reportId: v.id };
      }
    }
    return val;
  },
  z.object({
    reportId: z.number().int(),
    omitted: z.boolean().default(false),
  })
);

/**
 * Comms contact schema
 * Supports identifying the lead contact via isLead flag
 */
const commsContactSchema = z.object({
  userId: z.number().int(),
  isLead: z.boolean().default(false),
});

/**
 * Junction table ID arrays for request payloads
 * These fields create many-to-many relationships
 */
const junctionTableIdsSchema = z.object({
  categoryIds: z.array(z.number().int()).optional(),
  tagIds: z.array(z.number().int()).optional(),
  commsMaterialIds: z.array(z.number().int()).optional(),
  translationLanguageIds: z.array(z.number().int()).optional(),
  representatives: z.array(representativeSchema).optional(),
  sharedWithTeamIds: z.array(z.number().int()).optional(), // Editor-type teams the activity is shared with
  commsContacts: z.array(commsContactSchema).optional(), // Comms contacts with isLead flag (exactly one must have isLead=true)
  reportSettings: z.array(reportSettingSchema).optional(), // Report settings for the activity
});

/**
 * Schema for creating a new activity via HTTP request
 *
 * Includes core activity fields plus junction table ID arrays and venue address.
 * Excludes auto-generated fields (id, displayId, audit fields, rowVersion).
 */
// merge is deprecated in favor of extend, but extend causes type inference issues.
export const createActivityRequestSchema = activityCoreFieldsSchema
  .merge(junctionTableIdsSchema)
  .extend({
    venueAddress: venueAddressFieldsSchema,
    activityHistoryNotes: z.string().max(1000).optional(),
    /** When true and user is admin/sysAdmin, backend sets initial status to reviewed; otherwise new. Ignored for non-admin. */
    markAsReviewed: z.boolean().optional(),
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
export const updateActivityRequestSchema =
  createActivityRequestSchema.partial();

/**
 * Schema for soft deleting an activity
 * Requires a reason to be provided for audit and admin review purposes
 */
export const softDeleteRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
    .trim(),
});

/**
 * Schema for requesting delete (comms contacts)
 * Same validation as soft delete: reason required for audit.
 */
export const requestDeleteRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
    .trim(),
});

/**
 * Schema for restoring an activity from delete_requested or deleted
 */
export const restoreRequestSchema = z.object({
  note: z.string().max(1000).optional(),
});

// ============================================================================
// TypeScript Types
// ============================================================================

/**
 * TypeScript types inferred from Zod schemas
 *
 * These are the single source of truth for API request types.
 * For API response types, use ActivityResponse from activity-response.schema.ts.
 * For database types, use Activity from @corpcal/database/types.
 */
export type CreateActivityRequest = z.infer<typeof createActivityRequestSchema>;
export type UpdateActivityRequest = z.infer<typeof updateActivityRequestSchema>;
export type SoftDeleteRequest = z.infer<typeof softDeleteRequestSchema>;
export type RequestDeleteRequest = z.infer<typeof requestDeleteRequestSchema>;
export type RestoreRequest = z.infer<typeof restoreRequestSchema>;

/**
 * Form data type for create/edit activity forms.
 * Single source of truth: same as CreateActivityRequest (schema-inferred).
 */
export type ActivityFormData = CreateActivityRequest;
