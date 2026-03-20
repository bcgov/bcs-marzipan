import { z } from 'zod';

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
