import type { DateRangeValue } from '../activity-filter-state';

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
 * True when both the activity start and end dates fall within `range`.
 * Mirrors the SQL `scheduledBothDatesInRange` semantics: an activity with a
 * missing start or end date never matches an active scheduled-date filter.
 */
export function activityScheduledRangeMatches(
  startDate: string | null,
  endDate: string | null,
  range: DateRangeValue
): boolean {
  const start = startDate ?? '';
  const end = endDate ?? '';
  if (start === '' || end === '') return false;
  return (
    isDateInRange(
      start,
      range.startDate,
      range.endDate,
      range.noStartDate,
      range.noEndDate
    ) &&
    isDateInRange(
      end,
      range.startDate,
      range.endDate,
      range.noStartDate,
      range.noEndDate
    )
  );
}
