import { createZodDto } from 'nestjs-zod';
import {
  activityResponseSchema,
  createResponseWrapperSchema,
  createArrayResponseWrapperSchema,
} from '@corpcal/shared/schemas';

/**
 * DTO for a single activity response
 * Generated from activityResponseSchema using nestjs-zod
 */
export class ActivityResponseDto extends createZodDto(activityResponseSchema) {}

/**
 * DTO for wrapped activity response: { success: true, data: ActivityResponse }
 * Used for single activity endpoints
 */
export class ActivityResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityResponseSchema)
) {}

/**
 * DTO for wrapped activity array response: { success: true, data: ActivityResponse[] }
 * Used for list endpoints
 */
export class ActivityArrayResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(activityResponseSchema)
) {}
