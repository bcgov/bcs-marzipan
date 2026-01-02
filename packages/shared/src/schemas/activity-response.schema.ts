import { z } from 'zod';
import {
  ATTENDING_STATUS,
  LOOK_AHEAD_STATUS,
  LOOK_AHEAD_SECTION,
  CALENDAR_VISIBILITY,
} from '../constants/activity-enums';

/**
 * Activity API Response Schema
 *
 * This schema uses 2 layers defined in Zod:
 * - Layer 1: activityDbFieldsSchema - Fields from database with API transformations
 * - Layer 2: activityComputedFieldsSchema - Fields computed from joins/lookups
 * - Final: activityResponseSchema - Merged schema for API responses
 *

/**
 * Venue Address Schema
 * Typed object for venue address JSONB field
 */
const venueAddressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    provinceOrState: z.string(),
    country: z.string(),
  })
  .nullable();

/**
 * Layer 1: Database Fields Schema
 *
 * These fields come directly from the database activities table.
 * Types are transformed for API consumption:
 * - Date/time fields -> ISO strings
 * - Foreign key IDs -> strings (for consistent JSON serialization)
 * - rowVersion is omitted (internal field)
 *
 * Fields here must exist in the database Activity type.
 * See validate-types.ts for compile-time verification.
 */
export const activityDbFieldsSchema = z.object({
  // Primary key
  id: z.number().int(),
  displayId: z.string().nullable(), // May be null during creation, then set after activity ID is generated

  // Status flags
  isActive: z.boolean(),
  isIssue: z.boolean(),

  // Overview
  title: z.string(),
  summary: z.string(),
  significance: z.string(),

  // Lead organization (mutually exclusive: either ID or Name)
  leadOrgId: z.string().uuid().nullable(),
  leadOrgName: z.string().nullable(),

  // Pitch
  pitchStatusId: z.string(),
  pitchComments: z.string().nullable(),

  // Scheduling
  isAllDay: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  dateStatusId: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  timeStatusId: z.string(),
  schedulingConsiderations: z.string(),

  // News Release
  newsReleaseOriginId: z.string().uuid().nullable(),
  newsReleaseOriginName: z.string().nullable(),
  newsReleaseId: z.string().uuid().nullable(),

  // Venue/Event
  venue: z.string().nullable(),
  venueAddress: venueAddressSchema,
  venueStatusId: z.string().nullable(),

  // Event organization (mutually exclusive: either ID or Name)
  eventLeadOrgId: z.string().uuid().nullable(),
  eventLeadOrgName: z.string().nullable(),

  // Event lead/planner (mutually exclusive: either ID or Name)
  eventPlannerId: z.string().nullable(),
  eventPlannerName: z.string().nullable(),

  // Graphics user
  graphicsUserId: z.string().nullable(),

  // Look Ahead
  notForLookAhead: z.boolean(),
  notForThirtySixtyNinety: z.boolean(),
  executiveSummary: z.string().nullable(),
  lookAheadStatus: z.enum(LOOK_AHEAD_STATUS).nullable(),
  lookAheadSection: z.enum(LOOK_AHEAD_SECTION).nullable(),
  calendarVisibility: z.enum(CALENDAR_VISIBILITY),

  // Ownership
  ownerId: z.string(),
  ministryOwnerId: z.string().uuid().nullable(),
  activityStatusId: z.string(),

  // Audit fields (transformed to ISO strings for API)
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
  createdDateTime: z.string().datetime(),
  lastUpdatedDateTime: z.string().datetime(),
});

/**
 * Tag Schema for computed fields
 */
const tagSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
});

/**
 * Representative Attending Schema
 */
const representativeAttendingSchema = z.object({
  representative: z.string(),
  attendingStatus: z.enum(ATTENDING_STATUS),
});

/**
 * Layer 2: Computed Fields Schema
 *
 * These fields are computed from joins and lookups - they don't exist
 * directly in the database activities table.
 * They are populated by the service layer during response mapping.
 *
 */
export const activityComputedFieldsSchema = z.object({
  // Junction table data (from many-to-many relationships)
  category: z.array(z.string()),
  tags: z.array(tagSchema).optional(),
  jointOrg: z.array(z.string().uuid()).optional(),
  relatedActivities: z.array(z.string()).optional(),
  commsMaterials: z.array(z.string()).optional(),
  translationsRequired: z.array(z.string()).optional(),
  jointEventOrg: z.array(z.string().uuid()).optional(),
  representativesAttending: z.array(representativeAttendingSchema).optional(),
  sharedWith: z.array(z.string().uuid()).optional(),
  canEdit: z.array(z.string()).optional(),
  canView: z.array(z.string()).optional(),
  additionalOwners: z.array(z.string()).optional(),

  // Backward compatibility aliases (same value as *Id fields)
  leadOrg: z.string().uuid().nullable(),
  eventLeadOrg: z.string().uuid().nullable(),

  // Computed user names (from user ID lookups)
  eventLead: z.string().nullable(),
  graphicsUser: z.string().nullable(),
  owner: z.string(),

  // Computed status names (from lookup table joins)
  pitchStatus: z.string(),
  dateStatus: z.string(),
  timeStatus: z.string(),
  venueStatus: z.string().nullable(),
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
