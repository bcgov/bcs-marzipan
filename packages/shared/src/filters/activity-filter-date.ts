import type { DateRangeValue } from '../activity-filter-state';
import { pacificDayKey } from '../datetime/calendar';
import type { CalendarDateString } from '../datetime/types';

/** Inclusive calendar-date bounds (`YYYY-MM-DD`). */
export interface CalendarDateBounds {
  start: CalendarDateString;
  end: CalendarDateString;
}

function normalizedActivitySpan(
  startDate: string | null,
  endDate: string | null
): { start: string; end: string } | null {
  const start = pacificDayKey(startDate);
  if (start == null) return null;
  const endRaw = pacificDayKey(endDate);
  const end = endRaw ?? start;
  return { start, end };
}

/**
 * True when a single ISO date string falls within the given bounds.
 * The date is compared on its `YYYY-MM-DD` prefix only.
 * `noStartDate` removes the lower bound; `noEndDate` removes the upper bound.
 */
export function isDateInRange(
  isoDate: string,
  startDate: string,
  endDate: string,
  noStartDate: boolean,
  noEndDate: boolean
): boolean {
  const d = isoDate.slice(0, 10);
  if (!noStartDate && startDate !== '' && d < startDate) return false;
  if (!noEndDate && endDate !== '' && d > endDate) return false;
  return true;
}

/** True when a date range has any active bound (used to decide whether to apply it). */
export function isDateRangeActive(range: DateRangeValue): boolean {
  return (
    range.startDate !== '' ||
    range.endDate !== '' ||
    range.noStartDate ||
    range.noEndDate
  );
}

/**
 * True when the activity scheduled span overlaps `range`.
 * Requires a non-empty activity start; treats a missing end as single-day.
 * Open filter bounds (`noStartDate` / `noEndDate`) omit that side of the window.
 */
export function activityDateSpanOverlapsRange(
  startDate: string | null,
  endDate: string | null,
  range: DateRangeValue
): boolean {
  const span = normalizedActivitySpan(startDate, endDate);
  if (span == null) return false;

  const windowStart =
    !range.noStartDate && range.startDate !== '' ? range.startDate : null;
  const windowEnd =
    !range.noEndDate && range.endDate !== '' ? range.endDate : null;

  if (windowStart != null && span.end < windowStart) return false;
  if (windowEnd != null && span.start > windowEnd) return false;
  return true;
}

/**
 * True when the activity scheduled span overlaps `range` and both activity
 * start and end are set (non-empty). Used when the API flag
 * `scheduledDateRangeOverlaps` requires a full schedulable span.
 */
export function activityScheduledRangeOverlaps(
  startDate: string | null,
  endDate: string | null,
  range: DateRangeValue
): boolean {
  const start = pacificDayKey(startDate);
  const end = pacificDayKey(endDate);
  if (start == null || end == null) return false;
  return activityDateSpanOverlapsRange(startDate, endDate, range);
}

/**
 * First calendar day of overlap between an activity span and a report window.
 * Returns `null` when there is no overlap or the report range is incomplete.
 */
export function activityReportDisplayDayKey(
  startDate: string | null,
  endDate: string | null,
  reportRange: CalendarDateBounds | null | undefined
): CalendarDateString | null {
  const span = normalizedActivitySpan(startDate, endDate);
  if (span == null || reportRange?.start == null || reportRange?.end == null) {
    return null;
  }
  if (span.end < reportRange.start || span.start > reportRange.end) {
    return null;
  }
  const key = span.start < reportRange.start ? reportRange.start : span.start;
  return key as CalendarDateString;
}

/**
 * Month bucket key (`YYYY-MM`) for the first overlapping day within a month section.
 */
export function activityReportDisplayMonthKey(
  startDate: string | null,
  endDate: string | null,
  monthRange: CalendarDateBounds
): string | null {
  const dayKey = activityReportDisplayDayKey(startDate, endDate, monthRange);
  return dayKey?.slice(0, 7) ?? null;
}
