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
 * Look Ahead Section - Section category for look-ahead reports
 */
export const LOOK_AHEAD_SECTION = [
  'events',
  'issues',
  'news',
  'awareness',
] as const;
export type LookAheadSection = (typeof LOOK_AHEAD_SECTION)[number];

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
 * Delay in minutes after activity end before status is set to completed (scheduler job).
 */
export const ACTIVITY_COMPLETED_DELAY_MINUTES = 15;

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
 * Default look ahead section
 */
export const DEFAULT_LOOK_AHEAD_SECTION = 'events' as const;

/**
 * Default visibility level
 */
export const DEFAULT_VISIBILITY = 'global' as const;

/**
 * Lookup `name` for pitch_required_statuses and translation_required_statuses
 * when defaulting to "Pending review" on activity create.
 */
export const PITCH_TRANSLATION_PENDING_LOOKUP_NAME = 'pending' as const;

// ============================================================================
// Auth Constants
// ============================================================================

/**
 * Default JWT token expiration time in seconds (12 hours)
 * Used when JWT_EXPIRES_IN environment variable is not set
 */
export const DEFAULT_JWT_EXPIRES_IN = 43200;
