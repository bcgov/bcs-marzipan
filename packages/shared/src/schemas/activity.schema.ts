import { z } from 'zod';
import { CALENDAR_VISIBILITY } from '../constants/activity-enums';

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
 * Venue Address Schema
 */
const venueAddressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    provinceOrState: z.string(),
    country: z.string(),
  })
  .nullable()
  .optional();

/**
 * Preprocess helper for venueAddress that handles legacy string formats
 */
const normalizeVenueAddress = (val: unknown) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return null; // Legacy format - can't parse
  if (typeof val === 'object') return val;
  return null;
};

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
  summary: z.string().default(''),
  significance: z.string().default(''),
  schedulingConsiderations: z.string().default(''),

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

  // Optional scheduling fields
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),

  // Optional text fields
  pitchComments: z.string().nullable().optional(),
  executiveSummary: z.string().nullable().optional(),
  venue: z.string().max(100).nullable().optional(),

  // Optional enum fields
  lookAheadStatus: z.string().nullable().optional(),
  lookAheadSection: z.string().nullable().optional(),

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

  // Venue address with preprocessing for legacy formats
  venueAddress: z.preprocess(normalizeVenueAddress, venueAddressSchema),
});

// ============================================================================
// Request Schemas
// ============================================================================

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
  representativeIds: z.array(z.number().int()).optional(),
  sharedWithOrgIds: z.array(z.string().uuid()).optional(),
  canEditUserIds: z.array(z.number().int()).optional(),
  canViewUserIds: z.array(z.number().int()).optional(),
  additionalOwnerIds: z.array(z.number().int()).optional(),
});

/**
 * Schema for creating a new activity via HTTP request
 *
 * Includes core activity fields plus junction table ID arrays.
 * Excludes auto-generated fields (id, displayId, audit fields, rowVersion).
 */
// merge is deprecated in favor of extend, but extend causes type inference issues.
export const createActivityRequestSchema = activityCoreFieldsSchema.merge(
  junctionTableIdsSchema
);

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
