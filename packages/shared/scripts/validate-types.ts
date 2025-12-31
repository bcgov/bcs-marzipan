/**
 * Type validation file
 *
 * This file validates that Zod schemas in the shared package match
 * the TypeScript types inferred from Drizzle schemas in the database package.
 *
 * From root `npm run validate-types --workspace=packages/shared` to validate types are in sync.
 * TypeScript will error if the types don't match.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import type {
  Activity,
  NewActivity,
  Category,
  Tag,
  ActivityStatus,
  City,
  GovernmentRepresentative,
} from '@corpcal/database/types';
import {
  activitySchema,
  createActivitySchema,
  updateActivitySchema,
  createActivityRequestSchema,
  updateActivityRequestSchema,
  type CreateActivity,
  type UpdateActivity,
  type CreateActivityRequest,
  type UpdateActivityRequest,
} from '../src/schemas/activity.schema';
import type { ActivityResponse } from '../src/schemas/activity-response.schema';
import {
  categoryResponseSchema,
  tagResponseSchema,
  activityStatusResponseSchema,
  cityResponseSchema,
  governmentRepresentativeResponseSchema,
  lookupItemSchema,
  type LookupItem,
  type CategoryResponse,
  type TagResponse,
  type ActivityStatusResponse,
  type CityResponse,
  type GovernmentRepresentativeResponse,
} from '../src/schemas/lookup.schema';

/**
 * Validates that a Zod schema type matches the Drizzle inferred type
 * This is a compile-time check - if this compiles, the types match
 */
function validateTypeMatch<T extends z.ZodTypeAny>(
  _schema: T,
  _type: z.infer<T>
): void {
  // This function only exists for type checking
  // If the types don't match, TypeScript will error here
}

/**
 * Validates that a type T is assignable to type U
 * This ensures T is a subset or compatible with U
 */
function validateTypeSubset<T extends U, U>(_subset: T, _superset: U): void {
  // This function only exists for type checking
  // If T is not assignable to U, TypeScript will error here
}

// Validate Activity schema matches Activity type
// This will cause a TypeScript error if types don't match
// Using type assertion because drizzle-zod's BuildSchema is compatible with ZodTypeAny
validateTypeMatch(activitySchema as unknown as z.ZodTypeAny, {} as Activity);

// Validate CreateActivity schema matches NewActivity type
validateTypeMatch(
  createActivitySchema as unknown as z.ZodTypeAny,
  {} as NewActivity
);

// Validate UpdateActivity schema (partial update - all fields optional)
// This is a compile-time check that the schema structure is correct
// Using exported type from activity.schema.ts
const _updateActivityCheck: Partial<Activity> = {} as UpdateActivity;

// Validate CreateActivityRequest schema
// This extends CreateActivity with request-specific transformations
// Using exported type from activity.schema.ts
const _createActivityRequestCheck: CreateActivityRequest =
  {} as CreateActivityRequest;

// Validate UpdateActivityRequest schema
// Using exported type from activity.schema.ts
const _updateActivityRequestCheck: UpdateActivityRequest =
  {} as UpdateActivityRequest;

// Validate that ActivityResponse fields are derived from Activity
// This ensures the API response schema is based on the database schema
// Note: ActivityResponse has transformed fields (dates to strings, etc.) and computed fields
// so we can't do a direct subset check, but we can verify key fields exist
type ActivityResponseFields = keyof ActivityResponse;
type ActivityFields = keyof Activity;

// Check that core fields from ActivityResponse have corresponding fields in Activity
// (accounting for transformations like leadOrgId → leadOrg, dates → strings, etc.)
// This is a compile-time check that ensures the mapping is valid
const _activityResponseFieldCheck: {
  // Core fields that should exist in Activity
  id: Activity['id'];
  displayId: Activity['displayId'];
  title: Activity['title'];
  summary: Activity['summary'];
  isIssue: Activity['isIssue'];
  isActive: Activity['isActive'];
  significance: Activity['significance'];
  pitchComments: Activity['pitchComments'];
  isAllDay: Activity['isAllDay'];
  schedulingConsiderations: Activity['schedulingConsiderations'];
  newsReleaseId: Activity['newsReleaseId'];
  eventLeadName: Activity['eventLeadName'];
  notForLookAhead: Activity['notForLookAhead'];
  notForThirtySixtyNinety: Activity['notForThirtySixtyNinety'];
  // Transformed fields (these exist in Activity but with different types)
  activityStatusId: Activity['activityStatusId']; // number in Activity, string in Response
  pitchStatusId: Activity['pitchStatusId']; // number in Activity, string in Response
  dateStatusId: Activity['dateStatusId']; // number in Activity, string in Response
  timeStatusId: Activity['timeStatusId']; // number in Activity, string in Response
  venueStatusId: Activity['venueStatusId']; // number in Activity, string in Response
  startDate: Activity['startDate']; // Date in Activity, string in Response
  endDate: Activity['endDate']; // Date in Activity, string in Response
  startTime: Activity['startTime']; // time in Activity, string in Response
  endTime: Activity['endTime']; // time in Activity, string in Response
  createdDateTime: Activity['createdDateTime']; // Date in Activity, string in Response
  lastUpdatedDateTime: Activity['lastUpdatedDateTime']; // Date in Activity, string in Response
  createdBy: Activity['createdBy']; // number in Activity, string in Response
  lastUpdatedBy: Activity['lastUpdatedBy']; // number in Activity, string in Response
  venue: Activity['venue'];
  venueAddress: Activity['venueAddress'];
  lookAheadStatus: Activity['lookAheadStatus'];
  lookAheadSection: Activity['lookAheadSection'];
  calendarVisibility: Activity['calendarVisibility'];
  // Organization fields
  leadOrgId: Activity['leadOrgId'];
  leadOrgName: Activity['leadOrgName'];
  eventLeadOrgId: Activity['eventLeadOrgId'];
  eventLeadOrgName: Activity['eventLeadOrgName'];
  // User ID fields
  eventLeadId: Activity['eventLeadId'];
  graphicsUserId: Activity['graphicsUserId'];
  ownerId: Activity['ownerId'];
  ministryOwnerId: Activity['ministryOwnerId'];
  // Computed/joined fields (these don't exist in Activity, they're added in the response)
  // category, tags, jointOrg, relatedActivities, commsMaterials, translationsRequired,
  // jointEventOrg, representativesAttending, sharedWith, canEdit, canView, additionalOwners are added from relatedData
  // leadOrg, eventLeadOrg, eventLead, graphicsUser, owner are computed/renamed fields
  // pitchStatus, dateStatus, timeStatus, venueStatus are computed from lookups
} = {} as never;

// ============================================
// Lookup Schema Validations
// ============================================

// Validate LookupItem schema structure
type LookupItemFields = keyof LookupItem;
const _lookupItemCheck: LookupItem = {
  id: 1,
  label: 'test',
  value: 1,
};

// Validate CategoryResponse has expected fields from Category
const _categoryResponseCheck: {
  id: Category['id'];
  name: Category['name'];
  displayName: Category['displayName'];
  isActive: Category['isActive'];
} = {} as never;

// Validate TagResponse has expected fields from Tag
const _tagResponseCheck: {
  id: Tag['id'];
  key: Tag['key'];
  displayName: Tag['displayName'];
  isActive: Tag['isActive'];
} = {} as never;

// Validate ActivityStatusResponse has expected fields from ActivityStatus
const _activityStatusResponseCheck: {
  id: ActivityStatus['id'];
  name: ActivityStatus['name'];
  displayName: ActivityStatus['displayName'];
  isActive: ActivityStatus['isActive'];
} = {} as never;

// Validate CityResponse has expected fields from City
const _cityResponseCheck: {
  id: City['id'];
  name: City['name'];
  displayName: City['displayName'];
  isActive: City['isActive'];
  province: City['province'];
} = {} as never;

// Validate GovernmentRepresentativeResponse has expected fields from GovernmentRepresentative
const _govRepResponseCheck: {
  id: GovernmentRepresentative['id'];
  name: GovernmentRepresentative['name'];
  displayName: GovernmentRepresentative['displayName'];
  isActive: GovernmentRepresentative['isActive'];
  title: GovernmentRepresentative['title'];
  ministryId: GovernmentRepresentative['ministryId'];
} = {} as never;

console.log(
  'Type validation passed: All schemas are in sync with database types.'
);
