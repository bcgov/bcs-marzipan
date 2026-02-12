import { z } from 'zod';
/**
 * Utility functions to create Zod schemas that match Drizzle column definitions
 * These helpers ensure type safety between Drizzle schemas and Zod validation
 */
/**
 * Creates a Zod schema for a nullable/optional field
 * Handles both nullable columns and optional fields
 */
export function nullableField(schema) {
    return z.nullable(schema);
}
/**
 * Creates a Zod schema for an optional field
 */
export function optionalField(schema) {
    return schema.optional();
}
/**
 * Creates a Zod schema for a nullable and optional field
 */
export function nullableOptionalField(schema) {
    return z.nullable(schema).optional();
}
/**
 * Common Zod schemas for Drizzle column types
 */
export const drizzleZod = {
    // Integer types
    serial: z.number().int().positive(),
    integer: z.number().int(),
    // String types with length constraints
    varchar: (maxLength) => {
        const base = z.string();
        return maxLength ? base.max(maxLength) : base;
    },
    text: z.string(),
    // Boolean
    boolean: z.boolean(),
    // UUID
    uuid: z.string().uuid(),
    // Timestamps
    timestamp: z.coerce.date().or(z.string().datetime()),
    timestampString: z.string().datetime(),
    // BigInt
    bigint: z.number().int().or(z.bigint()),
};
/**
 * Helper to create a Zod object schema from a Drizzle table definition
 * This ensures the Zod schema matches the TypeScript type inferred from Drizzle
 *
 * Usage:
 * ```ts
 * const activityZodSchema = createZodSchemaFromDrizzleType<Activity>({
 *   id: drizzleZod.serial,
 *   title: drizzleZod.varchar(500).optional(),
 *   // ... other fields
 * });
 * ```
 */
export function createZodSchemaFromDrizzleType(fieldDefinitions) {
    return z.object(fieldDefinitions);
}
