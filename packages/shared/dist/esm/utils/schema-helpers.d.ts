import { z } from 'zod';
/**
 * Schema Helper Utilities
 *
 * Utilities for working with Zod schemas and ensuring type safety
 * between schemas and TypeScript types.
 */
/**
 * Ensures a value matches a Zod schema at compile-time.
 *
 * This function provides compile-time type checking that a value
 * conforms to the inferred type of a Zod schema. If the value doesn't
 * match the schema type, TypeScript will error at compile-time.
 *
 * @param schema - The Zod schema to validate against
 * @param value - The value that should match the schema's inferred type
 * @returns The value, typed as the schema's inferred type
 *
 * @example
 * ```typescript
 * const dto = ensureMatchesSchema(activityResponseSchema, {
 *   id: 1,
 *   title: 'Test',
 *   // ... other fields
 * });
 * // TypeScript ensures dto matches ActivityResponse
 * ```
 */
export declare function ensureMatchesSchema<T extends z.ZodType>(schema: T, value: z.infer<T>): z.infer<T>;
/**
 * Helper type to check if a type T is a subset of type U
 * Useful for validating that API types align with database types
 */
export type IsSubset<T, U> = T extends U ? true : false;
/**
 * Helper type to get fields that exist in T but not in U
 * Useful for debugging type misalignments
 */
export type ExtraFields<T, U> = Exclude<keyof T, keyof U>;
/**
 * Helper type to get fields that exist in U but not in T
 * Useful for debugging missing fields
 */
export type MissingFields<T, U> = Exclude<keyof U, keyof T>;
//# sourceMappingURL=schema-helpers.d.ts.map