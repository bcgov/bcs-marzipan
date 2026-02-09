"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSharedWithSchema = exports.updateTagsSchema = exports.updateThemesSchema = exports.updateCategoriesSchema = void 0;
const zod_1 = require("zod");
/**
 * Activity Junction Table Update Schemas
 *
 * Centralized schemas for updating junction table relationships.
 * These schemas are used in the activities controller for endpoint validation.
 */
/**
 * Schema for updating activity categories
 */
exports.updateCategoriesSchema = zod_1.z.object({
    categoryIds: zod_1.z.array(zod_1.z.number().int()),
});
/**
 * Schema for updating activity themes
 */
exports.updateThemesSchema = zod_1.z.object({
    themeIds: zod_1.z.array(zod_1.z.string().uuid()),
});
/**
 * Schema for updating activity tags
 * Tags now use integer IDs (renamed from keywords table)
 */
exports.updateTagsSchema = zod_1.z.object({
    tagIds: zod_1.z.array(zod_1.z.number().int()),
});
/**
 * Schema for updating activity shared with teams
 */
exports.updateSharedWithSchema = zod_1.z.object({
    teamIds: zod_1.z.array(zod_1.z.number().int()),
});
