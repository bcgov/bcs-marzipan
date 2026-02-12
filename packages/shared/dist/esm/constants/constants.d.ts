/**
 * Consolidated Constants
 *
 * All shared constants, enums, and default values in one place.
 * This file consolidates constants from multiple files for easier maintenance.
 */
/**
 * Visibility Level - Controls access visibility for entities
 * Used in activities, categories, pods, reports
 */
export declare const VISIBILITY: readonly ["global", "team"];
export type Visibility = (typeof VISIBILITY)[number];
/**
 * Look Ahead Status - Status of activity in look-ahead reports
 */
export declare const LOOK_AHEAD_STATUS: readonly ["none", "new", "changed"];
export type LookAheadStatus = (typeof LOOK_AHEAD_STATUS)[number];
/**
 * Look Ahead Section - Section category for look-ahead reports
 */
export declare const LOOK_AHEAD_SECTION: readonly ["events", "issues", "news", "awareness"];
export type LookAheadSection = (typeof LOOK_AHEAD_SECTION)[number];
/**
 * Calendar Visibility - Visibility level of activity on calendar
 */
export declare const CALENDAR_VISIBILITY: readonly ["visible", "partial", "hidden"];
export type CalendarVisibility = (typeof CALENDAR_VISIBILITY)[number];
/**
 * Representative Type - Type of government representative
 * Used in government_representatives table
 */
export declare const REPRESENTATIVE_TYPE: readonly ["premier", "minister", "cabinet_member", "mla", "other"];
export type RepresentativeType = (typeof REPRESENTATIVE_TYPE)[number];
/**
 * Activity Status - Status of activity entries
 * Used in activityStatusId field
 * Values match the 'name' field in activity_statuses table
 */
export declare const ACTIVITY_STATUS: readonly ["new", "queued", "reviewed", "changed", "paused", "deleted"];
export type ActivityStatusName = (typeof ACTIVITY_STATUS)[number];
/**
 * Default activity status for new entries
 */
export declare const DEFAULT_ACTIVITY_STATUS: ActivityStatusName;
/**
 * Helper type for nullable enum values
 */
export type NullableEnum<T extends readonly string[]> = T[number] | null;
/**
 * Reference lookups (categories, tags, statuses, organizations, etc.)
 * These change infrequently and are safe to cache longer.
 */
export declare const REFERENCE_LOOKUP_CACHE_SECONDS = 3600;
export declare const REFERENCE_LOOKUP_CACHE_MS: number;
/**
 * Dynamic lookups (activities)
 * Activities are created/updated frequently, so shorter cache is appropriate.
 */
export declare const DYNAMIC_LOOKUP_CACHE_SECONDS = 300;
export declare const DYNAMIC_LOOKUP_CACHE_MS: number;
/**
 * Default status value when status is unknown or not available
 */
export declare const DEFAULT_STATUS: "unknown";
/**
 * Default look ahead status
 */
export declare const DEFAULT_LOOK_AHEAD_STATUS: "none";
/**
 * Default look ahead section
 */
export declare const DEFAULT_LOOK_AHEAD_SECTION: "events";
/**
 * Default visibility level
 */
export declare const DEFAULT_VISIBILITY: "global";
//# sourceMappingURL=constants.d.ts.map