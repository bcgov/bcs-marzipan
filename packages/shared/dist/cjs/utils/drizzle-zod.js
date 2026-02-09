"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleZod = void 0;
exports.nullableField = nullableField;
exports.optionalField = optionalField;
exports.nullableOptionalField = nullableOptionalField;
exports.createZodSchemaFromDrizzleType = createZodSchemaFromDrizzleType;
const zod_1 = require("zod");
/**
 * Utility functions to create Zod schemas that match Drizzle column definitions
 * These helpers ensure type safety between Drizzle schemas and Zod validation
 */
/**
 * Creates a Zod schema for a nullable/optional field
 * Handles both nullable columns and optional fields
 */
function nullableField(schema) {
    return zod_1.z.nullable(schema);
}
/**
 * Creates a Zod schema for an optional field
 */
function optionalField(schema) {
    return schema.optional();
}
/**
 * Creates a Zod schema for a nullable and optional field
 */
function nullableOptionalField(schema) {
    return zod_1.z.nullable(schema).optional();
}
/**
 * Common Zod schemas for Drizzle column types
 */
exports.drizzleZod = {
    // Integer types
    serial: zod_1.z.number().int().positive(),
    integer: zod_1.z.number().int(),
    // String types with length constraints
    varchar: (maxLength) => {
        const base = zod_1.z.string();
        return maxLength ? base.max(maxLength) : base;
    },
    text: zod_1.z.string(),
    // Boolean
    boolean: zod_1.z.boolean(),
    // UUID
    uuid: zod_1.z.string().uuid(),
    // Timestamps
    timestamp: zod_1.z.coerce.date().or(zod_1.z.string().datetime()),
    timestampString: zod_1.z.string().datetime(),
    // BigInt
    bigint: zod_1.z.number().int().or(zod_1.z.bigint()),
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
function createZodSchemaFromDrizzleType(fieldDefinitions) {
    return zod_1.z.object(fieldDefinitions);
}
