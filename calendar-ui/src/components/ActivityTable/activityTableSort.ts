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

function indexOfOrder<T extends string>(
  order: readonly T[],
  value: string | null
): number {
  if (!value) return order.length;
  const i = order.indexOf(value.toLowerCase() as T);
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
  const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
  const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
  return ta - tb;
};

const byLastUpdated: RowComparator = (a, b) =>
  new Date(a.lastUpdatedDateTime).getTime() -
  new Date(b.lastUpdatedDateTime).getTime();

const byCreatedDateTime: RowComparator = (a, b) =>
  new Date(a.createdDateTime).getTime() - new Date(b.createdDateTime).getTime();

const ACTIVITY_SORT_COMPARATORS: Record<string, RowComparator> = {
  activityId: byActivityId,
  activityStatus: byActivityStatus,
  lookAheadStatus: byLookAheadStatus,
  startDate: byStartDate,
  lastUpdated: byLastUpdated,
  createdDateTime: byCreatedDateTime,
};

/**
 * Compare two activity table rows for sorting. Uses a map of comparators keyed by sortKey;
 * applies direction (asc/desc) to the result.
 */
export function compareActivityRows(
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
