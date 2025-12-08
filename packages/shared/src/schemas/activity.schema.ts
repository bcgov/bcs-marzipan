import { z } from 'zod';
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { activities } from '@corpcal/database/schema';

/**
 * Activity Zod schemas automatically generated from Drizzle schema
 * These schemas ensure validation matches the database schema exactly
 *
 * Generated from: packages/database/src/schema/activity.ts
 */

/**
 * Schema for selecting activities from the database
 * Matches the shape of data returned from database queries
 */
export const activitySchema = createSelectSchema(activities);

/**
 * Schema for creating a new activity (insert)
 * Automatically excludes generated columns (id, audit fields, etc.)
 */
export const createActivitySchema = createInsertSchema(activities);

/**
 * Schema for updating an activity (partial update)
 * Automatically excludes generated columns and makes all fields optional
 */
export const updateActivitySchema = createUpdateSchema(activities);

/**
 * Schema for creating a new activity via HTTP request
 * Dates are accepted as ISO date strings (YYYY-MM-DD) and time strings (HH:mm)
 * This is the schema that should be used for API request validation
 *
 * Note: The base schema from drizzle-zod already handles date/time fields correctly
 * No need to override since we're using date() and time() types, not timestamp()
 */
export const createActivityRequestSchema = createActivitySchema.extend({
  // Transform empty strings to null for nullable UUID fields
  // This handles form inputs where empty fields send "" instead of null
  newsReleaseId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid().nullable().optional()
  ),
  leadOrgId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid().nullable().optional()
  ),
  eventLeadOrgId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid().nullable().optional()
  ),
  contactMinistryId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid().nullable().optional()
  ),
  // Transform venueAddress: handle both string (legacy) and object formats
  // If string is provided, convert to null (can't reliably parse free-form string)
  // If object is provided, validate it has the correct structure
  venueAddress: z.preprocess(
    (val) => {
      // If it's already null or undefined, return as-is
      if (val === null || val === undefined) return null;
      // If it's a string, return null (legacy format - can't parse reliably)
      if (typeof val === 'string') return null;
      // If it's an object, return it (will be validated by the schema)
      if (typeof val === 'object') return val;
      // For any other type, return null
      return null;
    },
    z
      .object({
        street: z.string(),
        city: z.string(),
        provinceOrState: z.string(),
        country: z.string(),
      })
      .nullable()
      .optional()
  ),
  // Junction table data - arrays of IDs to create relationships
  categoryIds: z.array(z.number().int()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  jointOrganizationIds: z.array(z.string().uuid()).optional(),
  relatedActivityIds: z.array(z.number().int()).optional(),
  commsMaterialIds: z.array(z.number().int()).optional(),
  translationLanguageIds: z.array(z.number().int()).optional(),
  jointEventOrganizationIds: z.array(z.string().uuid()).optional(),
  representativeIds: z.array(z.number().int()).optional(), // For activityRepresentatives
  sharedWithOrganizationIds: z.array(z.string().uuid()).optional(),
  canEditUserIds: z.array(z.number().int()).optional(),
  canViewUserIds: z.array(z.number().int()).optional(),
});

/**
 * Schema for updating an activity via HTTP request
 * Dates are accepted as ISO date strings (YYYY-MM-DD) and time strings (HH:mm)
 * ID is not included in the request body (it comes from the URL parameter)
 * This is the schema that should be used for API request validation
 *
 * Note: The base schema from drizzle-zod already handles date/time fields correctly
 * No need to override since we're using date() and time() types, not timestamp()
 */
export const updateActivityRequestSchema = updateActivitySchema;

/**
 * Schema for filtering activities (query parameters)
 * Uses z.coerce for query parameters which come as strings from HTTP
 */
export const filterActivitiesSchema = z.object({
  title: z.string().optional(),
  startDateFrom: z.iso.date().optional(),
  startDateTo: z.iso.date().optional(),
  endDateFrom: z.iso.date().optional(),
  endDateTo: z.iso.date().optional(),
  activityStatusId: z.coerce.number().int().optional(),
  contactMinistryId: z.uuid().optional(),
  cityId: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  isConfidential: z.coerce.boolean().optional(),
  isIssue: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(20),
});

/**
 * TypeScript types inferred from Zod schemas
 * These should match the types from @corpcal/database
 * Note: Using type assertions because drizzle-zod's BuildSchema type
 * is compatible with Zod but TypeScript needs help recognizing it
 */
export type Activity = z.infer<z.ZodTypeAny & typeof activitySchema>;
export type CreateActivity = z.infer<
  z.ZodTypeAny & typeof createActivitySchema
>;
export type UpdateActivity = z.infer<
  z.ZodTypeAny & typeof updateActivitySchema
>;
export type CreateActivityRequest = z.infer<
  z.ZodTypeAny & typeof createActivityRequestSchema
>;
export type UpdateActivityRequest = z.infer<
  z.ZodTypeAny & typeof updateActivityRequestSchema
>;
export type FilterActivities = z.infer<typeof filterActivitiesSchema>;
