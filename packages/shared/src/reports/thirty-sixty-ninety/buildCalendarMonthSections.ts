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

/**
 * Default 30/60/90 report window: `monthCount` full calendar months starting
 * from the first day of the current Pacific month.
 */
export function defaultThirtySixtyNinetyDateRange(
  monthCount = 3,
  now: Date = new Date()
): CalendarMonthDateRange {
  const today = pacificCalendarDateFromInstant(now);
  if (today == null) {
    throw new Error('Unable to resolve current Pacific calendar date');
  }
  const start = firstDayOfCalendarMonth(today);
  const endMonthFirstDay = addCalendarMonths(start, monthCount - 1);
  return {
    start,
    end: lastDayOfCalendarMonth(endMonthFirstDay),
  };
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
