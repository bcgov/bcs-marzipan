import {
  LOOK_AHEAD_SECTION,
  LOOK_AHEAD_STATUS,
} from '@corpcal/shared/constants/constants';

/**
 * Get display label for Look Ahead Status value
 */
export function getLookAheadStatusLabel(value: string): string {
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
export function getLookAheadSectionLabel(value: string): string {
  switch (value) {
    case 'events':
      return 'Events';
    case 'issues':
      return 'Issues';
    case 'news':
      return 'In the news';
    case 'awareness':
      return 'Awareness';
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
