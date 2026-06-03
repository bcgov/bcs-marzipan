/**
 * How consecutive empty days render in sections with `printPerDayColumnHeaderRepeat`.
 * No UI yet — change this constant to switch preview/PDF behaviour.
 */
export type PrintPerDayEmptyDayDisplayMode = 'individual' | 'grouped';

/** Default: one heading + table for each run of consecutive empty days. */
export const PRINT_PER_DAY_EMPTY_DAY_DISPLAY_MODE: PrintPerDayEmptyDayDisplayMode =
  'grouped';
