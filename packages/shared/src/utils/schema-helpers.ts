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
export function ensureMatchesSchema<T extends z.ZodTypeAny>(
  schema: T,
  value: z.infer<T>
): z.infer<T> {
  return value;
}
