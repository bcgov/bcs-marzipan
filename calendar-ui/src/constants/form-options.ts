import { LOOK_AHEAD_STATUS } from '@corpcal/shared/constants/constants';

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
 * Form option labels for Look Ahead Status
 */
export const lookAheadStatusOptions = LOOK_AHEAD_STATUS.map((value) => ({
  value,
  label: getLookAheadStatusLabel(value),
}));

/** RadioGroup value when no look-ahead section is selected (clears DB column). */
export const LOOK_AHEAD_SECTION_NONE_RADIO_VALUE = '';

/** First option for look-ahead section radios — excludes activity from LA/Exec buckets. */
export const lookAheadSectionNoneOption = {
  value: LOOK_AHEAD_SECTION_NONE_RADIO_VALUE,
  label: getLookAheadStatusLabel('none'),
} as const;

/**
 * Look Ahead Section options now live in `useLookAheadSectionRows` (config-driven).
 * Use that hook (and `rowsToSectionOptions` / `getLookAheadSectionLabelFromRows`)
 * instead of importing the old static `lookAheadSectionOptions` from this file.
 */
