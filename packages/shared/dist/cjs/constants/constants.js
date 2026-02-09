"use strict";
/**
 * Consolidated Constants
 *
 * All shared constants, enums, and default values in one place.
 * This file consolidates constants from multiple files for easier maintenance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VISIBILITY = exports.DEFAULT_LOOK_AHEAD_SECTION = exports.DEFAULT_LOOK_AHEAD_STATUS = exports.DEFAULT_STATUS = exports.DYNAMIC_LOOKUP_CACHE_MS = exports.DYNAMIC_LOOKUP_CACHE_SECONDS = exports.REFERENCE_LOOKUP_CACHE_MS = exports.REFERENCE_LOOKUP_CACHE_SECONDS = exports.DEFAULT_ACTIVITY_STATUS = exports.ACTIVITY_STATUS = exports.REPRESENTATIVE_TYPE = exports.CALENDAR_VISIBILITY = exports.LOOK_AHEAD_SECTION = exports.LOOK_AHEAD_STATUS = exports.VISIBILITY = void 0;
// ============================================================================
// Common Enum Constants
// ============================================================================
/**
 * Visibility Level - Controls access visibility for entities
 * Used in activities, categories, pods, reports
 */
exports.VISIBILITY = ['global', 'team'];
// ============================================================================
// Activity Enum Constants
// ============================================================================
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
/**
 * Activity Status - Status of activity entries
 * Used in activityStatusId field
 * Values match the 'name' field in activity_statuses table
 */
exports.ACTIVITY_STATUS = [
    'new',
    'queued',
    'reviewed',
    'changed',
    'paused',
    'deleted',
];
/**
 * Default activity status for new entries
 */
exports.DEFAULT_ACTIVITY_STATUS = 'new';
// ============================================================================
// Cache Duration Constants
// ============================================================================
/**
 * Reference lookups (categories, tags, statuses, organizations, etc.)
 * These change infrequently and are safe to cache longer.
 */
exports.REFERENCE_LOOKUP_CACHE_SECONDS = 3600; // 1 hour
exports.REFERENCE_LOOKUP_CACHE_MS = exports.REFERENCE_LOOKUP_CACHE_SECONDS * 1000; // 3600000 ms
/**
 * Dynamic lookups (activities)
 * Activities are created/updated frequently, so shorter cache is appropriate.
 */
exports.DYNAMIC_LOOKUP_CACHE_SECONDS = 300; // 5 minutes
exports.DYNAMIC_LOOKUP_CACHE_MS = exports.DYNAMIC_LOOKUP_CACHE_SECONDS * 1000; // 300000 ms
// ============================================================================
// Default Values Constants
// ============================================================================
/**
 * Default status value when status is unknown or not available
 */
exports.DEFAULT_STATUS = 'unknown';
/**
 * Default look ahead status
 */
exports.DEFAULT_LOOK_AHEAD_STATUS = 'none';
/**
 * Default look ahead section
 */
exports.DEFAULT_LOOK_AHEAD_SECTION = 'events';
/**
 * Default visibility level
 */
exports.DEFAULT_VISIBILITY = 'global';
