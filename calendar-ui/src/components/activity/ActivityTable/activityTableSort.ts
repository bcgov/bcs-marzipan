import type { SortLevel } from '@/components/table/SortDropdown';
import { parseDateOnlyString } from '@/lib/datetime-utils';

import type { ActivityTableRow } from './activityTableRow';

/** Plan order: New, Changed, Delete requested, Reviewed, Completed, Deleted (on_hold last). */
export const ACTIVITY_STATUS_SORT_ORDER = [
  'new',
  'changed',
  'delete_requested',
  'reviewed',
  'completed',
  'deleted',
  'on_hold',
] as const;

/** Plan order: New, Changed, None. */
export const LOOK_AHEAD_SORT_ORDER = ['new', 'changed', 'none'] as const;

/** Normalize display value to match lookup name (e.g. "Delete requested" -> "delete_requested"). */
function toOrderKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '_');
}

function indexOfOrder<T extends string>(
  order: readonly T[],
  value: string | null
): number {
  if (!value) return order.length;
  const key = toOrderKey(value);
  const i = order.indexOf(key as T);
  return i === -1 ? order.length : i;
}

/** Compare two values by their index in a fixed order array (unknown values sort last). */
function compareByOrder(
  order: readonly string[],
  aVal: string | null,
  bVal: string | null
): number {
  return indexOfOrder(order, aVal) - indexOfOrder(order, bVal);
}

type RowComparator = (a: ActivityTableRow, b: ActivityTableRow) => number;

const byActivityId: RowComparator = (a, b) => a.id - b.id;

const byActivityStatus: RowComparator = (a, b) =>
  compareByOrder(
    ACTIVITY_STATUS_SORT_ORDER,
    a.activityStatus,
    b.activityStatus
  );

const byLookAheadStatus: RowComparator = (a, b) =>
  compareByOrder(LOOK_AHEAD_SORT_ORDER, a.lookAheadStatus, b.lookAheadStatus);

const byStartDate: RowComparator = (a, b) => {
  const ta = a.startDate ? parseDateOnlyString(a.startDate).getTime() : 0;
  const tb = b.startDate ? parseDateOnlyString(b.startDate).getTime() : 0;
  return ta - tb;
};

const byLastUpdated: RowComparator = (a, b) =>
  new Date(a.lastUpdatedDateTime).getTime() -
  new Date(b.lastUpdatedDateTime).getTime();

const byCreatedDateTime: RowComparator = (a, b) =>
  new Date(a.createdDateTime).getTime() - new Date(b.createdDateTime).getTime();

/** Compare by start time (earliest first); nulls sort last. */
const byStartTime: RowComparator = (a, b) => {
  const parseTime = (t: string | null): number =>
    t ? new Date(`1970-01-01T${t}`).getTime() : Number.MAX_SAFE_INTEGER;
  return parseTime(a.startTime) - parseTime(b.startTime);
};

const ACTIVITY_SORT_COMPARATORS: Record<string, RowComparator> = {
  activityId: byActivityId,
  activityStatus: byActivityStatus,
  lookAheadStatus: byLookAheadStatus,
  startDate: byStartDate,
  startTime: byStartTime,
  lastUpdated: byLastUpdated,
  createdDateTime: byCreatedDateTime,
};

/**
 * Compare two activity table rows for a single sort level (key + direction).
 */
function compareActivityRowsOneLevel(
  a: ActivityTableRow,
  b: ActivityTableRow,
  sortKey: string,
  direction: 'asc' | 'desc'
): number {
  const comparator = ACTIVITY_SORT_COMPARATORS[sortKey];
  if (!comparator) return 0;
  const mult = direction === 'asc' ? 1 : -1;
  return mult * comparator(a, b);
}

/**
 * Compare two activity table rows by applying sort levels in order; returns the first non-zero result.
 */
export function compareActivityRowsByLevels(
  a: ActivityTableRow,
  b: ActivityTableRow,
  sortLevels: SortLevel[]
): number {
  for (const level of sortLevels) {
    const result = compareActivityRowsOneLevel(
      a,
      b,
      level.key,
      level.direction
    );
    if (result !== 0) return result;
  }
  return 0;
}
