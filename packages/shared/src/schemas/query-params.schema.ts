import { z } from 'zod';

import { LOOK_AHEAD_SECTION } from '../constants/constants';

/**
 * Query Parameter Schemas
 *
 * These schemas handle HTTP query parameters which are always strings.
 * They use z.transform().pipe() to convert string inputs to their proper types.
 *
 * NOTE: Isolated in a separate file to prevent Zod v4 type inference issues
 * from affecting other schema type inferences (like z.infer on response schemas).
 */

// ============================================
// Lookup Query Params
// ============================================

/**
 * Query params for lookup endpoints
 */
export const lookupQueryParamsSchema = z.object({
  userId: z.string().transform(Number).pipe(z.number().int()).optional(),
  role: z.string().optional(),
  organizationId: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .optional(),
  userIds: z
    .union([
      z.array(z.string().transform(Number).pipe(z.number().int())),
      z.string().transform((val) =>
        val
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      ),
    ])
    .optional(),
});

export type LookupQueryParams = z.infer<typeof lookupQueryParamsSchema>;

// ============================================
// Activity Filter Query Params
// ============================================

/**
 * Schema for filtering activities (query parameters)
 * Uses z.transform().pipe() for proper type conversion from HTTP strings
 */
export const filterActivitiesQuerySchema = z.object({
  title: z.string().optional(),
  startDateFrom: z.string().date().optional(),
  startDateTo: z.string().date().optional(),
  endDateFrom: z.string().date().optional(),
  endDateTo: z.string().date().optional(),
  activityStatusId: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .optional(),
  leadMinistryId: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .optional(),
  lookAheadSection: z.enum(LOOK_AHEAD_SECTION).optional(),
  city: z.string().optional(),
  isIssue: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  page: z
    .string()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(100)),
});

export type FilterActivitiesQueryParams = z.infer<
  typeof filterActivitiesQuerySchema
>;
