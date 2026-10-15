import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
  type CalendarDateString,
} from '../../datetime';

export type LookAheadDayCount = 1 | 7 | 14;

export interface LookAheadDateRange {
  start: CalendarDateString;
  end: CalendarDateString;
}

function pacificToday(now: Date): CalendarDateString {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  return today;
}

function pacificTomorrow(now: Date): CalendarDateString {
  return addCalendarDays(pacificToday(now), 1);
}

/**
 * Look Ahead / exec preset: `dayCount` inclusive days starting tomorrow (Pacific).
 */
export function lookAheadDateRangeFromTomorrow(
  dayCount: LookAheadDayCount,
  now: Date = new Date()
): LookAheadDateRange {
  const start = pacificTomorrow(now);
  return {
    start,
    end: addCalendarDays(start, dayCount - 1),
  };
}

/** Default look-ahead window: 7 inclusive days starting today in Pacific. */
export function defaultLookAheadDateRange(
  now: Date = new Date()
): LookAheadDateRange {
  const start = pacificToday(now);
  return {
    start,
    end: addCalendarDays(start, 6),
  };
}
