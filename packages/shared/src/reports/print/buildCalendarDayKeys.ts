import { addCalendarDays } from '../../datetime/calendar';
import {
  isCalendarDateString,
  toCalendarDateString,
  type CalendarDateString,
} from '../../datetime/types';

function toCalendarDate(value: string): CalendarDateString {
  if (isCalendarDateString(value)) return value;
  const parsed = toCalendarDateString(value);
  if (parsed == null) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return parsed;
}

/**
 * Ordered inclusive calendar-day keys between `startDate` and `endDate`.
 */
export function buildCalendarDayKeys(options: {
  startDate: CalendarDateString | string;
  endDate: CalendarDateString | string;
}): CalendarDateString[] {
  const startDate = toCalendarDate(options.startDate);
  const endDate = toCalendarDate(options.endDate);
  if (startDate > endDate) return [];

  const keys: CalendarDateString[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    keys.push(cursor);
    if (cursor === endDate) break;
    cursor = addCalendarDays(cursor, 1);
  }
  return keys;
}
