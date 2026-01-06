import {
  LOOK_AHEAD_STATUS,
  LOOK_AHEAD_SECTION,
  CALENDAR_VISIBILITY,
} from '@corpcal/shared/constants/activity-enums';

/**
 * Get display label for Look Ahead Status value
 */
function getLookAheadStatusLabel(value: string): string {
  switch (value) {
    case 'none':
      return 'None';
    case 'new':
      return 'New';
    case 'changed':
      return 'Changed';
    default:
      return value;
  }
}

/**
 * Get display label for Look Ahead Section value
 */
function getLookAheadSectionLabel(value: string): string {
  switch (value) {
    case 'events':
      return 'Events';
    case 'issues':
      return 'Issues and reports';
    case 'news':
      return 'In the news';
    case 'awareness':
      return 'Awareness';
    default:
      return value;
  }
}

/**
 * Get display label for Calendar Visibility value
 */
function getCalendarVisibilityLabel(value: string): string {
  switch (value) {
    case 'visible':
      return 'Visible';
    case 'partial':
      return 'Partial';
    case 'hidden':
      return 'Hidden';
    default:
      return value;
  }
}

/**
 * Form option labels for Look Ahead Status
 */
export const lookAheadStatusOptions = LOOK_AHEAD_STATUS.map((value) => ({
  value,
  label: getLookAheadStatusLabel(value),
}));

/**
 * Form option labels for Look Ahead Section
 */
export const lookAheadSectionOptions = LOOK_AHEAD_SECTION.map((value) => ({
  value,
  label: getLookAheadSectionLabel(value),
}));

/**
 * Form option labels for Calendar Visibility
 */
export const calendarVisibilityOptions = CALENDAR_VISIBILITY.map((value) => ({
  value,
  label: getCalendarVisibilityLabel(value),
}));
