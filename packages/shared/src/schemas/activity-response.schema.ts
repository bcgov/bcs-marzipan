import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { activities } from '@corpcal/database/schema';
import {
  ATTENDING_STATUS,
  LOOK_AHEAD_STATUS,
  LOOK_AHEAD_SECTION,
  CALENDAR_VISIBILITY,
} from '../constants/activity-enums';

/**
 * Activity API Response Schema
 *
 * This schema is automatically generated from the Drizzle activities table schema
 * using createSelectSchema, then transformed to match the API contract.
 *
 * Transformations applied:
 * - Omit internal fields (rowVersion, rowGuid, deprecated fields)
 * - Transform date/time fields to ISO strings
 * - Transform foreign key IDs to strings where needed
 * - Rename fields to match API contract (e.g., leadOrgId → leadOrg)
 * - Add computed/joined fields (category, tags, jointOrg, etc.)
 *
 * This ensures the API response schema stays in sync with database schema changes.
 * The schema is the single source of truth for the ActivityResponse type.
 */

// Base schema generated from Drizzle table
const baseActivitySchema = createSelectSchema(activities);

// Pick only the fields we want to keep from the base schema, then transform and extend
export const activityResponseSchema = baseActivitySchema
  .pick({
    id: true,
    displayId: true,
    title: true,
    summary: true,
    isIssue: true,
    oicRelated: true,
    isActive: true,
    significance: true,
    pitchComments: true,
    isAllDay: true,
    schedulingConsiderations: true,
    newsReleaseId: true,
    eventLeadName: true,
    notForLookAhead: true,
    planningReport: true,
    thirtySixtyNinetyReport: true,
    // Keep these for transformation
    activityStatusId: true,
    startDate: true,
    startTime: true,
    endDate: true,
    endTime: true,
    isTimeConfirmed: true,
    isDateConfirmed: true,
    createdDateTime: true,
    lastUpdatedDateTime: true,
    createdBy: true,
    lastUpdatedBy: true,
    venueAddress: true,
    lookAheadStatus: true,
    lookAheadSection: true,
    calendarVisibility: true,
    // Note: isConfidential is not picked - we add confidential in extend() instead
    // TODO: Review naming and duplication of fields
  })
  .extend({
    // Fields from picked schema that need explicit type definitions
    // due to drizzle-zod type inference limitations
    id: z.number().int(),
    displayId: z.string().nullable(),
    title: z.string(),
    summary: z.string().nullable(),
    isIssue: z.boolean(),
    oicRelated: z.boolean(),
    isActive: z.boolean(),
    significance: z.string().nullable(),
    pitchComments: z.string().nullable(),
    isAllDay: z.boolean(),
    schedulingConsiderations: z.string().nullable(),
    newsReleaseId: z.string().uuid().nullable(),
    eventLeadName: z.string().nullable(),
    notForLookAhead: z.boolean(),
    planningReport: z.boolean(),
    thirtySixtyNinetyReport: z.boolean(),
    // Transform activityStatusId from number to string
    activityStatusId: z.string(),
    // Transform date fields to ISO date strings (YYYY-MM-DD)
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    // Transform time fields to HH:mm strings
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    isTimeConfirmed: z.boolean(),
    isDateConfirmed: z.boolean(),
    // Transform timestamp fields to ISO datetime strings
    createdDateTime: z.string().datetime(),
    lastUpdatedDateTime: z.string().datetime(),
    // Transform user ID fields to strings
    createdBy: z.string(),
    lastUpdatedBy: z.string(),
    // Transform venueAddress JSONB to typed object
    venueAddress: z
      .object({
        street: z.string(),
        city: z.string(),
        provinceOrState: z.string(),
        country: z.string(),
      })
      .nullable(),
    // Transform enum-like varchar fields to proper enums using constants
    lookAheadStatus: z.enum(LOOK_AHEAD_STATUS).nullable(),
    lookAheadSection: z.enum(LOOK_AHEAD_SECTION).nullable(),
    calendarVisibility: z.enum(CALENDAR_VISIBILITY).nullable(),
    // Rename isConfidential to confidential
    confidential: z.boolean(),
    // Add computed/joined fields
    category: z.array(z.string()),
    tags: z
      .array(
        z.object({
          id: z.string().uuid(),
          text: z.string(),
        })
      )
      .optional(),
    jointOrg: z.array(z.string().uuid()).optional(),
    relatedActivities: z.array(z.string()).optional(),
    commsMaterials: z.array(z.string()).optional(),
    translationsRequired: z.array(z.string()).optional(),
    jointEventOrg: z.array(z.string().uuid()).optional(),
    representativesAttending: z
      .array(
        z.object({
          representative: z.string(),
          attendingStatus: z.enum(ATTENDING_STATUS),
        })
      )
      .optional(),
    sharedWith: z.array(z.string().uuid()).optional(),
    canEdit: z.array(z.string()).optional(),
    canView: z.array(z.string()).optional(),
    // Add renamed organization fields
    leadOrg: z.string().uuid().nullable(),
    eventLeadOrg: z.string().uuid().nullable(),
    // Add transformed user fields
    commsLead: z.string().nullable(),
    eventLead: z.string().nullable(),
    videographer: z.string().nullable(),
    graphics: z.string().nullable(),
    owner: z.string().nullable(),
    // Add computed status fields (from lookups)
    pitchStatus: z.string(),
    schedulingStatus: z.string(),
  });

/**
 * Paginated Response Schema
 * Generic schema for paginated API responses.
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  });

/**
 * TypeScript types inferred from Zod schemas
 * These are the single source of truth for API response types
 */
export type ActivityResponse = z.infer<typeof activityResponseSchema>;
export type PaginatedActivityResponse = z.infer<
  ReturnType<typeof paginatedResponseSchema<typeof activityResponseSchema>>
>;
