import type { ActivityFilterState } from '../activity-filter-state';

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
  return (
    dr.startDate !== '' ||
    dr.endDate !== '' ||
    dr.noStartDate ||
    dr.noEndDate ||
    filterState.categoryNames.length > 0 ||
    filterState.activityStatusIds.length > 0 ||
    filterState.pitchRequiredStatusNames.length > 0 ||
    filterState.pitchDateFilter.kind !== 'any' ||
    filterState.lookAheadStatusValues.length > 0 ||
    filterState.lookAheadSectionValues.length > 0 ||
    filterState.dateConfirmedFilter !== 'any' ||
    filterState.timeConfirmedFilter !== 'any' ||
    filterState.tagIds.length > 0 ||
    filterState.leadMinistryIds.length > 0 ||
    filterState.leadOrgIds.length > 0 ||
    filterState.commsContactLeadUserIds.length > 0 ||
    filterState.eventPlannerLeadIds.length > 0 ||
    filterState.translationRequiredStatusIds.length > 0 ||
    filterState.translationLanguageIds.length > 0
  );
}
