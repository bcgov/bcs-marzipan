"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateActivityStatusRequestSchema = exports.createActivityStatusRequestSchema = exports.updateThemeRequestSchema = exports.createThemeRequestSchema = exports.updateGovernmentRepresentativeRequestSchema = exports.createGovernmentRepresentativeRequestSchema = exports.updateCommsMaterialRequestSchema = exports.createCommsMaterialRequestSchema = exports.updateMinistryRequestSchema = exports.createMinistryRequestSchema = exports.updateCityRequestSchema = exports.createCityRequestSchema = exports.updateTagRequestSchema = exports.createTagRequestSchema = exports.updateCategoryRequestSchema = exports.createCategoryRequestSchema = exports.themeLookupItemSchema = exports.themeResponseSchema = exports.reportResponseSchema = exports.governmentRepresentativeLookupItemSchema = exports.governmentRepresentativeResponseSchema = exports.translationLanguageLookupItemSchema = exports.translationLanguageResponseSchema = exports.commsMaterialsLookupItemSchema = exports.commsMaterialsResponseSchema = exports.cityLookupItemSchema = exports.cityResponseSchema = exports.venueStatusLookupItemSchema = exports.venueStatusResponseSchema = exports.timeStatusLookupItemSchema = exports.timeStatusResponseSchema = exports.dateStatusLookupItemSchema = exports.dateStatusResponseSchema = exports.activityStatusLookupItemSchema = exports.activityStatusResponseSchema = exports.pitchStatusLookupItemSchema = exports.pitchStatusResponseSchema = exports.userLookupItemSchema = exports.userResponseSchema = exports.ministryLookupItemSchema = exports.ministryResponseSchema = exports.organizationLookupItemSchema = exports.organizationResponseSchema = exports.tagLookupItemSchema = exports.tagResponseSchema = exports.categoryLookupItemSchema = exports.categoryResponseSchema = exports.extendedLookupItemSchema = exports.lookupItemSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants/constants");
const report_config_schema_1 = require("./report-config.schema");
/**
 * Lookup Response Schemas
 *
 * These schemas use pure Zod to define API response types for lookup tables.
 * Each lookup type has its own schema for full type safety while also
 * providing a common LookupItem interface for generic dropdown components.
 *
 * Fields are defined explicitly to match the database schema with API-appropriate
 * types. See validate-types.ts for compile-time verification that fields align
 * with database types.
 */
// ============================================
// Base Lookup Item Schema (Generic)
// ============================================
/**
 * Generic lookup item schema for dropdown components
 * All lookup endpoints return data in this format for UI consistency
 *
 * Note: For serial IDs (auto-increment), id and value are numbers.
 * For UUID IDs (organizations, ministries), these are strings.
 */
exports.lookupItemSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    label: zod_1.z.string(),
    value: zod_1.z.number().int(),
});
/**
 * Extended lookup item with optional additional fields
 * Used when lookups need extra metadata beyond the basic dropdown format
 */
exports.extendedLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string().optional(),
    displayName: zod_1.z.string().nullable().optional(),
});
// ============================================
// Category Schema
// ============================================
/**
 * Category Response Schema
 * Fields from the categories table exposed via API
 */
exports.categoryResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
    allowsPitch: zod_1.z.boolean(),
    visibility: zod_1.z.enum(constants_1.VISIBILITY),
});
exports.categoryLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    allowsPitch: zod_1.z.boolean(),
});
// ============================================
// Tag Schema
// ============================================
/**
 * Tag Response Schema
 * Fields from the tags table exposed via API
 * Tags renamed from keywords table. All tags are currently global (visibility='global').
 * Team visibility is a future feature flag.
 */
exports.tagResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    visibility: zod_1.z.enum(['global', 'team']),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.tagLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Organization Schema
// ============================================
/**
 * Organization Response Schema
 * Fields from the organizations table exposed via API
 */
exports.organizationResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    organizationType: zod_1.z.string().nullable(),
    ministryId: zod_1.z.string().uuid().nullable(),
    isActive: zod_1.z.boolean(),
    sortOrder: zod_1.z.number().int(),
    description: zod_1.z.string().nullable(),
});
exports.organizationLookupItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    label: zod_1.z.string(),
    value: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Ministry Schema
// ============================================
/**
 * Ministry Response Schema
 * Fields from the ministries table exposed via API
 */
exports.ministryResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    displayName: zod_1.z.string().nullable(),
    abbreviation: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    ministerName: zod_1.z.string().nullable(),
});
exports.ministryLookupItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    label: zod_1.z.string(),
    value: zod_1.z.string().uuid(),
    displayName: zod_1.z.string().nullable(),
    abbreviation: zod_1.z.string().nullable(),
});
// ============================================
// User Schema
// ============================================
/**
 * User Response Schema
 * Fields from the users table exposed via API
 */
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    adUsername: zod_1.z.string().nullable(),
    adDisplayName: zod_1.z.string().nullable(),
    adEmail: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    role: zod_1.z.string(),
});
exports.userLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    email: zod_1.z.string().nullable(),
    username: zod_1.z.string().nullable(),
});
// ============================================
// Pitch Status Schema
// ============================================
/**
 * Pitch Status Response Schema
 * Fields from the pitch_statuses table exposed via API
 */
exports.pitchStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.pitchStatusLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Activity Status Schema
// ============================================
/**
 * Activity Status Response Schema
 * Fields from the activity_statuses table exposed via API
 */
exports.activityStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.activityStatusLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Date Status Schema
// ============================================
/**
 * Date Status Response Schema
 * Fields from the date_statuses table exposed via API
 */
exports.dateStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.dateStatusLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Time Status Schema
// ============================================
/**
 * Time Status Response Schema
 * Fields from the time_statuses table exposed via API
 */
exports.timeStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.timeStatusLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Venue Status Schema
// ============================================
/**
 * Venue Status Response Schema
 * Fields from the venue_statuses table exposed via API
 */
exports.venueStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.venueStatusLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// City Schema
// ============================================
/**
 * City Response Schema
 * Fields from the cities table exposed via API
 */
exports.cityResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    province: zod_1.z.string().nullable(),
});
exports.cityLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    province: zod_1.z.string().nullable(),
});
// ============================================
// Comms Materials Schema
// ============================================
/**
 * Comms Materials Response Schema
 * Fields from the comms_materials table exposed via API
 */
exports.commsMaterialsResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.commsMaterialsLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Translation Languages Schema
// ============================================
/**
 * Translation Language Response Schema
 * Fields from the translated_languages table exposed via API
 */
exports.translationLanguageResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    description: zod_1.z.string().nullable(),
});
exports.translationLanguageLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Government Representatives Schema
// ============================================
/**
 * Government Representative Response Schema
 * Fields from the government_representatives table exposed via API
 */
exports.governmentRepresentativeResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    title: zod_1.z.string().nullable(),
    email: zod_1.z.string().nullable(),
    ministryId: zod_1.z.string().uuid().nullable(),
    representativeType: zod_1.z.enum(constants_1.REPRESENTATIVE_TYPE).nullable(),
});
exports.governmentRepresentativeLookupItemSchema = exports.lookupItemSchema.extend({
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    title: zod_1.z.string().nullable(),
    ministryId: zod_1.z.string().uuid().nullable(),
});
// ============================================
// Report Schema
// ============================================
/**
 * Report Response Schema
 * Fields from the reports table exposed via API
 */
exports.reportResponseSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
    visibility: zod_1.z.enum(constants_1.VISIBILITY),
    config: report_config_schema_1.reportConfigSchema.nullable(),
    description: zod_1.z.string().nullable(),
});
// ============================================
// Theme Schema
// ============================================
/**
 * Theme Response Schema
 * Fields from the themes table exposed via API
 */
exports.themeResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    key: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string().nullable(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean(),
});
exports.themeLookupItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    label: zod_1.z.string(),
    value: zod_1.z.string().uuid(),
    key: zod_1.z.string().nullable(),
    displayName: zod_1.z.string().nullable(),
});
// ============================================
// Request Schemas (for create/update operations)
// ============================================
/**
 * Create Category Request Schema
 * Fields required for creating a new category
 */
exports.createCategoryRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
    visibility: zod_1.z.enum(constants_1.VISIBILITY).default('global').optional(),
    allowsPitch: zod_1.z.boolean().default(true).optional(),
    description: zod_1.z.string().nullable().optional(),
});
/**
 * Update Category Request Schema
 * All fields optional for partial updates
 */
exports.updateCategoryRequestSchema = exports.createCategoryRequestSchema.partial();
/**
 * Create Tag Request Schema
 */
exports.createTagRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
    visibility: zod_1.z.enum(['global', 'team']).default('global').optional(),
    description: zod_1.z.string().nullable().optional(),
});
/**
 * Update Tag Request Schema
 */
exports.updateTagRequestSchema = exports.createTagRequestSchema.partial();
/**
 * Create City Request Schema
 */
exports.createCityRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    province: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
});
/**
 * Update City Request Schema
 */
exports.updateCityRequestSchema = exports.createCityRequestSchema.partial();
/**
 * Create Ministry Request Schema
 */
exports.createMinistryRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(255),
    abbreviation: zod_1.z.string().min(1).max(10),
    ministerName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
});
/**
 * Update Ministry Request Schema
 */
exports.updateMinistryRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(255).optional(),
    abbreviation: zod_1.z.string().min(1).max(10).optional(),
    ministerName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int().optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Create Comms Material Request Schema
 */
exports.createCommsMaterialRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
    description: zod_1.z.string().nullable().optional(),
});
/**
 * Update Comms Material Request Schema
 */
exports.updateCommsMaterialRequestSchema = exports.createCommsMaterialRequestSchema.partial();
/**
 * Create Government Representative Request Schema
 */
exports.createGovernmentRepresentativeRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    title: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
    ministryId: zod_1.z.string().uuid().nullable().optional(),
    representativeType: zod_1.z.enum(constants_1.REPRESENTATIVE_TYPE).nullable().optional(),
});
/**
 * Update Government Representative Request Schema
 */
exports.updateGovernmentRepresentativeRequestSchema = exports.createGovernmentRepresentativeRequestSchema.partial();
/**
 * Create Theme Request Schema
 */
exports.createThemeRequestSchema = zod_1.z.object({
    key: zod_1.z.string().max(100).nullable().optional(),
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
});
/**
 * Update Theme Request Schema
 */
exports.updateThemeRequestSchema = exports.createThemeRequestSchema.partial();
/**
 * Create Activity Status Request Schema
 */
exports.createActivityStatusRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    displayName: zod_1.z.string().max(255).nullable().optional(),
    sortOrder: zod_1.z.number().int(),
    isActive: zod_1.z.boolean().default(true).optional(),
    description: zod_1.z.string().nullable().optional(),
});
/**
 * Update Activity Status Request Schema
 */
exports.updateActivityStatusRequestSchema = exports.createActivityStatusRequestSchema.partial();
