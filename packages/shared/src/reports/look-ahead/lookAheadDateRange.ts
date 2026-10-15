import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
  type CalendarDateString,
} from '../../datetime';

/** Forward window lengths for +7 / +14 quick picks (exclude today). */
export type LookAheadForwardDayCount = 7 | 14;

export type LookAheadQuickPick = 'today' | LookAheadForwardDayCount;

export const LOOK_AHEAD_QUICK_PICKS = [
  'today',
  7,
  14,
] as const satisfies readonly LookAheadQuickPick[];

export const DEFAULT_LOOK_AHEAD_QUICK_PICK: LookAheadQuickPick = 'today';

export interface LookAheadDateRange {
  start: CalendarDateString;
  end: CalendarDateString;
}

function pacificTodayFromInstant(now: Date): CalendarDateString {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  return today;
}

function lookAheadQuickPickRangeFromPacificToday(
  pick: LookAheadQuickPick,
  pacificToday: CalendarDateString
): LookAheadDateRange {
  if (pick === 'today') {
    return { start: pacificToday, end: pacificToday };
  }
  const start = addCalendarDays(pacificToday, 1);
  return {
    start,
    end: addCalendarDays(start, pick - 1),
  };
}

/** Pacific calendar day only (Look Ahead / Exec "Today" quick pick). */
export function lookAheadTodayRange(
  now: Date = new Date()
): LookAheadDateRange {
  return lookAheadQuickPickRangeFromPacificToday(
    'today',
    pacificTodayFromInstant(now)
  );
}

/**
 * Look Ahead / Exec forward preset: `dayCount` inclusive days starting
 * tomorrow (Pacific), excluding today.
 */
export function lookAheadDateRangeFromTomorrow(
  dayCount: LookAheadForwardDayCount,
  now: Date = new Date()
): LookAheadDateRange {
  return lookAheadQuickPickRangeFromPacificToday(
    dayCount,
    pacificTodayFromInstant(now)
  );
}

export function lookAheadQuickPickRange(
  pick: LookAheadQuickPick,
  now: Date = new Date()
): LookAheadDateRange {
  return lookAheadQuickPickRangeFromPacificToday(
    pick,
    pacificTodayFromInstant(now)
  );
}

/** Returns the quick pick matching `start`/`end` for the given Pacific today, if any. */
export function lookAheadQuickPickFromRange(
  startDate: string,
  endDate: string,
  pacificToday: CalendarDateString
): LookAheadQuickPick | null {
  if (!startDate || !endDate) return null;
  for (const pick of LOOK_AHEAD_QUICK_PICKS) {
    const preset = lookAheadQuickPickRangeFromPacificToday(pick, pacificToday);
    if (preset.start === startDate && preset.end === endDate) {
      return pick;
    }
  }
  return null;
}

/** Default look-ahead window: Pacific today only. */
export function defaultLookAheadDateRange(
  now: Date = new Date()
): LookAheadDateRange {
  return lookAheadTodayRange(now);
}
