import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Health check response schema
 */
const healthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
});

/**
 * Readiness probe response schema
 */
const readinessResponseSchema = z.object({
  ready: z.boolean(),
  database: z.string(),
});

/**
 * DTO for health check response
 */
export class HealthResponseDto extends createZodDto(healthResponseSchema) {}

/**
 * DTO for readiness probe response
 */
export class ReadinessResponseDto extends createZodDto(
  readinessResponseSchema
) {}
