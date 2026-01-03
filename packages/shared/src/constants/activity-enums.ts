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
export const ATTENDING_STATUS = ['requested', 'declined', 'confirmed'] as const;
export type AttendingStatus = (typeof ATTENDING_STATUS)[number];

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
 * Helper type for nullable enum values
 */
export type NullableEnum<T extends readonly string[]> = T[number] | null;
