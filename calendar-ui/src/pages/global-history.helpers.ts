import type { GlobalActivityHistoryEntry } from '@corpcal/shared/api/types';
import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { getActionText } from '@/lib/activity-history-format';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatExactDate,
  formatLongDate,
  formatPacificHistoryListDayHeading,
  isTimestampInPacificDateFilter,
} from '@/lib/datetime-utils';

function getActorDisplayName(entry: GlobalActivityHistoryEntry): string {
  return entry.actor?.displayName || entry.userName || `User ${entry.userId}`;
}

/** Client-side date-range check retained for unit tests (filtering is server-side). */
export function isEntryInDateRange(
  entry: GlobalActivityHistoryEntry,
  range: DateRangeValue
): boolean {
  if (!isDateRangeActive(range)) {
    return true;
  }

  return isTimestampInPacificDateFilter(new Date(entry.timestamp), range);
}

/** Client-side search helper retained for unit tests (filtering is server-side). */
export function matchesSearch(
  entry: GlobalActivityHistoryEntry,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const timestamp = new Date(entry.timestamp);
  const haystacks = [
    getActorDisplayName(entry),
    entry.actor?.username,
    entry.actionType,
    getActionText(entry.actionType),
    entry.activity.displayId,
    entry.activity.title,
    entry.notes,
    formatPacificHistoryListDayHeading(timestamp),
    formatLongDate(timestamp, { timeZone: CORP_PACIFIC_TIME_ZONE }),
    formatExactDate(timestamp, {
      includeTime: true,
      timeZone: CORP_PACIFIC_TIME_ZONE,
      appendPacificTimeAbbrev: true,
    }),
    ...entry.activity.categories,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return haystacks.some((value) => value.includes(normalizedQuery));
}
