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
    isActive: true,
    significance: true,
    pitchComments: true,
    isAllDay: true,
    schedulingConsiderations: true,
    newsReleaseId: true,
    eventLeadName: true,
    notForLookAhead: true,
    notForThirtySixtyNinety: true,
    // Keep these for transformation
    activityStatusId: true,
    pitchStatusId: true,
    dateStatusId: true,
    timeStatusId: true,
    venueStatusId: true,
    startDate: true,
    startTime: true,
    endDate: true,
    endTime: true,
    createdDateTime: true,
    lastUpdatedDateTime: true,
    createdBy: true,
    lastUpdatedBy: true,
    venue: true,
    venueAddress: true,
    lookAheadStatus: true,
    lookAheadSection: true,
    calendarVisibility: true,
    leadOrgId: true,
    leadOrgName: true,
    eventLeadOrgId: true,
    eventLeadOrgName: true,
    eventLeadId: true,
    graphicsUserId: true,
    ownerId: true,
    additionalOwnerId: true,
    ministryOwnerId: true,
  })
  .extend({
    // Fields from picked schema that need explicit type definitions
    // due to drizzle-zod type inference limitations
    id: z.number().int(),
    displayId: z.string(),
    isActive: z.boolean(),
    title: z.string(),
    summary: z.string(),
    isIssue: z.boolean(),
    significance: z.string(),
    pitchComments: z.string().nullable(),
    isAllDay: z.boolean(),
    schedulingConsiderations: z.string(),
    newsReleaseId: z.string().uuid().nullable(),
    eventLeadName: z.string().nullable(),
    notForLookAhead: z.boolean(),
    notForThirtySixtyNinety: z.boolean(),
    // Transform status IDs from number to string
    activityStatusId: z.string(),
    pitchStatusId: z.string(),
    dateStatusId: z.string(),
    timeStatusId: z.string(),
    venueStatusId: z.string().nullable(),
    // Transform date fields to ISO date strings (YYYY-MM-DD)
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    // Transform time fields to HH:mm strings
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    // Transform timestamp fields to ISO datetime strings
    createdDateTime: z.string().datetime(),
    lastUpdatedDateTime: z.string().datetime(),
    // Transform user ID fields to strings
    createdBy: z.string(),
    lastUpdatedBy: z.string(),
    venue: z.string().nullable(),
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
    calendarVisibility: z.enum(CALENDAR_VISIBILITY),
    // Organization fields
    leadOrgId: z.string().uuid().nullable(),
    leadOrgName: z.string().nullable(),
    eventLeadOrgId: z.string().uuid().nullable(),
    eventLeadOrgName: z.string().nullable(),
    // User ID fields (transformed to strings)
    eventLeadId: z.string().nullable(),
    graphicsUserId: z.string().nullable(),
    ownerId: z.string(),
    additionalOwnerId: z.string().nullable(),
    ministryOwnerId: z.string().uuid().nullable(),
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
    // Add renamed organization fields for backward compatibility
    leadOrg: z.string().uuid().nullable(),
    eventLeadOrg: z.string().uuid().nullable(),
    // Add transformed user fields (computed from IDs)
    eventLead: z.string().nullable(),
    graphics: z.string().nullable(),
    owner: z.string(),
    // Add computed status fields (from lookups)
    pitchStatus: z.string(),
    dateStatus: z.string(),
    timeStatus: z.string(),
    venueStatus: z.string().nullable(),
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
