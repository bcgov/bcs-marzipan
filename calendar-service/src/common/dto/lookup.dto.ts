import { createZodDto } from 'nestjs-zod';
import {
  lookupItemSchema,
  createArrayResponseWrapperSchema,
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
