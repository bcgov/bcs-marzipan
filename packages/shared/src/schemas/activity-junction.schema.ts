import { z } from 'zod';

/**
 * Activity Junction Table Update Schemas
 *
 * Centralized schemas for updating junction table relationships.
 * These schemas are used in the activities controller for endpoint validation.
 */

/**
 * Schema for updating activity categories
 */
export const updateCategoriesSchema = z.object({
  categoryIds: z.array(z.number().int()),
});

/**
 * Schema for updating activity themes
 */
export const updateThemesSchema = z.object({
  themeIds: z.array(z.number().int()),
});

/**
 * Schema for updating activity tags
 * Tags now use integer IDs (renamed from keywords table)
 */
export const updateTagsSchema = z.object({
  tagIds: z.array(z.number().int()),
});

/**
 * Schema for updating activity shared with teams
 */
export const updateSharedWithSchema = z.object({
  teamIds: z.array(z.number().int()),
});

/**
 * TypeScript types inferred from schemas
 */
export type UpdateCategoriesRequest = z.infer<typeof updateCategoriesSchema>;
export type UpdateThemesRequest = z.infer<typeof updateThemesSchema>;
export type UpdateTagsRequest = z.infer<typeof updateTagsSchema>;
export type UpdateSharedWithRequest = z.infer<typeof updateSharedWithSchema>;
