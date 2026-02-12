/**
 * Activity Enum Constants
 *
 * Centralized definitions for activity-related enum values.
 * These constants ensure consistency across schemas, DTOs, and UI components.
 *
 * For user-editable fields that may need to accept custom values,
 * see the discussion in the comments below.
 */
/**
 * Attending Status - Representative attendance status
 * Used in representativesAttending array
 */
export declare const ATTENDING_STATUS: readonly ["requested", "declined", "confirmed"];
export type AttendingStatus = (typeof ATTENDING_STATUS)[number];
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
 * Helper type for nullable enum values
 */
export type NullableEnum<T extends readonly string[]> = T[number] | null;
//# sourceMappingURL=activity-enums.d.ts.map