"use strict";
/**
 * Activity Enum Constants
 *
 * Centralized definitions for activity-related enum values.
 * These constants ensure consistency across schemas, DTOs, and UI components.
 *
 * For user-editable fields that may need to accept custom values,
 * see the discussion in the comments below.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPRESENTATIVE_TYPE = exports.CALENDAR_VISIBILITY = exports.LOOK_AHEAD_SECTION = exports.LOOK_AHEAD_STATUS = exports.ATTENDING_STATUS = void 0;
/**
 * Attending Status - Representative attendance status
 * Used in representativesAttending array
 */
exports.ATTENDING_STATUS = ['requested', 'declined', 'confirmed'];
/**
 * Look Ahead Status - Status of activity in look-ahead reports
 */
exports.LOOK_AHEAD_STATUS = ['none', 'new', 'changed'];
/**
 * Look Ahead Section - Section category for look-ahead reports
 */
exports.LOOK_AHEAD_SECTION = [
    'events',
    'issues',
    'news',
    'awareness',
];
/**
 * Calendar Visibility - Visibility level of activity on calendar
 */
exports.CALENDAR_VISIBILITY = ['visible', 'partial', 'hidden'];
/**
 * Representative Type - Type of government representative
 * Used in government_representatives table
 */
exports.REPRESENTATIVE_TYPE = [
    'premier',
    'minister',
    'cabinet_member',
    'mla',
    'other',
];
