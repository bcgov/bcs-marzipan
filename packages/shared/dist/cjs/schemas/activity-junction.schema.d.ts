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
export declare const updateCategoriesSchema: z.ZodObject<{
    categoryIds: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Schema for updating activity themes
 */
export declare const updateThemesSchema: z.ZodObject<{
    themeIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
/**
 * Schema for updating activity tags
 * Tags now use integer IDs (renamed from keywords table)
 */
export declare const updateTagsSchema: z.ZodObject<{
    tagIds: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Schema for updating activity shared with teams
 */
export declare const updateSharedWithSchema: z.ZodObject<{
    teamIds: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
/**
 * TypeScript types inferred from schemas
 */
export type UpdateCategoriesRequest = z.infer<typeof updateCategoriesSchema>;
export type UpdateThemesRequest = z.infer<typeof updateThemesSchema>;
export type UpdateTagsRequest = z.infer<typeof updateTagsSchema>;
export type UpdateSharedWithRequest = z.infer<typeof updateSharedWithSchema>;
//# sourceMappingURL=activity-junction.schema.d.ts.map