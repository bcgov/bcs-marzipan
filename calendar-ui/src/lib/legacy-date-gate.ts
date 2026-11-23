import {
  isDateRangeActive,
  pacificDayKey,
  type DateRangeValue,
} from '@corpcal/shared';

/** Legacy records are only relevant when the selected date range reaches before today. */
export function dateRangeReachesPast(
  range: DateRangeValue,
  today: string | null = pacificDayKey(new Date())
): boolean {
  if (!isDateRangeActive(range) || today == null) return false;
  const lowerBoundOpen = range.noStartDate || range.startDate === '';
  return lowerBoundOpen || range.startDate < today;
}
