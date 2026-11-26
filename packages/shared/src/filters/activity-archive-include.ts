import type {
  ActivityFilterState,
  DateRangeValue,
} from '../activity-filter-state';
import { pacificDayKey } from '../datetime/calendar';
import { isDateRangeActive } from './activity-filter-date';

/** Terminal statuses excluded from default list fetch (extend with `archived` later). */
export const DEFAULT_TERMINAL_ACTIVITY_STATUS_NAMES = ['completed'] as const;

export interface ActivityStatusArchiveIds {
  completedStatusId?: number;
  /** Reserved for follow-up Archived lookup. */
  archivedStatusId?: number;
  deletedStatusId?: number;
}

export interface ActivityArchiveQueryFlags {
  includeCompleted: boolean;
  includeDeleted: boolean;
}

export interface ResolveActivityArchiveQueryFlagsInput {
  filterState: ActivityFilterState;
  statusArchiveIds: ActivityStatusArchiveIds;
  canViewDeleted: boolean;
}

function terminalStatusIds(
  statusArchiveIds: ActivityStatusArchiveIds
): number[] {
  const ids: number[] = [];
  if (statusArchiveIds.completedStatusId != null) {
    ids.push(statusArchiveIds.completedStatusId);
  }
  if (statusArchiveIds.archivedStatusId != null) {
    ids.push(statusArchiveIds.archivedStatusId);
  }
  return ids;
}

/**
 * True when the scheduled date filter may overlap calendar days before today (Pacific).
 * Open start bound always overlaps the past once the range is active.
 */
export function dateRangeOverlapsPast(
  range: DateRangeValue,
  today: string | null = pacificDayKey(new Date())
): boolean {
  if (!isDateRangeActive(range) || today == null) return false;
  const lowerBoundOpen = range.noStartDate || range.startDate === '';
  return lowerBoundOpen || range.startDate < today;
}

export function statusFilterIncludesAnyTerminal(
  activityStatusIds: number[],
  statusArchiveIds: ActivityStatusArchiveIds
): boolean {
  const terminal = new Set(terminalStatusIds(statusArchiveIds));
  return activityStatusIds.some((id) => terminal.has(id));
}

/** Status filter active and no selected terminal status IDs. */
export function isNonTerminalStatusFilterOnly(
  filterState: ActivityFilterState,
  statusArchiveIds: ActivityStatusArchiveIds
): boolean {
  const { activityStatusIds } = filterState;
  if (activityStatusIds.length === 0) return false;
  return !statusFilterIncludesAnyTerminal(activityStatusIds, statusArchiveIds);
}

export function resolveActivityArchiveQueryFlags(
  input: ResolveActivityArchiveQueryFlagsInput
): ActivityArchiveQueryFlags {
  const { filterState, statusArchiveIds, canViewDeleted } = input;
  const { activityStatusIds } = filterState;
  const hasStatusFilter = activityStatusIds.length > 0;

  const statusIncludesCompleted =
    statusArchiveIds.completedStatusId != null &&
    activityStatusIds.includes(statusArchiveIds.completedStatusId);
  const statusIncludesDeleted =
    statusArchiveIds.deletedStatusId != null &&
    activityStatusIds.includes(statusArchiveIds.deletedStatusId);

  let includeCompleted: boolean;
  if (hasStatusFilter) {
    includeCompleted = statusIncludesCompleted;
  } else {
    includeCompleted = dateRangeOverlapsPast(filterState.dateRange);
  }

  const includeDeleted =
    canViewDeleted && hasStatusFilter && statusIncludesDeleted;

  return { includeCompleted, includeDeleted };
}

/** Static empty-state hint when past range + non-terminal status filter withholds completed rows. */
export function shouldShowCompletedHiddenByStatusHint(
  filterState: ActivityFilterState,
  statusArchiveIds: ActivityStatusArchiveIds
): boolean {
  return (
    isNonTerminalStatusFilterOnly(filterState, statusArchiveIds) &&
    dateRangeOverlapsPast(filterState.dateRange)
  );
}

/** Summary copy when completed rows are implicitly included via past date range. */
export function isImplicitCompletedWidenActive(
  filterState: ActivityFilterState,
  statusArchiveIds: ActivityStatusArchiveIds
): boolean {
  if (filterState.activityStatusIds.length > 0) return false;
  return dateRangeOverlapsPast(filterState.dateRange);
}
