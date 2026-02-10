import { createZodDto } from 'nestjs-zod';

import {
  activityStatusResponseSchema,
  categoryResponseSchema,
  cityResponseSchema,
  commsMaterialsResponseSchema,
  createActivityStatusRequestSchema,
  createArrayResponseWrapperSchema,
  createCategoryRequestSchema,
  createCityRequestSchema,
  createCommsMaterialRequestSchema,
  createGovernmentRepresentativeRequestSchema,
  createMinistryRequestSchema,
  createResponseWrapperSchema,
  createTagRequestSchema,
  createThemeRequestSchema,
  governmentRepresentativeResponseSchema,
  lookupItemSchema,
  ministryResponseSchema,
  tagResponseSchema,
  themeResponseSchema,
  updateActivityStatusRequestSchema,
  updateCategoryRequestSchema,
  updateCityRequestSchema,
  updateCommsMaterialRequestSchema,
  updateGovernmentRepresentativeRequestSchema,
  updateMinistryRequestSchema,
  updateTagRequestSchema,
  updateThemeRequestSchema,
} from '@corpcal/shared/schemas';

/**
 * DTO for a single lookup item
 * Generated from lookupItemSchema using nestjs-zod
 */
export class LookupItemDto extends createZodDto(lookupItemSchema) {}

/**
 * DTO for wrapped lookup array response: { success: true, data: LookupItem[] }
 * Used for all lookup endpoints
 */
export class LookupArrayResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(lookupItemSchema)
) {}

// ============================================
// Category DTOs
// ============================================

/**
 * DTO for creating a new category
 */
export class CreateCategoryDto extends createZodDto(
  createCategoryRequestSchema
) {}

/**
 * DTO for updating a category
 */
export class UpdateCategoryDto extends createZodDto(
  updateCategoryRequestSchema
) {}

/**
 * DTO for category response
 */
export class CategoryResponseDto extends createZodDto(categoryResponseSchema) {}

/**
 * DTO for wrapped category response
 */
export class CategoryResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(categoryResponseSchema)
) {}

// ============================================
// Tag DTOs
// ============================================

/**
 * DTO for creating a new tag
 */
export class CreateTagDto extends createZodDto(createTagRequestSchema) {}

/**
 * DTO for updating a tag
 */
export class UpdateTagDto extends createZodDto(updateTagRequestSchema) {}

/**
 * DTO for tag response
 */
export class TagResponseDto extends createZodDto(tagResponseSchema) {}

/**
 * DTO for wrapped tag response
 */
export class TagResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(tagResponseSchema)
) {}

// ============================================
// City DTOs
// ============================================

/**
 * DTO for creating a new city
 */
export class CreateCityDto extends createZodDto(createCityRequestSchema) {}

/**
 * DTO for updating a city
 */
export class UpdateCityDto extends createZodDto(updateCityRequestSchema) {}

/**
 * DTO for city response
 */
export class CityResponseDto extends createZodDto(cityResponseSchema) {}

/**
 * DTO for wrapped city response
 */
export class CityResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(cityResponseSchema)
) {}

// ============================================
// Ministry DTOs
// ============================================

/**
 * DTO for creating a new ministry
 */
export class CreateMinistryDto extends createZodDto(
  createMinistryRequestSchema
) {}

/**
 * DTO for updating a ministry
 */
export class UpdateMinistryDto extends createZodDto(
  updateMinistryRequestSchema
) {}

/**
 * DTO for ministry response
 */
export class MinistryResponseDto extends createZodDto(ministryResponseSchema) {}

/**
 * DTO for wrapped ministry response
 */
export class MinistryResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(ministryResponseSchema)
) {}

// ============================================
// Comms Material DTOs
// ============================================

/**
 * DTO for creating a new comms material
 */
export class CreateCommsMaterialDto extends createZodDto(
  createCommsMaterialRequestSchema
) {}

/**
 * DTO for updating a comms material
 */
export class UpdateCommsMaterialDto extends createZodDto(
  updateCommsMaterialRequestSchema
) {}

/**
 * DTO for comms material response
 */
export class CommsMaterialResponseDto extends createZodDto(
  commsMaterialsResponseSchema
) {}

/**
 * DTO for wrapped comms material response
 */
export class CommsMaterialResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(commsMaterialsResponseSchema)
) {}

// ============================================
// Government Representative DTOs
// ============================================

/**
 * DTO for creating a new government representative
 */
export class CreateGovernmentRepresentativeDto extends createZodDto(
  createGovernmentRepresentativeRequestSchema
) {}

/**
 * DTO for updating a government representative
 */
export class UpdateGovernmentRepresentativeDto extends createZodDto(
  updateGovernmentRepresentativeRequestSchema
) {}

/**
 * DTO for government representative response
 */
export class GovernmentRepresentativeResponseDto extends createZodDto(
  governmentRepresentativeResponseSchema
) {}

/**
 * DTO for wrapped government representative response
 */
export class GovernmentRepresentativeResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(governmentRepresentativeResponseSchema)
) {}

// ============================================
// Theme DTOs
// ============================================

/**
 * DTO for creating a new theme
 */
export class CreateThemeDto extends createZodDto(createThemeRequestSchema) {}

/**
 * DTO for updating a theme
 */
export class UpdateThemeDto extends createZodDto(updateThemeRequestSchema) {}

/**
 * DTO for theme response
 */
export class ThemeResponseDto extends createZodDto(themeResponseSchema) {}

/**
 * DTO for wrapped theme response
 */
export class ThemeResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(themeResponseSchema)
) {}

// ============================================
// Activity Status DTOs
// ============================================

/**
 * DTO for creating a new activity status
 */
export class CreateActivityStatusDto extends createZodDto(
  createActivityStatusRequestSchema
) {}

/**
 * DTO for updating an activity status
 */
export class UpdateActivityStatusDto extends createZodDto(
  updateActivityStatusRequestSchema
) {}

/**
 * DTO for activity status response
 */
export class ActivityStatusResponseDto extends createZodDto(
  activityStatusResponseSchema
) {}

/**
 * DTO for wrapped activity status response
 */
export class ActivityStatusResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityStatusResponseSchema)
) {}
