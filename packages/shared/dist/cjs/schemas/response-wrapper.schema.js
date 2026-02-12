"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponseWrapperSchema = createResponseWrapperSchema;
exports.createArrayResponseWrapperSchema = createArrayResponseWrapperSchema;
const zod_1 = require("zod");
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
function createResponseWrapperSchema(dataSchema) {
    return zod_1.z.object({
        success: zod_1.z.literal(true),
        data: dataSchema,
    });
}
/**
 * Response wrapper for array data
 *
 * @param itemSchema - The Zod schema for array items
 * @returns A Zod schema for the wrapped array response
 */
function createArrayResponseWrapperSchema(itemSchema) {
    return zod_1.z.object({
        success: zod_1.z.literal(true),
        data: zod_1.z.array(itemSchema),
    });
}
