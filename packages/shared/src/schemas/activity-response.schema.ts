import { z } from 'zod';
import {
  LOOK_AHEAD_STATUS,
  LOOK_AHEAD_SECTION,
  VISIBILITY,
} from '../constants/constants';
import { venueAddressSchema as baseVenueAddressSchema } from './activity.schema';

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
const venueAddressSchema = baseVenueAddressSchema.nullable();

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
export const activityDbFieldsSchema = z.object({
  // Primary key
  id: z.number().int(),
  displayId: z.string().nullable(), // May be null during creation, then set after activity ID is generated

  // Status flags
  isIssue: z.boolean(),
  isConfidential: z.boolean(),

  // Overview
  title: z.string(),
  summary: z.string(),
  significance: z.string(),

  // Lead organization (mutually exclusive: either ID or Name)
  leadOrgId: z.string().uuid().nullable(),
  leadOrgName: z.string().nullable(),

  // Scheduling
  isAllDay: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  dateStatusId: z.number().int(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  timeStatusId: z.number().int(),
  schedulingNotes: z.string().nullable(),

  // News Release
  newsReleaseOriginId: z.number().int().nullable(),
  newsReleaseId: z.string().uuid().nullable(),
  newsReleaseDistributionId: z.number().int().nullable(),

  // Event lead/planner (mutually exclusive: either ID or Name)
  eventPlannerLeadId: z.number().int().nullable(),
  eventPlannerLeadName: z.string().nullable(),

  // Look Ahead
  executiveSummary: z.string().nullable(),
  lookAheadStatus: z.enum(LOOK_AHEAD_STATUS).nullable(),
  lookAheadSection: z.enum(LOOK_AHEAD_SECTION).nullable(),

  // Notes and additional fields
  notes: z.string().nullable(),
  pitchDate: z.string().nullable(), // Date when activity was or will be pitched
  pitchRequired: z.boolean().nullable(), // Whether pitch is required (can override category default)
  premierRequestedId: z.number().int().nullable(),
  visibility: z.enum(VISIBILITY), // 'global' or 'team' - controls base access visibility

  // Ownership
  leadMinistryId: z.string().uuid(),
  activityStatusId: z.number().int(),

  // Audit fields (transformed to ISO strings for API)
  createdBy: z.number().int(),
  lastUpdatedBy: z.number().int(),
  createdDateTime: z.string().datetime(),
  lastUpdatedDateTime: z.string().datetime(),
});

/**
 * Tag Schema for computed fields
 */
const tagSchema = z.object({
  id: z.number().int(),
  text: z.string(),
});

/**
 * Representative Attending Schema
 */
const representativeAttendingSchema = z.object({
  representative: z.string(),
});

/**
 * Report Setting Schema
 * Includes whether the activity is omitted from this report
 */
const reportSettingSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  omitted: z.boolean(),
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
export const activityComputedFieldsSchema = z.object({
  // Junction table data (from many-to-many relationships)
  // These arrays contain names or display names from lookups.
  // Using .default([]) ensures clients always receive arrays instead of undefined.
  category: z.array(z.string()).default([]),
  tags: z.array(tagSchema).default([]),
  commsMaterials: z.array(z.string()).default([]),
  translationsRequired: z.array(z.string()).default([]),
  representativesAttending: z.array(representativeAttendingSchema).default([]),
  sharedWith: z.array(z.string()).default([]), // Team names the activity is shared with
  commsContacts: z
    .array(
      z.object({
        userId: z.number().int(),
        name: z.string(),
        isLead: z.boolean(),
      })
    )
    .default([]), // All comms contacts with isLead flag

  // Computed organization names (from organization ID lookups or free text names)
  // Uses organization displayName/name if leadOrgId is set, otherwise uses leadOrgName
  leadOrg: z.string().nullable(),

  // Computed user names (from user ID lookups)
  eventLead: z.string().nullable(),

  // Computed status names (from lookup table joins)
  dateStatus: z.string(),
  timeStatus: z.string(),
  activityStatus: z.string(),

  // Computed lookup names
  newsReleaseOrigin: z.string().nullable(),
  newsReleaseDistribution: z.string().nullable(),
  premierRequested: z.string().nullable(),

  // Venue address (from venue_addresses table join)
  venueAddress: venueAddressSchema,

  // Report settings (from activityReportSettings junction table)
  // Includes omitted flag for each report
  reportSettings: z.array(reportSettingSchema).default([]),
});

/**
 * Activity Response Schema
 *
 * The complete API response schema, merging database fields with computed fields.
 * This is the single source of truth for the ActivityResponse type.
 */
// merge is deprecated in favor of extend, but extend causes type inference issues.
export const activityResponseSchema = activityDbFieldsSchema.merge(
  activityComputedFieldsSchema
);

/**
 * TypeScript types inferred from Zod schemas
 * These are the single source of truth for API response types
 */
export type ActivityResponse = z.infer<typeof activityResponseSchema>;
export type ActivityDbFields = z.infer<typeof activityDbFieldsSchema>;
export type ActivityComputedFields = z.infer<
  typeof activityComputedFieldsSchema
>;
