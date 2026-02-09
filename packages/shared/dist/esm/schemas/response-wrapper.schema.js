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
export function createResponseWrapperSchema(dataSchema) {
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
export function createArrayResponseWrapperSchema(itemSchema) {
    return z.object({
        success: z.literal(true),
        data: z.array(itemSchema),
    });
}
