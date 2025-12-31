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
 * using createSelectSchema with column refinement, then transformed to match the API contract.
 *
 * Transformations applied:
 * - Omit internal fields (rowVersion, rowGuid, deprecated fields)
 * - Transform date/time fields to ISO strings
 * - Transform foreign key IDs to strings where needed
 * - Add computed/joined fields (category, tags, jointOrg, etc.)
 *
 * This ensures the API response schema stays in sync with database schema changes.
 * The schema is the single source of truth for the ActivityResponse type.
 *
 * Using column refinement (second argument to createSelectSchema) instead of
 * .pick().extend() pattern reduces duplication and leverages drizzle-zod more effectively.
 */
export const activityResponseSchema = createSelectSchema(activities, {
  // Transform status IDs from number to string for API
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
  ownerId: z.string(),
  eventLeadId: z.string().nullable(),
  graphicsUserId: z.string().nullable(),
  // Transform organization UUID fields to strings
  leadOrgId: z.string().uuid().nullable(),
  eventLeadOrgId: z.string().uuid().nullable(),
  ministryOwnerId: z.string().uuid().nullable(),
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
})
  .omit({
    // Omit internal fields that shouldn't be exposed in API
    rowVersion: true,
  })
  .extend({
    // Add computed/joined fields that don't exist in database schema
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
    additionalOwners: z.array(z.string()).optional(),
    // Add renamed organization fields for backward compatibility
    leadOrg: z.string().uuid().nullable(),
    eventLeadOrg: z.string().uuid().nullable(),
    // Add transformed user fields (computed from IDs)
    eventLead: z.string().nullable(),
    graphicsUser: z.string().nullable(),
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
