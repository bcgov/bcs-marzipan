import { z } from 'zod';

import { isCalendarDateString } from '../datetime';
import {
  commaSeparatedIntArray,
  commaSeparatedStringArray,
} from './query-param-helpers';

/**
 * Shared History Change Schema
 *
 * Reusable schema for field-level change tracking used across
 * activity history, user history, and team history.
 */
export const historyChangeSchema = z.object({
  field: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
});

export type HistoryChange = z.infer<typeof historyChangeSchema>;

export const historyActorSchema = z.object({
  id: z.number().int(),
  displayName: z.string(),
  username: z.string().nullable().optional(),
});

export type HistoryActor = z.infer<typeof historyActorSchema>;

// ============================================
// Activity History
// ============================================

/**
 * Activity History Entry Schema (API contract)
 *
 * Represents a single history entry for an activity as returned by the API.
 * Timestamps are ISO strings (JSON-serialized).
 */
export const activityHistoryEntrySchema = z.object({
  id: z.number().int(),
  activityId: z.number().int(),
  userId: z.number().int(),
  actionType: z.string(),
  changes: z.array(historyChangeSchema).nullable(),
  notes: z.string().nullable(),
  timestamp: z.string(),
  actor: historyActorSchema.optional(),
  userName: z.string().optional(),
});

export type ActivityHistoryEntry = z.infer<typeof activityHistoryEntrySchema>;

export const globalActivityHistoryActivitySchema = z.object({
  id: z.number().int(),
  displayId: z.string().nullable(),
  title: z.string(),
  leadTeamId: z.number().int(),
  categories: z.array(z.string()).default([]),
});

export type GlobalActivityHistoryActivity = z.infer<
  typeof globalActivityHistoryActivitySchema
>;

export const globalActivityHistoryEntrySchema =
  activityHistoryEntrySchema.extend({
    activity: globalActivityHistoryActivitySchema,
  });

export type GlobalActivityHistoryEntry = z.infer<
  typeof globalActivityHistoryEntrySchema
>;

/**
 * Paginated global activity history (GET /activities/global-history).
 */
export const globalActivityHistoryPageSchema = z.object({
  items: z.array(globalActivityHistoryEntrySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  hasNext: z.boolean(),
  totalItems: z.number().int().nonnegative(),
});

export type GlobalActivityHistoryPage = z.infer<
  typeof globalActivityHistoryPageSchema
>;

const calendarDateQuerySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
  .refine(isCalendarDateString, {
    message: 'Must be a valid calendar date in YYYY-MM-DD format',
  });

const optionalStrictPositiveIntQuerySchema = z
  .string()
  .optional()
  .transform((val, ctx): number | undefined => {
    if (val === undefined) {
      return undefined;
    }
    const trimmed = val.trim();
    if (!/^\d+$/.test(trimmed)) {
      ctx.addIssue({
        code: 'custom',
        message: 'userId must be a valid positive integer',
      });
      return z.NEVER;
    }
    const n = Number(trimmed);
    if (n <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'userId must be a valid positive integer',
      });
      return z.NEVER;
    }
    return n;
  });

/**
 * Query params for GET /activities/global-history (HTTP strings → typed filters).
 */
export const globalActivityHistoryQuerySchema = z.object({
  startDate: calendarDateQuerySchema
    .optional()
    .describe(
      'Inclusive start date (YYYY-MM-DD). Defaults to today (Pacific) in the service when no bounds are set.'
    ),
  endDate: calendarDateQuerySchema
    .optional()
    .describe(
      'Inclusive end date (YYYY-MM-DD). Defaults to today (Pacific) in the service when no bounds are set.'
    ),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe('Page number (default: 1)'),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Page size (default: 50, max: 100)'),
  query: z
    .string()
    .optional()
    .describe('Free-text search across history notes and change values'),
  order: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('Sort order by timestamp (default: desc in service)'),
  userId: optionalStrictPositiveIntQuerySchema.describe(
    'Filter to history rows created by this user ID'
  ),
  userIds: commaSeparatedIntArray().describe(
    'Comma-separated user IDs (history authors)'
  ),
  actionTypes: commaSeparatedStringArray().describe(
    'Comma-separated history action types'
  ),
  categories: commaSeparatedStringArray().describe(
    'Comma-separated activity category names'
  ),
  leadTeamIds: commaSeparatedIntArray().describe(
    'Comma-separated lead team IDs'
  ),
});

export type GlobalActivityHistoryQuery = z.infer<
  typeof globalActivityHistoryQuerySchema
>;

// ============================================
// User History
// ============================================

/**
 * User History Entry Schema (API contract)
 *
 * Represents a single history entry for a user as returned by the API.
 * Timestamps are ISO strings (JSON-serialized).
 */
export const userHistoryEntrySchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  changedByUserId: z.number().int(),
  actionType: z.string(),
  changes: z.array(historyChangeSchema).nullable(),
  notes: z.string().nullable(),
  timestamp: z.string(),
  changedByUserName: z.string().optional(),
});

export type UserHistoryEntry = z.infer<typeof userHistoryEntrySchema>;

// ============================================
// Team History
// ============================================

/**
 * Team History Entry Schema (API contract)
 *
 * Represents a single history entry for a team as returned by the API.
 * Timestamps are ISO strings (JSON-serialized).
 */
export const teamHistoryEntrySchema = z.object({
  id: z.number().int(),
  teamId: z.number().int(),
  changedByUserId: z.number().int(),
  actionType: z.string(),
  changes: z.array(historyChangeSchema).nullable(),
  notes: z.string().nullable(),
  timestamp: z.string(),
  changedByUserName: z.string().optional(),
});

export type TeamHistoryEntry = z.infer<typeof teamHistoryEntrySchema>;
