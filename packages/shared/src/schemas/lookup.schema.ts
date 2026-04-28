import { z } from 'zod';

import { REPRESENTATIVE_TYPE, VISIBILITY } from '../constants/constants';
import { venueAddressSchema } from './activity.schema';
import { reportConfigSchema } from './report-config.schema';

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
 * Note: Lookup id and value are numbers (serial IDs).
 */
export const lookupItemSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  value: z.number().int(),
});

/**
 * Extended lookup item with optional additional fields
 * Used when lookups need extra metadata beyond the basic dropdown format
 */
export const extendedLookupItemSchema = lookupItemSchema.extend({
  name: z.string().optional(),
  displayName: z.string().optional(),
});

// ============================================
// Category Schema
// ============================================

/**
 * Category Response Schema
 * Fields from the categories table exposed via API
 */
export const categoryResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
  visibility: z.enum(VISIBILITY),
});

export const categoryLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  visibility: z.enum(VISIBILITY),
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
export const tagResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  visibility: z.enum(['global', 'team']),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const tagLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
  visibility: z.enum(['global', 'team']),
  /** Team display names for team-scoped tags. Populated only on admin responses (includeAll=true). */
  teamNames: z.array(z.string()).optional(),
  /** Team IDs for team-scoped tags. Populated only on admin responses (includeAll=true). */
  teamIds: z.array(z.number().int()).optional(),
});

// ============================================
// Organization Schema
// ============================================

/**
 * Organization Response Schema
 * Fields from the organizations table exposed via API
 */
export const organizationResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  organizationType: z.string().nullable(),
  ministryId: z.number().int().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  description: z.string().nullable(),
});

export const organizationLookupItemSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  value: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  ministryId: z.number().int().nullable().optional(),
});

// ============================================
// Ministry Schema
// ============================================

/**
 * Ministry Response Schema
 * Fields from the ministries table exposed via API
 */
export const ministryResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  abbreviation: z.string().min(1).max(5),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  ministerGovernmentRepId: z.number().int().nullable(),
  ministryGroupId: z.number().int().nullable().optional(),
});

export const ministryLookupItemSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  value: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  abbreviation: z.string().max(5).nullable(),
  ministerGovernmentRepId: z.number().int().nullable().optional(),
  /** Joined from government_representatives when minister_government_rep_id is set */
  ministerDisplayName: z.string().nullable().optional(),
  ministryGroupId: z.number().int().nullable().optional(),
});

// ============================================
// User Schema
// ============================================

/**
 * User Response Schema
 * Fields from the users table exposed via API
 */
export const userResponseSchema = z.object({
  id: z.number().int(),
  adUsername: z.string().nullable(),
  adDisplayName: z.string().nullable(),
  adEmail: z.string().nullable(),
  isActive: z.boolean(),
  role: z.string(),
});

export const userLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  email: z.string().nullable(),
  username: z.string().nullable(),
  jobTitle: z.string().nullable().optional(),
});

// ============================================
// Pitch Status Schema
// ============================================

/**
 * Pitch Status Response Schema
 * Fields from the pitch_statuses table exposed via API
 */
export const pitchStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const pitchStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Activity Status Schema
// ============================================

/**
 * Activity Status Response Schema
 * Fields from the activity_statuses table exposed via API
 */
export const activityStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const activityStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Date Status Schema
// ============================================

/**
 * Date Status Response Schema
 * Fields from the date_statuses table exposed via API
 */
export const dateStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const dateStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Time Status Schema
// ============================================

/**
 * Time Status Response Schema
 * Fields from the time_statuses table exposed via API
 */
export const timeStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const timeStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Pitch Required Status Schema
// ============================================

/**
 * Pitch Required Status Response Schema
 * Values: pending, required, not_required
 */
export const pitchRequiredStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const pitchRequiredStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Translation Required Status Schema
// ============================================

/**
 * Translation Required Status Response Schema
 * Values: pending, required, not_required
 */
export const translationRequiredStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const translationRequiredStatusLookupItemSchema =
  lookupItemSchema.extend({
    name: z.string(),
    displayName: z.string(),
  });

// ============================================
// Venue Status Schema
// ============================================

/**
 * Venue Status Response Schema
 * Fields from the venue_statuses table exposed via API
 */
export const venueStatusResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const venueStatusLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// City Schema
// ============================================

/**
 * City Response Schema
 * Fields from the cities table exposed via API
 */
export const cityResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  provinceOrState: z.string().nullable(),
  country: z.string().nullable(),
});

export const cityLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
  provinceOrState: z.string().nullable(),
  country: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

// ============================================
// Comms Materials Schema
// ============================================

/**
 * Comms Materials Response Schema
 * Fields from the comms_materials table exposed via API
 */
export const commsMaterialsResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

export const commsMaterialsLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Translation Languages Schema
// ============================================

/**
 * Translation Language Response Schema
 * Fields from the translated_languages table exposed via API.
 * shortcode: internal language code when set.
 */
export const translationLanguageResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  shortcode: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  description: z.string().nullable(),
});

/**
 * Translation Language Lookup Item Schema.
 * shortcode: internal language code when set.
 */
export const translationLanguageLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string(),
  shortcode: z.string().nullable(),
});

// ============================================
// Government Representatives Schema
// ============================================

/**
 * Government Representative Response Schema
 * Fields from the government_representatives table exposed via API
 */
export const governmentRepresentativeResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  title: z.string().nullable(),
  email: z.string().nullable(),
  representativeType: z.enum(REPRESENTATIVE_TYPE).nullable(),
});

export const governmentRepresentativeLookupItemSchema = lookupItemSchema.extend(
  {
    name: z.string(),
    displayName: z.string(),
    title: z.string().nullable(),
    /** Derived: ministry id when this rep is that ministry’s designated minister */
    ministryId: z.number().int().nullable().optional(),
    representativeType: z.enum(REPRESENTATIVE_TYPE).nullable(),
  }
);

// ============================================
// Report Schema
// ============================================

/**
 * Report Response Schema
 * Fields from the reports table exposed via API
 */
export const reportResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  visibility: z.enum(VISIBILITY),
  config: reportConfigSchema.nullable(),
  description: z.string().nullable(),
});

// ============================================
// Theme Schema
// ============================================

/**
 * Theme Response Schema
 * Fields from the themes table exposed via API
 */
export const themeResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export const themeLookupItemSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  value: z.number().int(),
  name: z.string(),
  displayName: z.string(),
});

// ============================================
// Venue Preset Schema
// ============================================

/**
 * Venue Preset Item - admin-defined named venue for the activity form.
 * GET /lookups/venue-presets returns an array of these.
 * All active rows appear in the combobox; pinned rows also show as badges.
 */
export const venuePresetItemSchema = z
  .object({
    id: z.number().int(),
    isPinned: z.boolean(),
    pinnedSortOrder: z.number().int(),
  })
  .merge(venueAddressSchema);

// ============================================
// TypeScript Types (inferred from schemas)
// ============================================

// Generic lookup types
export type LookupItem = z.infer<typeof lookupItemSchema>;
export type ExtendedLookupItem = z.infer<typeof extendedLookupItemSchema>;

// Specific lookup response types
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryLookupItem = z.infer<typeof categoryLookupItemSchema>;

export type TagResponse = z.infer<typeof tagResponseSchema>;
export type TagLookupItem = z.infer<typeof tagLookupItemSchema>;

export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;
export type OrganizationLookupItem = z.infer<
  typeof organizationLookupItemSchema
>;

export type MinistryResponse = z.infer<typeof ministryResponseSchema>;
export type MinistryLookupItem = z.infer<typeof ministryLookupItemSchema>;

export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserLookupItem = z.infer<typeof userLookupItemSchema>;

export type PitchStatusResponse = z.infer<typeof pitchStatusResponseSchema>;
export type PitchStatusLookupItem = z.infer<typeof pitchStatusLookupItemSchema>;

export type ActivityStatusResponse = z.infer<
  typeof activityStatusResponseSchema
>;
export type ActivityStatusLookupItem = z.infer<
  typeof activityStatusLookupItemSchema
>;

export type DateStatusResponse = z.infer<typeof dateStatusResponseSchema>;
export type DateStatusLookupItem = z.infer<typeof dateStatusLookupItemSchema>;

export type TimeStatusResponse = z.infer<typeof timeStatusResponseSchema>;
export type TimeStatusLookupItem = z.infer<typeof timeStatusLookupItemSchema>;

export type PitchRequiredStatusResponse = z.infer<
  typeof pitchRequiredStatusResponseSchema
>;
export type PitchRequiredStatusLookupItem = z.infer<
  typeof pitchRequiredStatusLookupItemSchema
>;

export type TranslationRequiredStatusResponse = z.infer<
  typeof translationRequiredStatusResponseSchema
>;
export type TranslationRequiredStatusLookupItem = z.infer<
  typeof translationRequiredStatusLookupItemSchema
>;

export type VenueStatusResponse = z.infer<typeof venueStatusResponseSchema>;
export type VenueStatusLookupItem = z.infer<typeof venueStatusLookupItemSchema>;

export type CityResponse = z.infer<typeof cityResponseSchema>;
export type CityLookupItem = z.infer<typeof cityLookupItemSchema>;

export type CommsMaterialsResponse = z.infer<
  typeof commsMaterialsResponseSchema
>;
export type CommsMaterialsLookupItem = z.infer<
  typeof commsMaterialsLookupItemSchema
>;

export type TranslationLanguageResponse = z.infer<
  typeof translationLanguageResponseSchema
>;
export type TranslationLanguageLookupItem = z.infer<
  typeof translationLanguageLookupItemSchema
>;

export type GovernmentRepresentativeResponse = z.infer<
  typeof governmentRepresentativeResponseSchema
>;
export type GovernmentRepresentativeLookupItem = z.infer<
  typeof governmentRepresentativeLookupItemSchema
>;

export type ThemeResponse = z.infer<typeof themeResponseSchema>;
export type ThemeLookupItem = z.infer<typeof themeLookupItemSchema>;

export type ReportResponse = z.infer<typeof reportResponseSchema>;

export type VenuePresetItem = z.infer<typeof venuePresetItemSchema>;

// ============================================
// Request Schemas (for create/update operations)
// ============================================

/**
 * Create Category Request Schema
 * Fields required for creating a new category
 */
export const createCategoryRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
  visibility: z.enum(VISIBILITY).default('global').optional(),
  description: z.string().nullable().optional(),
});

/**
 * Update Category Request Schema
 * All fields optional for partial updates
 */
export const updateCategoryRequestSchema =
  createCategoryRequestSchema.partial();

/**
 * Create Tag Request Schema
 */
export const createTagRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().min(1).max(255).nullable().optional()
  ),
  sortOrder: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.number().int().default(0).optional()
  ),
  isActive: z.boolean().default(true).optional(),
  visibility: z.enum(['global', 'team']).default('global').optional(),
  description: z.string().nullable().optional(),
  /** When visibility='team', the team this tag is scoped to. Null/absent = global. */
  teamId: z.number().int().nullable().optional(),
});

/**
 * Update Tag Request Schema
 */
export const updateTagRequestSchema = createTagRequestSchema.partial();

/**
 * Create City Request Schema
 */
export const createCityRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  provinceOrState: z.string().max(255).nullable().optional(),
  country: z.string().max(255).nullable().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
});

/**
 * Update City Request Schema
 */
export const updateCityRequestSchema = createCityRequestSchema.partial();

/**
 * Create Ministry Request Schema
 */
export const createMinistryRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  abbreviation: z.string().min(1).max(5),
  ministerGovernmentRepId: z.number().int().nullable().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
  ministryGroupId: z.number().int().nullable().optional(),
});

/**
 * Update Ministry Request Schema
 */
export const updateMinistryRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  displayName: z.string().min(1).max(255).optional(),
  abbreviation: z.string().min(1).max(5).optional(),
  ministerGovernmentRepId: z.number().int().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  ministryGroupId: z.number().int().nullable().optional(),
});

/**
 * Create Comms Material Request Schema
 */
export const createCommsMaterialRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
  description: z.string().nullable().optional(),
});

/**
 * Update Comms Material Request Schema
 */
export const updateCommsMaterialRequestSchema =
  createCommsMaterialRequestSchema.partial();

/**
 * Create Government Representative Request Schema
 */
export const createGovernmentRepresentativeRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  title: z.string().max(255).nullable().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
  representativeType: z.enum(REPRESENTATIVE_TYPE).nullable().optional(),
});

/**
 * Update Government Representative Request Schema
 */
export const updateGovernmentRepresentativeRequestSchema =
  createGovernmentRepresentativeRequestSchema.partial();

/**
 * Create Theme Request Schema
 */
export const createThemeRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
});

/**
 * Update Theme Request Schema
 */
export const updateThemeRequestSchema = createThemeRequestSchema.partial();

/**
 * Create Activity Status Request Schema
 */
export const createActivityStatusRequestSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  sortOrder: z.number().int(),
  isActive: z.boolean().default(true).optional(),
  description: z.string().nullable().optional(),
});

/**
 * Update Activity Status Request Schema
 */
export const updateActivityStatusRequestSchema =
  createActivityStatusRequestSchema.partial();

/**
 * Create Venue Preset Request Schema
 */
export const createVenuePresetRequestSchema = z.object({
  venueName: z.string().min(1).max(255),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(255).nullable().optional(),
  provinceOrState: z.string().max(255).nullable().optional(),
  country: z.string().max(255).nullable().optional(),
  sortOrder: z.number().int().default(0).optional(),
  isActive: z.boolean().default(true).optional(),
  isPinned: z.boolean().default(false).optional(),
  pinnedSortOrder: z.number().int().default(0).optional(),
});

/**
 * Update Venue Preset Request Schema
 */
export const updateVenuePresetRequestSchema =
  createVenuePresetRequestSchema.partial();

// ============================================
// Request Type Exports
// ============================================

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type CreateTagRequest = z.infer<typeof createTagRequestSchema>;
export type UpdateTagRequest = z.infer<typeof updateTagRequestSchema>;
export type CreateCityRequest = z.infer<typeof createCityRequestSchema>;
export type UpdateCityRequest = z.infer<typeof updateCityRequestSchema>;
export type CreateMinistryRequest = z.infer<typeof createMinistryRequestSchema>;
export type UpdateMinistryRequest = z.infer<typeof updateMinistryRequestSchema>;
export type CreateCommsMaterialRequest = z.infer<
  typeof createCommsMaterialRequestSchema
>;
export type UpdateCommsMaterialRequest = z.infer<
  typeof updateCommsMaterialRequestSchema
>;
export type CreateGovernmentRepresentativeRequest = z.infer<
  typeof createGovernmentRepresentativeRequestSchema
>;
export type UpdateGovernmentRepresentativeRequest = z.infer<
  typeof updateGovernmentRepresentativeRequestSchema
>;
export type CreateThemeRequest = z.infer<typeof createThemeRequestSchema>;
export type UpdateThemeRequest = z.infer<typeof updateThemeRequestSchema>;
export type CreateActivityStatusRequest = z.infer<
  typeof createActivityStatusRequestSchema
>;
export type UpdateActivityStatusRequest = z.infer<
  typeof updateActivityStatusRequestSchema
>;
export type CreateVenuePresetRequest = z.infer<
  typeof createVenuePresetRequestSchema
>;
export type UpdateVenuePresetRequest = z.infer<
  typeof updateVenuePresetRequestSchema
>;
