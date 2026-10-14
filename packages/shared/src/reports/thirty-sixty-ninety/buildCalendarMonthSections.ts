import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
} from '../../datetime/calendar';
import { formatCalendarMonthYear } from '../../datetime/format';
import {
  isCalendarDateString,
  toCalendarDateString,
  type CalendarDateString,
} from '../../datetime/types';

export interface CalendarMonthSection {
  id: string;
  name: string;
  order: number;
  dateRange: { start: CalendarDateString; end: CalendarDateString };
}

export interface CalendarMonthDateRange {
  start: CalendarDateString;
  end: CalendarDateString;
}

function toCalendarDate(value: string): CalendarDateString {
  if (isCalendarDateString(value)) return value;
  const parsed = toCalendarDateString(value);
  if (parsed == null) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return parsed;
}

/** First day of the calendar month containing `date`. */
export function firstDayOfCalendarMonth(
  date: CalendarDateString
): CalendarDateString {
  return `${date.slice(0, 7)}-01` as CalendarDateString;
}

/** Last day of the calendar month containing `date`. */
export function lastDayOfCalendarMonth(
  date: CalendarDateString
): CalendarDateString {
  const firstDay = firstDayOfCalendarMonth(date);
  const nextMonthFirstDay = addCalendarMonths(firstDay, 1);
  return addCalendarDays(nextMonthFirstDay, -1);
}

/** Add whole calendar months; result is always the first day of the target month. */
export function addCalendarMonths(
  firstDayOfMonth: CalendarDateString,
  months: number
): CalendarDateString {
  const [y, m] = firstDayOfMonth.split('-').map(Number) as [number, number];
  const totalMonths = y * 12 + (m - 1) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}-01` as CalendarDateString;
}

/** UI tab labels for 30/60/90 report quick picks (each maps to calendar months). */
export type ThirtySixtyNinetyTabDayCount = 30 | 60 | 90;

/** @deprecated Use {@link ThirtySixtyNinetyTabDayCount}. */
export type ThirtySixtyNinetyDayCount = ThirtySixtyNinetyTabDayCount;

export const THIRTY_SIXTY_NINETY_TAB_DAY_COUNTS = [30, 60, 90] as const;

/** @deprecated Use {@link THIRTY_SIXTY_NINETY_TAB_DAY_COUNTS}. */
export const THIRTY_SIXTY_NINETY_DAY_COUNTS =
  THIRTY_SIXTY_NINETY_TAB_DAY_COUNTS;

export const DEFAULT_THIRTY_SIXTY_NINETY_TAB_DAY_COUNT = 60 as const;

/** Maps UI tab labels to full calendar-month counts (30→1, 60→2, 90→3). */
export const THIRTY_SIXTY_NINETY_TAB_TO_MONTH_COUNT: Record<
  ThirtySixtyNinetyTabDayCount,
  number
> = {
  30: 1,
  60: 2,
  90: 3,
};

export function monthCountForThirtySixtyNinetyTab(
  tabDayCount: ThirtySixtyNinetyTabDayCount
): number {
  return THIRTY_SIXTY_NINETY_TAB_TO_MONTH_COUNT[tabDayCount];
}

/**
 * Preset window: `monthCount` full calendar months starting from the first day
 * of the Pacific month containing `pacificToday`.
 */
export function thirtySixtyNinetyDateRangeFromPacificDate(
  monthCount: number,
  pacificToday: CalendarDateString
): CalendarMonthDateRange {
  const start = firstDayOfCalendarMonth(pacificToday);
  const endMonthFirstDay = addCalendarMonths(start, monthCount - 1);
  return {
    start,
    end: lastDayOfCalendarMonth(endMonthFirstDay),
  };
}

/**
 * Resolves a 30/60/90 UI tab to a calendar-month preset anchored on the
 * Pacific month containing `pacificToday`.
 */
export function thirtySixtyNinetyTabDateRangeFromPacificDate(
  tabDayCount: ThirtySixtyNinetyTabDayCount,
  pacificToday: CalendarDateString
): CalendarMonthDateRange {
  return thirtySixtyNinetyDateRangeFromPacificDate(
    monthCountForThirtySixtyNinetyTab(tabDayCount),
    pacificToday
  );
}

/**
 * @deprecated Prefer {@link thirtySixtyNinetyTabDateRangeFromPacificDate}.
 * Inclusive-day presets from month start; superseded by calendar-month tabs.
 */
export function thirtySixtyNinetyDayDateRangeFromPacificDate(
  dayCount: ThirtySixtyNinetyTabDayCount,
  pacificToday: CalendarDateString
): CalendarMonthDateRange {
  const start = firstDayOfCalendarMonth(pacificToday);
  return {
    start,
    end: addCalendarDays(start, dayCount - 1),
  };
}

/** Default report window: `monthCount` full calendar months from month start. */
export function defaultThirtySixtyNinetyDateRange(
  monthCount = monthCountForThirtySixtyNinetyTab(
    DEFAULT_THIRTY_SIXTY_NINETY_TAB_DAY_COUNT
  ),
  now: Date = new Date()
): CalendarMonthDateRange {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  return thirtySixtyNinetyDateRangeFromPacificDate(monthCount, today);
}

/** Default report window for the active 30/60/90 tab (60 → two calendar months). */
export function defaultThirtySixtyNinetyTabDateRange(
  tabDayCount: ThirtySixtyNinetyTabDayCount = DEFAULT_THIRTY_SIXTY_NINETY_TAB_DAY_COUNT,
  now: Date = new Date()
): CalendarMonthDateRange {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  return thirtySixtyNinetyTabDateRangeFromPacificDate(tabDayCount, today);
}

/**
 * @deprecated Prefer {@link defaultThirtySixtyNinetyTabDateRange}.
 * Inclusive-day default from month start.
 */
export function defaultThirtySixtyNinetyDayDateRange(
  dayCount: ThirtySixtyNinetyTabDayCount = DEFAULT_THIRTY_SIXTY_NINETY_TAB_DAY_COUNT,
  now: Date = new Date()
): CalendarMonthDateRange {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  return thirtySixtyNinetyDayDateRangeFromPacificDate(dayCount, today);
}

/**
 * Builds ordered month sections between `startDate` and `endDate` (inclusive).
 * Each section spans one full calendar month clipped to the overall window.
 */
export function buildCalendarMonthSections(options: {
  startDate: CalendarDateString | string;
  endDate: CalendarDateString | string;
}): CalendarMonthSection[] {
  const startDate = toCalendarDate(options.startDate);
  const endDate = toCalendarDate(options.endDate);
  if (startDate > endDate) return [];

  const sections: CalendarMonthSection[] = [];
  let cursor = firstDayOfCalendarMonth(startDate);
  const endMonthFirstDay = firstDayOfCalendarMonth(endDate);
  let order = 1;

  while (cursor <= endMonthFirstDay) {
    const monthStart = cursor;
    const monthEnd = lastDayOfCalendarMonth(cursor);
    sections.push({
      id: cursor.slice(0, 7),
      name: formatCalendarMonthYear(cursor),
      order,
      dateRange: {
        start: monthStart < startDate ? startDate : monthStart,
        end: monthEnd > endDate ? endDate : monthEnd,
      },
    });
    order += 1;
    cursor = addCalendarMonths(cursor, 1);
  }

  return sections;
}
