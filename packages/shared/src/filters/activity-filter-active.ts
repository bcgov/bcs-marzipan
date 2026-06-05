import {
  ACTIVITY_FILTER_ARRAY_STATE_KEYS,
  type ActivityFilterState,
} from '../activity-filter-state';

/**
 * True when `filterState` contains any filter criteria.
 *
 * This is purely value-based: it reflects what the user has chosen, not which
 * controls are visible. Field-scope visibility (e.g. pitch) does not gate this,
 * so applied pitch / look-ahead criteria still count as active even when their
 * controls are hidden. Used to drive "Clear filters" and summary affordances.
 */
export function hasActivityFilterCriteria(
  filterState: ActivityFilterState
): boolean {
  const dr = filterState.dateRange;
  const dateRangeActive =
    dr.startDate !== '' || dr.endDate !== '' || dr.noStartDate || dr.noEndDate;

  return (
    dateRangeActive ||
    filterState.pitchDateFilter.kind !== 'any' ||
    filterState.dateConfirmedFilter !== 'any' ||
    filterState.timeConfirmedFilter !== 'any' ||
    ACTIVITY_FILTER_ARRAY_STATE_KEYS.some((key) => filterState[key].length > 0)
  );
}
