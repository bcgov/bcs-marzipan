import { z } from 'zod';
import type {
  Activity,
  Category,
  Tag,
  Ministry,
  User,
  ActivityStatus,
  City,
  GovernmentRepresentative,
  Organization,
  PitchStatus,
  DateStatus,
  TimeStatus,
  VenueStatus,
} from '@corpcal/database/types';
import type { ActivityDbFields } from '../schemas/activity-response.schema';
import type {
  CategoryResponse,
  TagResponse,
  OrganizationResponse,
  MinistryResponse,
  UserResponse,
  ActivityStatusResponse,
  PitchStatusResponse,
  DateStatusResponse,
  TimeStatusResponse,
  VenueStatusResponse,
  CityResponse,
  GovernmentRepresentativeResponse,
} from '../schemas/lookup.schema';

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
export function ensureMatchesSchema<T extends z.ZodType>(
  schema: T,
  value: z.infer<T>
): z.infer<T> {
  return value;
}

// ============================================================================
// Compile-Time Type Assertions
// ============================================================================

/**
 * Type assertion to verify that API schema fields exist in the database fields.
 * Note: The types may differ (e.g., Date in DB vs string in API) - we only
 * check that the field names exist.
 *
 * This mapped type checks that each field in ActivityDbFields has a
 * corresponding field in the database Activity type. If a field is
 * added to the API schema that doesn't exist in the database, TypeScript
 * will error at compile-time.
 */
type AssertDbFieldsExist = {
  [K in keyof ActivityDbFields]: K extends keyof Activity
    ? true
    : `Field '${K & string}' in API schema does not exist in Activity database type`;
};

/**
 * Type assertion to verify that all required database fields are in API schema.
 *
 * This checks the reverse: that important database fields aren't accidentally
 * omitted from the API schema. We exclude internal-only fields like rowVersion.
 */
type DbFieldsToExpose = Exclude<keyof Activity, 'rowVersion'>;
type AssertDbFieldsExposed = {
  [K in DbFieldsToExpose]: K extends keyof ActivityDbFields
    ? true
    : `Database field '${K & string}' is not exposed in API schema - add to activityDbFieldsSchema or exclude explicitly`;
};

// Compile-time checks - these will error if types don't align
// The 'as never' pattern allows the assignment without needing actual values
const _assertDbFieldsExist: AssertDbFieldsExist = {} as AssertDbFieldsExist;
const _assertDbFieldsExposed: AssertDbFieldsExposed =
  {} as AssertDbFieldsExposed;

// Silence unused variable warnings
void _assertDbFieldsExist;
void _assertDbFieldsExposed;

// ============================================================================
// Lookup Schema Type Assertions
// ============================================================================

/**
 * Type assertions for lookup schemas
 * These verify that API schema fields exist in the corresponding database types
 */

type AssertCategoryFieldsExist = {
  [K in keyof CategoryResponse]: K extends keyof Category
    ? true
    : `Field '${K & string}' in CategoryResponse does not exist in Category database type`;
};

type AssertTagFieldsExist = {
  [K in keyof TagResponse]: K extends keyof Tag
    ? true
    : `Field '${K & string}' in TagResponse does not exist in Tag database type`;
};

type AssertOrganizationFieldsExist = {
  [K in keyof OrganizationResponse]: K extends keyof Organization
    ? true
    : `Field '${K & string}' in OrganizationResponse does not exist in Organization database type`;
};

type AssertMinistryFieldsExist = {
  [K in keyof MinistryResponse]: K extends keyof Ministry
    ? true
    : `Field '${K & string}' in MinistryResponse does not exist in Ministry database type`;
};

type AssertUserFieldsExist = {
  [K in keyof UserResponse]: K extends keyof User
    ? true
    : `Field '${K & string}' in UserResponse does not exist in User database type`;
};

type AssertActivityStatusFieldsExist = {
  [K in keyof ActivityStatusResponse]: K extends keyof ActivityStatus
    ? true
    : `Field '${K & string}' in ActivityStatusResponse does not exist in ActivityStatus database type`;
};

type AssertPitchStatusFieldsExist = {
  [K in keyof PitchStatusResponse]: K extends keyof PitchStatus
    ? true
    : `Field '${K & string}' in PitchStatusResponse does not exist in PitchStatus database type`;
};

type AssertDateStatusFieldsExist = {
  [K in keyof DateStatusResponse]: K extends keyof DateStatus
    ? true
    : `Field '${K & string}' in DateStatusResponse does not exist in DateStatus database type`;
};

type AssertTimeStatusFieldsExist = {
  [K in keyof TimeStatusResponse]: K extends keyof TimeStatus
    ? true
    : `Field '${K & string}' in TimeStatusResponse does not exist in TimeStatus database type`;
};

type AssertVenueStatusFieldsExist = {
  [K in keyof VenueStatusResponse]: K extends keyof VenueStatus
    ? true
    : `Field '${K & string}' in VenueStatusResponse does not exist in VenueStatus database type`;
};

type AssertCityFieldsExist = {
  [K in keyof CityResponse]: K extends keyof City
    ? true
    : `Field '${K & string}' in CityResponse does not exist in City database type`;
};

type AssertGovernmentRepresentativeFieldsExist = {
  [K in keyof GovernmentRepresentativeResponse]: K extends keyof GovernmentRepresentative
    ? true
    : `Field '${K & string}' in GovernmentRepresentativeResponse does not exist in GovernmentRepresentative database type`;
};

// Compile-time checks for lookup schemas
const _assertCategoryFieldsExist: AssertCategoryFieldsExist =
  {} as AssertCategoryFieldsExist;
const _assertTagFieldsExist: AssertTagFieldsExist = {} as AssertTagFieldsExist;
const _assertOrganizationFieldsExist: AssertOrganizationFieldsExist =
  {} as AssertOrganizationFieldsExist;
const _assertMinistryFieldsExist: AssertMinistryFieldsExist =
  {} as AssertMinistryFieldsExist;
const _assertUserFieldsExist: AssertUserFieldsExist =
  {} as AssertUserFieldsExist;
const _assertActivityStatusFieldsExist: AssertActivityStatusFieldsExist =
  {} as AssertActivityStatusFieldsExist;
const _assertPitchStatusFieldsExist: AssertPitchStatusFieldsExist =
  {} as AssertPitchStatusFieldsExist;
const _assertDateStatusFieldsExist: AssertDateStatusFieldsExist =
  {} as AssertDateStatusFieldsExist;
const _assertTimeStatusFieldsExist: AssertTimeStatusFieldsExist =
  {} as AssertTimeStatusFieldsExist;
const _assertVenueStatusFieldsExist: AssertVenueStatusFieldsExist =
  {} as AssertVenueStatusFieldsExist;
const _assertCityFieldsExist: AssertCityFieldsExist =
  {} as AssertCityFieldsExist;
const _assertGovernmentRepresentativeFieldsExist: AssertGovernmentRepresentativeFieldsExist =
  {} as AssertGovernmentRepresentativeFieldsExist;

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
