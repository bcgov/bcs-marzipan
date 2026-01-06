import { z } from 'zod';
import {
  CALENDAR_VISIBILITY,
  LOOK_AHEAD_STATUS,
  LOOK_AHEAD_SECTION,
  ATTENDING_STATUS,
} from '../constants/activity-enums';

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
 * Venue Address Schema - nested object for venue address fields
 */
export const venueAddressFieldsSchema = z
  .object({
    venueName: z.string().nullable(),
    street: z.string().nullable(),
    city: z.string().nullable(),
    provinceOrState: z.string().nullable(),
    country: z.string().nullable(),
  })
  .nullable()
  .optional();

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
  schedulingConsiderations: z.string().max(500).optional().nullable(),

  // Status IDs (required, numbers for database)
  dateStatusId: z.number().int(),
  timeStatusId: z.number().int(),
  pitchStatusId: z.number().int(),
  activityStatusId: z.number().int(),
  ownerId: z.number().int(),
  calendarVisibility: z.enum(CALENDAR_VISIBILITY),

  // Boolean flags
  isActive: z.boolean().default(true),
  isIssue: z.boolean().default(false),
  isAllDay: z.boolean().default(false),
  notForLookAhead: z.boolean().default(false),
  notForThirtySixtyNinety: z.boolean().default(false),

  // Optional scheduling fields (YYYY-MM-DD for dates, HH:mm for times)
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  startTime: z.string().time().nullable().optional(),
  endTime: z.string().time().nullable().optional(),

  // Optional text fields
  pitchComments: z.string().nullable().optional(),
  executiveSummary: z.string().nullable().optional(),

  // Optional enum fields
  lookAheadStatus: z.enum(LOOK_AHEAD_STATUS).nullable().optional(),
  lookAheadSection: z.enum(LOOK_AHEAD_SECTION).nullable().optional(),

  // Optional foreign key fields (with empty string preprocessing)
  leadOrgId: z.preprocess(
    emptyStringToNull,
    z.string().uuid().nullable().optional()
  ),
  leadOrgName: z.string().max(255).nullable().optional(),
  eventLeadOrgId: z.preprocess(
    emptyStringToNull,
    z.string().uuid().nullable().optional()
  ),
  eventLeadOrgName: z.string().max(255).nullable().optional(),
  newsReleaseId: z.preprocess(
    emptyStringToNull,
    z.string().uuid().nullable().optional()
  ),
  newsReleaseOriginId: z.preprocess(
    emptyStringToNull,
    z.string().uuid().nullable().optional()
  ),
  newsReleaseOriginName: z.string().max(255).nullable().optional(),
  ministryOwnerId: z.preprocess(emptyStringToNull, z.string().uuid()), // Required for displayId generation

  // Optional user ID fields
  eventPlannerId: z.number().int().nullable().optional(),
  eventPlannerName: z.string().max(255).nullable().optional(),
  graphicsUserId: z.number().int().nullable().optional(),
  venueStatusId: z.number().int().nullable().optional(),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Representative with attending status schema
 * Supports either representativeId (from lookup table) or representativeName (freeform text)
 */
const representativeWithStatusSchema = z
  .object({
    representativeId: z.number().int().optional(),
    representativeName: z.string().max(255).optional(),
    attendingStatus: z.enum(ATTENDING_STATUS),
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
 * Junction table ID arrays for request payloads
 * These fields create many-to-many relationships
 */
const junctionTableIdsSchema = z.object({
  categoryIds: z.array(z.number().int()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  jointOrgIds: z.array(z.string().uuid()).optional(),
  relatedActivityIds: z.array(z.number().int()).optional(),
  commsMaterialIds: z.array(z.number().int()).optional(),
  translationLanguageIds: z.array(z.number().int()).optional(),
  jointEventOrgIds: z.array(z.string().uuid()).optional(),
  representatives: z.array(representativeWithStatusSchema).optional(),
  sharedWithMinistryIds: z.array(z.string().uuid()).optional(),
  additionalOwnerIds: z.array(z.number().int()).optional(),
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
 * Schema for filtering activities (query parameters)
 * Uses z.coerce for query parameters which come as strings from HTTP
 */
export const filterActivitiesSchema = z.object({
  title: z.string().optional(),
  startDateFrom: z.string().date().optional(),
  startDateTo: z.string().date().optional(),
  endDateFrom: z.string().date().optional(),
  endDateTo: z.string().date().optional(),
  activityStatusId: z.coerce.number().int().optional(),
  ministryOwnerId: z.string().uuid().optional(),
  city: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isIssue: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(20),
});

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
export type FilterActivities = z.infer<typeof filterActivitiesSchema>;
export type SoftDeleteRequest = z.infer<typeof softDeleteRequestSchema>;
