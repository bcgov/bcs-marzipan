/**
 * Consolidated Constants
 *
 * All shared constants, enums, and default values in one place.
 * This file consolidates constants from multiple files for easier maintenance.
 */

// ============================================================================
// Common Enum Constants
// ============================================================================

/**
 * Visibility Level - Controls access visibility for entities
 * Used in activities, categories, pods, reports
 */
export const VISIBILITY = ['global', 'team'] as const;
export type Visibility = (typeof VISIBILITY)[number];

// ============================================================================
// Activity Enum Constants
// ============================================================================

/**
 * Look Ahead Status - Status of activity in look-ahead reports
 */
export const LOOK_AHEAD_STATUS = ['none', 'new', 'changed'] as const;
export type LookAheadStatus = (typeof LOOK_AHEAD_STATUS)[number];

/**
 * Calendar Visibility - Visibility level of activity on calendar
 */
export const CALENDAR_VISIBILITY = ['visible', 'partial', 'hidden'] as const;
export type CalendarVisibility = (typeof CALENDAR_VISIBILITY)[number];

/**
 * Representative Type - Type of government representative
 * Used in government_representatives table
 */
export const REPRESENTATIVE_TYPE = [
  'premier',
  'minister',
  'cabinet_member',
  'mla',
  'other',
] as const;
export type RepresentativeType = (typeof REPRESENTATIVE_TYPE)[number];

/**
 * Activity Status - Status of activity entries
 * Used in activityStatusId field
 * Values match the 'name' field in activity_statuses table
 */
export const ACTIVITY_STATUS = [
  'new',
  'reviewed',
  'changed',
  'deleted',
  'delete_requested',
  'completed',
  'on_hold',
] as const;
export type ActivityStatusName = (typeof ACTIVITY_STATUS)[number];

/**
 * Normalize activity status for comparison. Accepts API/lookup display strings
 * (e.g. "New", "Delete requested") or internal names (e.g. "new", "delete_requested").
 * Matches calendar-ui badge normalization for consistent behavior across client and server.
 */
export function normalizeActivityStatusLabel(status: string): string {
  return status.toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Default activity status for new entries
 */
export const DEFAULT_ACTIVITY_STATUS: ActivityStatusName = 'new';

/**
 * Configurable fallback segment for the team-abbreviation part of activity `displayId`
 * when normalization yields an empty string (and no ministry abbreviation applies).
 *
 * **Single source of truth:** Change the value only here. Do not hardcode this string in
 * tests for fallback behavior—import `TEAM_PREFIX_FALLBACK`, or assert using
 * `normalizeTeamAbbreviationForActivityDisplayId` and `buildActivityDisplayId` so specs
 * stay aligned automatically. Server logic delegates through those helpers from
 * `ActivityUtilsService`.
 */
export const TEAM_PREFIX_FALLBACK = 'TEAM' as const;

/**
 * Strips whitespace, removes internal spaces, uppercases, then returns
 * `TEAM_PREFIX_FALLBACK` if the result is empty. Used for the team leg of activity
 * `displayId` when the lead has no ministry (or ministry abbreviation is absent).
 */
export function normalizeTeamAbbreviationForActivityDisplayId(
  abbreviation: string | null | undefined
): string {
  const cleaned = (abbreviation ?? '').trim().replace(/\s+/g, '').toUpperCase();
  if (cleaned.length === 0) {
    return TEAM_PREFIX_FALLBACK;
  }
  return cleaned;
}

/**
 * Strips whitespace, removes internal spaces, uppercases. Returns empty string when
 * nothing remains so callers can fall back to the team abbreviation for `displayId`.
 */
export function normalizeMinistryAbbreviationForActivityDisplayId(
  abbreviation: string | null | undefined
): string {
  return (abbreviation ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Numeric segment of `displayId`: full decimal activity id with at least 6 digits
 * (leading zeros for ids below 1,000,000). Larger ids are not truncated, avoiding
 * collisions between ids that share the same last six digits.
 */
export function formatActivityDisplayIdNumericSegment(
  activityId: number
): string {
  return String(activityId).padStart(6, '0');
}

/**
 * Builds `displayId`: `<PREFIX>-<numeric segment>`.
 * Prefix is uppercased and trimmed. The numeric segment follows the same rules as
 * `formatActivityDisplayIdNumericSegment`.
 */
export function buildActivityDisplayId(
  prefix: string,
  activityId: number
): string {
  return `${prefix.toUpperCase().trim()}-${formatActivityDisplayIdNumericSegment(activityId)}`;
}

/**
 * Current version of the reviewedFieldSnapshot JSON shape.
 * Bump when adding/removing tracked fields or changing normalisation rules.
 * On read, snapshots with an older version can be ignored (treated as "no snapshot")
 * until the activity is next marked Reviewed, which rewrites the snapshot at the current version.
 */
export const REVIEW_SNAPSHOT_VERSION = 1;

/**
 * Helper type for nullable enum values
 */
export type NullableEnum<T extends readonly string[]> = T[number] | null;

// ============================================================================
// Cache Duration Constants
// ============================================================================

/**
 * Reference lookups (categories, tags, statuses, organizations, etc.)
 * These change infrequently and are safe to cache longer.
 */
export const REFERENCE_LOOKUP_CACHE_SECONDS = 3600; // 1 hour
export const REFERENCE_LOOKUP_CACHE_MS = REFERENCE_LOOKUP_CACHE_SECONDS * 1000; // 3600000 ms

/**
 * Dynamic lookups (activities)
 * Activities are created/updated frequently, so shorter cache is appropriate.
 */
export const DYNAMIC_LOOKUP_CACHE_SECONDS = 300; // 5 minutes
export const DYNAMIC_LOOKUP_CACHE_MS = DYNAMIC_LOOKUP_CACHE_SECONDS * 1000; // 300000 ms

/**
 * GET /lookups/activity-team-sharing (teams + ministry quick-share).
 * Shorter than reference cache because quick-share data changes when admins edit groups
 * or ministry assignments. Same duration as dynamic lookups.
 */
export const ACTIVITY_TEAM_SHARING_CACHE_SECONDS = DYNAMIC_LOOKUP_CACHE_SECONDS;

// ============================================================================
// Default Values Constants
// ============================================================================

/**
 * Default status value when status is unknown or not available
 */
export const DEFAULT_STATUS = 'unknown' as const;

/**
 * Default look ahead status
 */
export const DEFAULT_LOOK_AHEAD_STATUS = 'none' as const;

/**
 * Default visibility level
 */
export const DEFAULT_VISIBILITY = 'global' as const;

/**
 * Lookup `name` for pitch_required_statuses and translation_required_statuses
 * when defaulting to "Pending review" on activity create.
 */
export const PITCH_TRANSLATION_PENDING_LOOKUP_NAME = 'pending' as const;

/**
 * Lookup `name` for translation_required_statuses when translations are mandatory.
 */
export const TRANSLATION_REQUIRED_LOOKUP_NAME = 'required' as const;

// ============================================================================
// Auth Constants
// ============================================================================

/**
 * Default JWT token expiration time in seconds (12 hours)
 * Used when JWT_EXPIRES_IN environment variable is not set
 */
export const DEFAULT_JWT_EXPIRES_IN = 43200;
