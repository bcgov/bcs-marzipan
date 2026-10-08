import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { pacificInclusiveCalendarRangeEndingToday } from '@/lib/datetime-utils';

export const DEFAULT_GLOBAL_HISTORY_DAY_COUNT = 1;

export function createDefaultGlobalHistoryDateRange(
  now: Date = new Date()
): DateRangeValue {
  const range = pacificInclusiveCalendarRangeEndingToday(
    DEFAULT_GLOBAL_HISTORY_DAY_COUNT,
    now
  );
  return {
    startDate: range?.startDate ?? '',
    endDate: range?.endDate ?? '',
    noStartDate: false,
    noEndDate: false,
  };
}

export function isDefaultGlobalHistoryDateRange(
  dateRange: DateRangeValue,
  now: Date = new Date()
): boolean {
  const defaults = createDefaultGlobalHistoryDateRange(now);
  return (
    dateRange.noStartDate === defaults.noStartDate &&
    dateRange.noEndDate === defaults.noEndDate &&
    dateRange.startDate === defaults.startDate &&
    dateRange.endDate === defaults.endDate
  );
}

export function isGlobalHistoryDateRangeActive(
  dateRange: DateRangeValue,
  now: Date = new Date()
): boolean {
  return (
    isDateRangeActive(dateRange) &&
    !isDefaultGlobalHistoryDateRange(dateRange, now)
  );
}
