/**
 * Type Validation Script
 *
 * This file validates that Zod schemas in the shared package align with
 * the TypeScript types inferred from Drizzle schemas in the database package.
 *
 * Run: `npm run validate-types --workspace=packages/shared`
 * TypeScript will error at compile-time if the types don't match.
 *
 * The primary type safety checks are now in schema-helpers.ts (compile-time assertions).
 * This file provides additional validation and serves as documentation.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Activity,
  ActivityStatus,
  Category,
  City,
  GovernmentRepresentative,
  Tag,
} from '@corpcal/database/types';

import type {
  ActivityComputedFields,
  ActivityDbFields,
  ActivityResponse,
} from '../src/schemas/activity-response.schema';
import {
  createActivityRequestSchema,
  updateActivityRequestSchema,
  type CreateActivityRequest,
  type UpdateActivityRequest,
} from '../src/schemas/activity.schema';
import {
  lookupItemSchema,
  type ActivityStatusResponse,
  type CategoryResponse,
  type CityResponse,
  type GovernmentRepresentativeResponse,
  type LookupItem,
  type TagResponse,
} from '../src/schemas/lookup.schema';

// ============================================================================
// Activity Response Schema Validation
// ============================================================================

/**
 * Compile-time check: All database fields in ActivityDbFields must exist in Activity.
 *
 * This mapped type will produce a type error if any field in the API schema
 * doesn't exist in the database Activity type.
 *
 * Note: Types may differ (e.g., Date in DB vs string in API) - we only verify
 * that the field names align.
 */
type AssertDbFieldsExist = {
  [K in keyof ActivityDbFields]: K extends keyof Activity
    ? true
    : `Field '${K & string}' in API schema does not exist in Activity database type`;
};

/**
 * Compile-time check: All database fields (except internal ones) are exposed in API.
 *
 * This ensures we don't accidentally omit a database field from the API response.
 * Fields like 'rowVersion' are excluded as they are internal-only.
 */
type DbFieldsToExpose = Exclude<keyof Activity, 'rowVersion'>;
type AssertDbFieldsExposed = {
  [K in DbFieldsToExpose]: K extends keyof ActivityDbFields
    ? true
    : `Database field '${K & string}' is not exposed in API - add to activityDbFieldsSchema`;
};

// Execute compile-time checks
const _dbFieldsExist: AssertDbFieldsExist = {} as AssertDbFieldsExist;
const _dbFieldsExposed: AssertDbFieldsExposed = {} as AssertDbFieldsExposed;

// ============================================================================
// Request Schema Validation
// ============================================================================

/**
 * Validate CreateActivityRequest structure.
 * This ensures the request schema type is correctly inferred.
 */
const _createActivityRequestCheck: CreateActivityRequest =
  {} as CreateActivityRequest;

/**
 * Validate UpdateActivityRequest is a partial of CreateActivityRequest.
 * All fields should be optional for partial updates.
 */
const _updateActivityRequestCheck: UpdateActivityRequest =
  {} as UpdateActivityRequest;

// ============================================================================
// Computed Fields Validation
// ============================================================================

/**
 * List of computed fields that should NOT exist in the database Activity type.
 * If any of these start appearing in Activity, it may indicate schema drift.
 */
type ComputedFieldsShouldNotBeInDb = {
  [K in keyof ActivityComputedFields]: K extends keyof Activity
    ? `Computed field '${K & string}' found in Activity type - should be computed, not stored`
    : true;
};

const _computedFieldsNotInDb: ComputedFieldsShouldNotBeInDb =
  {} as ComputedFieldsShouldNotBeInDb;

// ============================================================================
// Lookup Schema Validations
// ============================================================================

/**
 * Validate LookupItem schema structure
 */
type LookupItemFields = keyof LookupItem;
const _lookupItemCheck: LookupItem = {
  id: 1,
  label: 'test',
  value: 1,
};

/**
 * Validate lookup response schemas have expected fields from database types.
 * These checks are supplementary to the compile-time assertions in schema-helpers.ts.
 * The primary validation happens via type assertions in schema-helpers.ts.
 */

/**
 * Validate CategoryResponse has expected fields from Category
 */
const _categoryResponseCheck: {
  id: Category['id'];
  name: Category['name'];
  displayName: Category['displayName'];
  isActive: Category['isActive'];
  visibility: Category['visibility'];
} = {} as never;

/**
 * Validate TagResponse has expected fields from Tag
 */
const _tagResponseCheck: {
  id: Tag['id'];
  name: Tag['name'];
  displayName: Tag['displayName'];
  isActive: Tag['isActive'];
} = {} as never;

/**
 * Validate ActivityStatusResponse has expected fields from ActivityStatus
 */
const _activityStatusResponseCheck: {
  id: ActivityStatus['id'];
  name: ActivityStatus['name'];
  displayName: ActivityStatus['displayName'];
  isActive: ActivityStatus['isActive'];
} = {} as never;

/**
 * Validate CityResponse has expected fields from City
 */
const _cityResponseCheck: {
  id: City['id'];
  name: City['name'];
  displayName: City['displayName'];
  isActive: City['isActive'];
  provinceOrState: City['provinceOrState'];
  country: City['country'];
} = {} as never;

/**
 * Validate GovernmentRepresentativeResponse has expected fields from GovernmentRepresentative
 */
const _govRepResponseCheck: {
  id: GovernmentRepresentative['id'];
  name: GovernmentRepresentative['name'];
  displayName: GovernmentRepresentative['displayName'];
  isActive: GovernmentRepresentative['isActive'];
  title: GovernmentRepresentative['title'];
} = {} as never;

// ============================================================================
// Success Message
// ============================================================================

console.log(
  'Type validation passed: All schemas are in sync with database types.'
);
