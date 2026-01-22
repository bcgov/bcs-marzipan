import { createZodDto } from 'nestjs-zod';
import {
  updateCategoriesSchema,
  updateThemesSchema,
  updateTagsSchema,
  updateSharedWithSchema,
} from '@corpcal/shared/schemas';

/**
 * DTO for updating activity categories
 * Generated from updateCategoriesSchema using nestjs-zod
 */
export class UpdateCategoriesDto extends createZodDto(updateCategoriesSchema) {}

/**
 * DTO for updating activity themes (tags)
 * Generated from updateThemesSchema using nestjs-zod
 */
export class UpdateThemesDto extends createZodDto(updateThemesSchema) {}

/**
 * DTO for updating activity tags
 * Generated from updateTagsSchema using nestjs-zod
 */
export class UpdateTagsDto extends createZodDto(updateTagsSchema) {}

/**
 * DTO for updating shared with teams
 * Generated from updateSharedWithSchema using nestjs-zod
 */
export class UpdateSharedWithDto extends createZodDto(updateSharedWithSchema) {}
