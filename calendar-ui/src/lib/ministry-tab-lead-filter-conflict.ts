/**
 * Ministry tab scopes the fetched list to one lead team (server). A Lead filter
 * that omits that team can never match any row.
 */
export function hasMinistryTabLeadTeamFilterConflict(
  tabLeadTeamId: number | undefined,
  filterLeadTeamIds: number[]
): boolean {
  if (tabLeadTeamId == null) return false;
  if (filterLeadTeamIds.length === 0) return false;
  return !filterLeadTeamIds.includes(tabLeadTeamId);
}

export const MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE =
  'This tab already filters by lead team. Consider clearing the Lead filter or switching to the All tab.';
