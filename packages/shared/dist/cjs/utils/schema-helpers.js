"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMatchesSchema = ensureMatchesSchema;
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
function ensureMatchesSchema(schema, value) {
    return value;
}
// Compile-time checks - these will error if types don't align
// The 'as never' pattern allows the assignment without needing actual values
const _assertDbFieldsExist = {};
const _assertDbFieldsExposed = {};
// Silence unused variable warnings
void _assertDbFieldsExist;
void _assertDbFieldsExposed;
// Compile-time checks for lookup schemas
const _assertCategoryFieldsExist = {};
const _assertTagFieldsExist = {};
const _assertOrganizationFieldsExist = {};
const _assertMinistryFieldsExist = {};
const _assertUserFieldsExist = {};
const _assertActivityStatusFieldsExist = {};
const _assertPitchStatusFieldsExist = {};
const _assertDateStatusFieldsExist = {};
const _assertTimeStatusFieldsExist = {};
const _assertVenueStatusFieldsExist = {};
const _assertCityFieldsExist = {};
const _assertGovernmentRepresentativeFieldsExist = {};
// Silence unused variable warnings
void _assertCategoryFieldsExist;
void _assertTagFieldsExist;
void _assertOrganizationFieldsExist;
void _assertMinistryFieldsExist;
void _assertUserFieldsExist;
void _assertActivityStatusFieldsExist;
void _assertPitchStatusFieldsExist;
void _assertDateStatusFieldsExist;
void _assertTimeStatusFieldsExist;
void _assertVenueStatusFieldsExist;
void _assertCityFieldsExist;
void _assertGovernmentRepresentativeFieldsExist;
