import { z } from 'zod';

/**
 * Saved Filter API Schemas
 *
 * Zod schemas for the activity saved filters CRUD API contract.
 * Timestamps are ISO strings for JSON serialization.
 */

// ============================================
// Context key validation
// ============================================

const CONTEXT_KEY_MAX_LENGTH = 100;

export const savedFilterContextKeySchema = z
  .string()
  .min(1)
  .max(CONTEXT_KEY_MAX_LENGTH);

export const savedFilterScopeTypeSchema = z.enum(['user', 'team', 'global']);
export type SavedFilterScopeType = z.infer<typeof savedFilterScopeTypeSchema>;

// ============================================
// Response Schemas
// ============================================

export const savedFilterResponseSchema = z.object({
  id: z.number().int(),
  ownerUserId: z.number().int(),
  contextKey: z.string(),
  name: z.string(),
  filterState: z.record(z.string(), z.unknown()),
  searchKeyword: z.string(),
  /** True when this row is the current user's default for this context (from user_activity_saved_filter_defaults). */
  isDefault: z.boolean(),
  sortOrder: z.number().int(),
  scopeType: savedFilterScopeTypeSchema,
  scopeTeamId: z.number().int().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SavedFilterResponse = z.infer<typeof savedFilterResponseSchema>;

export const savedFilterListResponseSchema = z.object({
  filters: z.array(savedFilterResponseSchema),
  count: z.number().int(),
  /** Per-user default for this context; persisted in user_activity_saved_filter_defaults. */
  defaultSavedFilterId: z.number().int().nullable(),
});

export type SavedFilterListResponse = z.infer<
  typeof savedFilterListResponseSchema
>;

// ============================================
// Request Body Schemas
// ============================================

const FILTER_NAME_MAX_LENGTH = 80;

export const createSavedFilterBodySchema = z.object({
  contextKey: savedFilterContextKeySchema,
  name: z.string().min(1).max(FILTER_NAME_MAX_LENGTH),
  filterState: z.record(z.string(), z.unknown()),
  searchKeyword: z.string().default(''),
  scopeType: savedFilterScopeTypeSchema.optional(),
  scopeTeamId: z.number().int().nullable().optional(),
});

export type CreateSavedFilterBody = z.infer<typeof createSavedFilterBodySchema>;

export const updateSavedFilterBodySchema = z.object({
  name: z.string().min(1).max(FILTER_NAME_MAX_LENGTH).optional(),
  filterState: z.record(z.string(), z.unknown()).optional(),
  searchKeyword: z.string().optional(),
  scopeType: savedFilterScopeTypeSchema.optional(),
  scopeTeamId: z.number().int().nullable().optional(),
});

export type UpdateSavedFilterBody = z.infer<typeof updateSavedFilterBodySchema>;

export const duplicateSavedFilterBodySchema = z.object({
  name: z.string().min(1).max(FILTER_NAME_MAX_LENGTH).optional(),
});

export type DuplicateSavedFilterBody = z.infer<
  typeof duplicateSavedFilterBodySchema
>;

export const setMyDefaultSavedFilterBodySchema = z.object({
  contextKey: savedFilterContextKeySchema,
  /** Set to null to clear the default for this context. */
  savedFilterId: z.number().int().nullable(),
});

export type SetMyDefaultSavedFilterBody = z.infer<
  typeof setMyDefaultSavedFilterBodySchema
>;
