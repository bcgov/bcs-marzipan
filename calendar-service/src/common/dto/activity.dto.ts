import { createZodDto } from 'nestjs-zod';

import {
  createActivityRequestSchema,
  filterActivitiesQuerySchema,
  hardDeleteRequestSchema,
  requestDeleteRequestSchema,
  restoreRequestSchema,
  softDeleteRequestSchema,
  updateActivityRequestSchema,
} from '@corpcal/shared/schemas';

/**
 * DTO for creating a new activity
 * Generated from createActivityRequestSchema using nestjs-zod
 */
export class CreateActivityDto extends createZodDto(
  createActivityRequestSchema
) {}

/**
 * DTO for updating an activity (partial update)
 * Generated from updateActivityRequestSchema using nestjs-zod
 */
export class UpdateActivityDto extends createZodDto(
  updateActivityRequestSchema
) {}

/**
 * DTO for filtering activities (query parameters)
 * Generated from filterActivitiesQuerySchema using nestjs-zod
 */
export class FilterActivitiesDto extends createZodDto(
  filterActivitiesQuerySchema
) {}

/**
 * DTO for soft deleting an activity
 * Generated from softDeleteRequestSchema using nestjs-zod
 */
export class SoftDeleteDto extends createZodDto(softDeleteRequestSchema) {}

/**
 * DTO for requesting delete (comms contacts)
 * Generated from requestDeleteRequestSchema using nestjs-zod
 */
export class RequestDeleteDto extends createZodDto(
  requestDeleteRequestSchema
) {}

/**
 * DTO for restoring an activity from delete_requested or deleted
 * Generated from restoreRequestSchema using nestjs-zod
 */
export class RestoreDto extends createZodDto(restoreRequestSchema) {}

/**
 * DTO for hard delete (permanent) request body. Reason is optional.
 * Generated from hardDeleteRequestSchema using nestjs-zod
 */
export class HardDeleteDto extends createZodDto(hardDeleteRequestSchema) {}
