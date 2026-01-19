import { z } from 'zod';

/**
 * Response Wrapper Schema
 *
 * Standard API response wrapper pattern: { success: boolean; data: T }
 * Used consistently across all API endpoints.
 */

/**
 * Creates a response wrapper schema for a given data type
 *
 * @param dataSchema - The Zod schema for the data field
 * @returns A Zod schema for the wrapped response
 *
 * @example
 * ```typescript
 * const activityResponseWrapper = createResponseWrapperSchema(activityResponseSchema);
 * type ActivityResponseWrapper = z.infer<typeof activityResponseWrapper>;
 * ```
 */
export function createResponseWrapperSchema<T extends z.ZodTypeAny>(
  dataSchema: T
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: T;
}> {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

/**
 * Response wrapper for array data
 *
 * @param itemSchema - The Zod schema for array items
 * @returns A Zod schema for the wrapped array response
 */
export function createArrayResponseWrapperSchema<T extends z.ZodTypeAny>(
  itemSchema: T
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: z.ZodArray<T>;
}> {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
  });
}

/**
 * Generic response wrapper type helper
 * Use this to type response objects in controllers
 */
export type ResponseWrapper<T> = {
  success: true;
  data: T;
};
