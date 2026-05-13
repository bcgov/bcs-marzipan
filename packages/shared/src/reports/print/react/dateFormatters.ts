/**
 * Date/time formatting helpers for print report React components.
 *
 * All formatters delegate to the corp Pacific datetime module
 * (`@corpcal/shared/datetime`) so output is identical regardless of
 * `process.env.TZ` (laptop vs CI vs OpenShift).
 *
 * See `docs/DATE_AND_TIMEZONE.md`.
 */

import {
  formatCalendarDateCover,
  formatCalendarDateHeading,
  formatCalendarDateShort,
  formatCivilOrInstantTime,
  formatInstantInPacific,
  formatPacificFooterTimestamp,
  isCalendarDateString,
  pacificDayKey,
  type CalendarDateString,
} from '../../../datetime';

/** Day-bucket key (`YYYY-MM-DD`) in the corp Pacific zone. */
export function dateKeyLocal(
  isoDate: string | null | undefined
): CalendarDateString | null {
  return pacificDayKey(isoDate);
}

/** Human date heading used above each day group, e.g. `MONDAY, APRIL 27, 2026`. */
export function formatDayHeading(date: CalendarDateString | string): string {
  const key = isCalendarDateString(date) ? date : pacificDayKey(date);
  if (key == null) return '';
  return formatCalendarDateHeading(key);
}

/** Cover/range formatting, e.g. `Mon, Apr 27, 2026`. */
export function formatCoverDate(date: CalendarDateString | string): string {
  const key = isCalendarDateString(date) ? date : pacificDayKey(date);
  if (key == null) return '';
  return formatCalendarDateCover(key);
}

/** Compact date cell, e.g. `Apr 27, 2026`. */
export function formatShortDate(
  date: CalendarDateString | string | null | undefined
): string {
  if (date == null) return '';
  const key = isCalendarDateString(date) ? date : pacificDayKey(date);
  if (key == null) return '';
  return formatCalendarDateShort(key);
}

/** Last-updated timestamp, e.g. `Apr 27, 2026 9:15 am`, formatted in Pacific. */
export function formatLastUpdated(
  isoDateTime: string | null | undefined
): string {
  return formatInstantInPacific(isoDateTime);
}

/**
 * 12-hour time with lowercase am/pm, e.g. `9:15 am`. Returns `''` when absent.
 *
 * Prefers the explicit `HH:mm` civil time when present; otherwise extracts
 * the wall-clock time from the instant in Pacific.
 */
export function formatTime12h(
  isoDate: string | null | undefined,
  timeStr: string | null | undefined
): string {
  return formatCivilOrInstantTime(isoDate, timeStr);
}

/** e.g. `Tuesday Apr 28, 9:38 pm` - print/PDF page footer (no year, lowercase am/pm). */
export function formatPrintReportGeneratedAt(now: Date): string {
  return formatPacificFooterTimestamp(now);
}

/** Sentence body for the print PDF hint after the bold lead word `Changed`. */
export const PRINT_FOOTER_CHANGED_EXPLANATION_BODY =
  'indicates major detail or date changes only (not time switches).';

/** Full hint sentence (`Changed` is bold in the React markup). */
export const PRINT_FOOTER_CHANGED_EXPLANATION = `Changed ${PRINT_FOOTER_CHANGED_EXPLANATION_BODY}`;
