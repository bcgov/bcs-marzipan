import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
  type CalendarDateString,
} from '../../datetime';

/** Curated Look Ahead page presets (distinct from Reports legacy quick picks). */
export type LookAheadCuratedPresetId =
  'today' | 'published_range' | 'inclusive7' | 'inclusive14' | 'inclusive30';

export const LOOK_AHEAD_CURATED_PRESET_IDS = [
  'today',
  'published_range',
  'inclusive7',
  'inclusive14',
  'inclusive30',
] as const satisfies readonly LookAheadCuratedPresetId[];

export const DEFAULT_LOOK_AHEAD_CURATED_PRESET: LookAheadCuratedPresetId =
  'today';

export interface LookAheadCuratedDateRange {
  start: CalendarDateString;
  end: CalendarDateString;
}

export interface LookAheadCuratedPresetMeta {
  id: LookAheadCuratedPresetId;
  label: string;
  /** When true, only shown if user has reports.published_look_ahead_range. */
  requiresPublishedRangePermission?: boolean;
}

export const LOOK_AHEAD_CURATED_PRESET_META: readonly LookAheadCuratedPresetMeta[] =
  [
    {
      id: 'today',
      label: 'Today',
    },
    {
      id: 'published_range',
      label: 'Next 7 days',
      requiresPublishedRangePermission: true,
    },
    {
      id: 'inclusive7',
      label: '7 days',
    },
    {
      id: 'inclusive14',
      label: '14 days',
    },
    {
      id: 'inclusive30',
      label: '30 days',
    },
  ];

function pacificTodayFromInstant(now: Date): CalendarDateString {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  return today;
}

function curatedPresetRangeFromPacificToday(
  preset: LookAheadCuratedPresetId,
  pacificToday: CalendarDateString
): LookAheadCuratedDateRange {
  switch (preset) {
    case 'today':
      return { start: pacificToday, end: pacificToday };
    case 'published_range': {
      const start = addCalendarDays(pacificToday, 1);
      return { start, end: addCalendarDays(start, 6) };
    }
    case 'inclusive7':
      return {
        start: pacificToday,
        end: addCalendarDays(pacificToday, 6),
      };
    case 'inclusive14':
      return {
        start: pacificToday,
        end: addCalendarDays(pacificToday, 13),
      };
    case 'inclusive30':
      return {
        start: pacificToday,
        end: addCalendarDays(pacificToday, 29),
      };
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

/**
 * Resolve a curated preset to a Pacific calendar date range for `now`.
 */
export function lookAheadCuratedPresetRange(
  preset: LookAheadCuratedPresetId,
  now: Date = new Date()
): LookAheadCuratedDateRange {
  return curatedPresetRangeFromPacificToday(
    preset,
    pacificTodayFromInstant(now)
  );
}

/** Returns matching curated preset for a range, or null for custom windows. */
export function lookAheadCuratedPresetFromRange(
  startDate: string,
  endDate: string,
  pacificToday: CalendarDateString
): LookAheadCuratedPresetId | null {
  if (!startDate || !endDate) return null;

  for (const id of LOOK_AHEAD_CURATED_PRESET_IDS) {
    const preset = curatedPresetRangeFromPacificToday(id, pacificToday);
    if (preset.start === startDate && preset.end === endDate) {
      return id;
    }
  }

  return null;
}

export function defaultLookAheadCuratedDateRange(
  now: Date = new Date()
): LookAheadCuratedDateRange {
  return lookAheadCuratedPresetRange(DEFAULT_LOOK_AHEAD_CURATED_PRESET, now);
}
