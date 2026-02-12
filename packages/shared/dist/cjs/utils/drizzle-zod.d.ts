import { z } from 'zod';
/**
 * Utility functions to create Zod schemas that match Drizzle column definitions
 * These helpers ensure type safety between Drizzle schemas and Zod validation
 */
/**
 * Creates a Zod schema for a nullable/optional field
 * Handles both nullable columns and optional fields
 */
export declare function nullableField<T extends z.ZodTypeAny>(schema: T): z.ZodNullable<T>;
/**
 * Creates a Zod schema for an optional field
 */
export declare function optionalField<T extends z.ZodTypeAny>(schema: T): z.ZodOptional<T>;
/**
 * Creates a Zod schema for a nullable and optional field
 */
export declare function nullableOptionalField<T extends z.ZodTypeAny>(schema: T): z.ZodOptional<z.ZodNullable<T>>;
/**
 * Common Zod schemas for Drizzle column types
 */
export declare const drizzleZod: {
    serial: z.ZodNumber;
    integer: z.ZodNumber;
    varchar: (maxLength?: number) => z.ZodString;
    text: z.ZodString;
    boolean: z.ZodBoolean;
    uuid: z.ZodString;
    timestamp: z.ZodUnion<[z.ZodCoercedDate<unknown>, z.ZodString]>;
    timestampString: z.ZodString;
    bigint: z.ZodUnion<[z.ZodNumber, z.ZodBigInt]>;
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
export declare function createZodSchemaFromDrizzleType<T extends Record<string, z.ZodTypeAny>>(fieldDefinitions: T): z.ZodObject<T>;
//# sourceMappingURL=drizzle-zod.d.ts.map