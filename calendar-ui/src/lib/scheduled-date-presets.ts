import { addDays, format, startOfDay, subDays } from 'date-fns';

/**
 * Preset anchor is always interpreted at host-local start-of-day. This is
 * intentional for scheduled-date presets, which are user-driven inputs in a
 * browser that already shows host-local "today". For date strings that need
 * corp-Pacific semantics (audit instants, scheduled-job math), use the
 * helpers in `@corpcal/shared/datetime` instead.
 *
 * See `docs/DATE_AND_TIMEZONE.md`.
 */
export interface ScheduledDatePreset {
  label: string;
  toIsoDate: (anchor: Date) => string;
}

/**
 * Parse `YYYY-MM-DD` for calendar math without UTC shift, by anchoring at
 * host-local noon. Pair with `format(d, 'yyyy-MM-dd')` from `date-fns` so
 * round-trips through this helper preserve the calendar day for any host TZ.
 */
export function parseIsoDateLocal(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

/**
 * Host-local start of today; used as the preset anchor for scheduled-date
 * presets ("Today", "7 days out"). Browser users in BC are in Pacific so
 * this matches the corp Pacific business day; remote viewers see their local
 * day, which is the right UX for picker presets.
 */
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
    label: '30 days ago',
    toIsoDate: (anchor) =>
      format(subDays(startOfDay(anchor), 30), 'yyyy-MM-dd'),
  },
  {
    label: '90 days ago',
    toIsoDate: (anchor) =>
      format(subDays(startOfDay(anchor), 90), 'yyyy-MM-dd'),
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
    label: '30 days out',
    toIsoDate: (anchor) =>
      format(addDays(startOfDay(anchor), 30), 'yyyy-MM-dd'),
  },
  {
    label: '90 days out',
    toIsoDate: (anchor) =>
      format(addDays(startOfDay(anchor), 90), 'yyyy-MM-dd'),
  },
];

/** Subset for compact form rows (pitch / optional shorter lists). */
export const PRESETS_FUTURE_SHORT: ScheduledDatePreset[] = [
  PRESETS_FUTURE_FROM_ANCHOR[0],
  PRESETS_FUTURE_FROM_ANCHOR[1],
  PRESETS_FUTURE_FROM_ANCHOR[3],
  PRESETS_FUTURE_FROM_ANCHOR[4],
];
