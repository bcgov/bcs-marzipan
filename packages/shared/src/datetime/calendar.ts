/**
 * Calendar-date arithmetic and bucketing helpers.
 *
 * These never derive calendar values from host-local `Date` getters
 * (`getFullYear`, `getMonth`, `getDate`); they either operate on
 * `CalendarDateString` directly or use UTC math + the fixed Pacific offset
 * so output is the same under `TZ=UTC` and `TZ=America/Los_Angeles`.
 */

import { CORP_PACIFIC_OFFSET_MS } from './constants';
import {
  isCalendarDateString,
  toCalendarDateString,
  type CalendarDateString,
} from './types';

/**
 * Add (or subtract) whole calendar days to a `YYYY-MM-DD` string.
 *
 * Does not depend on host TZ; uses `Date.UTC` parts as a portable calendar
 * arithmetic primitive.
 */
export function addCalendarDays(
  isoDate: CalendarDateString | string,
  days: number
): CalendarDateString {
  const validated = isCalendarDateString(isoDate)
    ? isoDate
    : toCalendarDateString(isoDate);
  const [y, m, d] = validated.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const utcMs = Date.UTC(y, m - 1, d + days);
  const next = new Date(utcMs);
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}` as CalendarDateString;
}

/**
 * Pacific calendar date (`YYYY-MM-DD`) for a UTC instant.
 *
 * Accepts an ISO string, a `Date`, or a UTC milliseconds number. Returns
 * `null` for unparseable input.
 */
export function pacificCalendarDateFromInstant(
  instant: string | number | Date | null | undefined
): CalendarDateString | null {
  const utcMs = toUtcMs(instant);
  if (utcMs === null) return null;
  const shifted = new Date(utcMs - CORP_PACIFIC_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as CalendarDateString;
}

/**
 * Day-bucket key for grouping activities. Accepts either a `CalendarDateString`
 * (passed through unchanged) or an instant (formatted in Pacific).
 *
 * This replaces the legacy `dateKeyLocal` helper in print code.
 */
export function pacificDayKey(
  value: CalendarDateString | string | Date | number | null | undefined
): CalendarDateString | null {
  if (value == null) return null;
  if (typeof value === 'string' && isCalendarDateString(value)) return value;
  return pacificCalendarDateFromInstant(value);
}

/**
 * Combine a `CalendarDateString` and `CivilTimeString` into a UTC instant
 * interpreted in the corp Pacific zone (fixed UTC&minus;7).
 *
 * Returns `null` when either input is missing.
 */
export function pacificCivilToInstantMs(
  date: CalendarDateString | string | null | undefined,
  time: string | null | undefined
): number | null {
  if (date == null || time == null) return null;
  if (!isCalendarDateString(date)) return null;
  const trimmed = time.length === 5 ? `${time}:00` : time;
  const iso = `${date}T${trimmed}-07:00`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

function toUtcMs(
  instant: string | number | Date | null | undefined
): number | null {
  if (instant == null) return null;
  if (instant instanceof Date) {
    const ms = instant.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof instant === 'number') {
    return Number.isFinite(instant) ? instant : null;
  }
  const ms = Date.parse(instant);
  return Number.isNaN(ms) ? null : ms;
}
