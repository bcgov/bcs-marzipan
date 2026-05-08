/**
 * User-visible date and time formatters that pin every `Intl` call to the
 * corp Pacific timezone (`Etc/GMT+7`, fixed UTC&minus;7).
 *
 * Two distinct families:
 *
 *  - `formatCalendarDate*` accept a `CalendarDateString` (`YYYY-MM-DD`) and
 *    format it without ever building an ambiguous `Date` from the string.
 *
 *  - `formatInstant*` / `formatCivilTime*` accept an `IsoUtcInstantString`,
 *    `Date`, or `CivilTimeString` and use `Intl` with `timeZone:
 *    CORP_PACIFIC_TIME_ZONE` so output is independent of `process.env.TZ`.
 */

import { CORP_PACIFIC_TIME_ZONE } from './constants';
import {
  isCalendarDateString,
  isCivilTimeString,
  type CalendarDateString,
  type CivilTimeString,
} from './types';

/**
 * Anchor a `CalendarDateString` to a UTC instant at midday Pacific so all
 * `Intl` formatting produces the intended calendar day in the Pacific zone.
 * Midday avoids any rounding edge cases on day boundaries.
 */
function calendarDateToAnchorInstant(date: CalendarDateString): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  // Build noon UTC and shift by the Pacific fixed offset so that, when the
  // formatter converts to `Etc/GMT+7`, we land squarely on the requested
  // calendar day at noon Pacific.
  return new Date(Date.UTC(y, m - 1, d, 12 + 7, 0, 0, 0));
}

function pacificDateFormatter(
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: CORP_PACIFIC_TIME_ZONE,
  });
}

const CALENDAR_LONG_FORMATTER = pacificDateFormatter({
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const CALENDAR_COVER_FORMATTER = pacificDateFormatter({
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const CALENDAR_SHORT_FORMATTER = pacificDateFormatter({
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const CALENDAR_LONG_NO_WEEKDAY_FORMATTER = pacificDateFormatter({
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const PACIFIC_TIME_FORMATTER = pacificDateFormatter({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const PACIFIC_WEEKDAY_FORMATTER = pacificDateFormatter({ weekday: 'long' });
const PACIFIC_MONTH_SHORT_FORMATTER = pacificDateFormatter({ month: 'short' });
const PACIFIC_DAY_FORMATTER = pacificDateFormatter({ day: 'numeric' });

/** `MONDAY, APRIL 27, 2026` - day-heading row above grouped activities. */
export function formatCalendarDateHeading(date: CalendarDateString): string {
  return CALENDAR_LONG_FORMATTER.format(
    calendarDateToAnchorInstant(date)
  ).toUpperCase();
}

/** `Mon, Apr 27, 2026` - cover/range strings on print and PDF overlays. */
export function formatCalendarDateCover(date: CalendarDateString): string {
  return CALENDAR_COVER_FORMATTER.format(calendarDateToAnchorInstant(date));
}

/** `Apr 27, 2026` - compact cell. */
export function formatCalendarDateShort(date: CalendarDateString): string {
  return CALENDAR_SHORT_FORMATTER.format(calendarDateToAnchorInstant(date));
}

/** `April 27, 2026` - long phrase without weekday. */
export function formatCalendarDateLong(date: CalendarDateString): string {
  return CALENDAR_LONG_NO_WEEKDAY_FORMATTER.format(
    calendarDateToAnchorInstant(date)
  );
}

/**
 * `9:30 am` - 12-hour, lowercase am/pm. Accepts a `CivilTimeString` (preferred)
 * or any `HH:mm`-looking string (clamped). Returns `''` when missing.
 *
 * This formatter is purely string-based so it does not depend on `Intl` or
 * host TZ at all.
 */
export function formatCivilTime12h(
  time: CivilTimeString | string | null | undefined
): string {
  if (time == null || time === '') return '';
  const civil = isCivilTimeString(time) ? time : null;
  if (civil != null) {
    return formatCivilFromValid(civil);
  }
  // Lenient parse for legacy callers.
  const [h, m] = time.split(':');
  const hourParsed = Number.parseInt(h ?? '0', 10);
  const minuteParsed = Number.parseInt((m ?? '00').padStart(2, '0'), 10);
  const hour = Number.isFinite(hourParsed)
    ? Math.min(23, Math.max(0, hourParsed))
    : 0;
  const minute = Number.isFinite(minuteParsed)
    ? Math.min(59, Math.max(0, minuteParsed))
    : 0;
  return formatCivilParts(hour, minute);
}

function formatCivilFromValid(time: CivilTimeString): string {
  const [h, m] = time.split(':');
  return formatCivilParts(Number.parseInt(h, 10), Number.parseInt(m, 10));
}

function formatCivilParts(hour: number, minute: number): string {
  const minuteStr = String(minute).padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 || 12;
  return `${h12}:${minuteStr} ${ampm}`;
}

function toDate(
  instant: string | number | Date | null | undefined
): Date | null {
  if (instant == null) return null;
  if (instant instanceof Date)
    return Number.isNaN(instant.getTime()) ? null : instant;
  if (typeof instant === 'number')
    return Number.isFinite(instant) ? new Date(instant) : null;
  const ms = Date.parse(instant);
  return Number.isNaN(ms) ? null : new Date(ms);
}

/**
 * `Apr 27, 2026 9:15 am` - last-updated style label, formatted in Pacific.
 * Returns `''` for unparseable input.
 */
export function formatInstantInPacific(
  instant: string | Date | number | null | undefined
): string {
  const d = toDate(instant);
  if (d == null) return '';
  const datePart = CALENDAR_SHORT_FORMATTER.format(d);
  const timePart = PACIFIC_TIME_FORMATTER.format(d)
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${datePart} ${timePart}`;
}

/** `Apr 27, 2026` - calendar-only label for an instant, in Pacific. */
export function formatInstantPacificDate(
  instant: string | Date | number | null | undefined
): string {
  const d = toDate(instant);
  if (d == null) return '';
  return CALENDAR_SHORT_FORMATTER.format(d);
}

/** `9:15 am` - civil-time label for an instant, in Pacific. */
export function formatInstantPacificTime(
  instant: string | Date | number | null | undefined
): string {
  const d = toDate(instant);
  if (d == null) return '';
  return PACIFIC_TIME_FORMATTER.format(d).toLowerCase().replace(/\s+/g, ' ');
}

/**
 * `Tuesday Apr 28, 9:38 pm` - print/PDF page footer "generated at" timestamp.
 * No year, lowercase am/pm, formatted in Pacific.
 */
export function formatPacificFooterTimestamp(
  instant: string | Date | number | null | undefined
): string {
  const d = toDate(instant);
  if (d == null) return '';
  const weekday = PACIFIC_WEEKDAY_FORMATTER.format(d);
  const month = PACIFIC_MONTH_SHORT_FORMATTER.format(d);
  const day = PACIFIC_DAY_FORMATTER.format(d);
  const time = PACIFIC_TIME_FORMATTER.format(d)
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${weekday} ${month} ${day}, ${time}`;
}

/**
 * Format `startTime` (HH:mm) when present; otherwise extract the time-of-day
 * from the instant in Pacific. Returns `''` when both are missing.
 *
 * Mirrors the legacy `formatTime12h(iso, civil)` shape from print code.
 */
export function formatCivilOrInstantTime(
  instant: string | Date | number | null | undefined,
  civil: CivilTimeString | string | null | undefined
): string {
  if (civil != null && civil !== '') return formatCivilTime12h(civil);
  if (instant == null) return '';
  return formatInstantPacificTime(instant);
}

/**
 * `CalendarDateString | null` -> short cell label or empty string. Convenience
 * for view-models that always pass through `null`.
 */
export function formatCalendarDateShortNullable(
  date: CalendarDateString | string | null | undefined
): string {
  if (date == null || date === '') return '';
  if (!isCalendarDateString(date)) return '';
  return formatCalendarDateShort(date);
}
