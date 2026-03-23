import {
  addDays,
  addMonths,
  format,
  startOfDay,
  subDays,
  subMonths,
} from 'date-fns';

/** Preset anchor is always interpreted at local start-of-day. */
export interface ScheduledDatePreset {
  label: string;
  toIsoDate: (anchor: Date) => string;
}

/**
 * Parse yyyy-MM-dd for calendar math without UTC shift (local noon).
 */
export function parseIsoDateLocal(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

/** Local start of today; use as `getPresetAnchor` for scheduled-date presets. */
export function getPresetAnchorToday(): Date {
  return startOfDay(new Date());
}

/** Past-oriented from anchor (filter start, form start when anchor = today). */
export const PRESETS_PAST_FROM_ANCHOR: ScheduledDatePreset[] = [
  {
    label: 'Today',
    toIsoDate: (anchor) => format(startOfDay(anchor), 'yyyy-MM-dd'),
  },
  {
    label: '7 days ago',
    toIsoDate: (anchor) => format(subDays(startOfDay(anchor), 7), 'yyyy-MM-dd'),
  },
  {
    label: '14 days ago',
    toIsoDate: (anchor) =>
      format(subDays(startOfDay(anchor), 14), 'yyyy-MM-dd'),
  },
  {
    label: '1 month ago',
    toIsoDate: (anchor) =>
      format(subMonths(startOfDay(anchor), 1), 'yyyy-MM-dd'),
  },
  {
    label: '3 months ago',
    toIsoDate: (anchor) =>
      format(subMonths(startOfDay(anchor), 3), 'yyyy-MM-dd'),
  },
];

/** Future-oriented from anchor (filter end; form end when anchor = start or today). */
export const PRESETS_FUTURE_FROM_ANCHOR: ScheduledDatePreset[] = [
  {
    label: 'Today',
    toIsoDate: (anchor) => format(startOfDay(anchor), 'yyyy-MM-dd'),
  },
  {
    label: '7 days out',
    toIsoDate: (anchor) => format(addDays(startOfDay(anchor), 7), 'yyyy-MM-dd'),
  },
  {
    label: '14 days out',
    toIsoDate: (anchor) =>
      format(addDays(startOfDay(anchor), 14), 'yyyy-MM-dd'),
  },
  {
    label: '1 month out',
    toIsoDate: (anchor) =>
      format(addMonths(startOfDay(anchor), 1), 'yyyy-MM-dd'),
  },
  {
    label: '3 months out',
    toIsoDate: (anchor) =>
      format(addMonths(startOfDay(anchor), 3), 'yyyy-MM-dd'),
  },
];

/** Subset for compact form rows (pitch / optional shorter lists). */
export const PRESETS_FUTURE_SHORT: ScheduledDatePreset[] = [
  PRESETS_FUTURE_FROM_ANCHOR[0],
  PRESETS_FUTURE_FROM_ANCHOR[1],
  PRESETS_FUTURE_FROM_ANCHOR[3],
  PRESETS_FUTURE_FROM_ANCHOR[4],
];

/**
 * @deprecated Use PRESETS_PAST_FROM_ANCHOR with getPresetAnchor = today.
 * Kept for any external imports expecting getStart().
 */
export const START_PRESETS = PRESETS_PAST_FROM_ANCHOR.map((p) => ({
  label: p.label,
  getStart: () => p.toIsoDate(startOfDay(new Date())),
}));

/**
 * @deprecated Use PRESETS_FUTURE_FROM_ANCHOR with getPresetAnchor = today.
 */
export const END_PRESETS = PRESETS_FUTURE_FROM_ANCHOR.map((p) => ({
  label: p.label,
  getEnd: () => p.toIsoDate(startOfDay(new Date())),
}));
