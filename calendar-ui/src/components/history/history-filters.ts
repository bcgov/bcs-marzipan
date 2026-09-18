import type { ActivityHistoryEntry } from '@corpcal/shared/api/types';

export function historyEntryMatchesActionTypes(
  entry: ActivityHistoryEntry,
  selectedActionTypes: string[]
): boolean {
  if (selectedActionTypes.length === 0) return true;
  return selectedActionTypes.includes(entry.actionType);
}

export function historyEntryMatchesUserIds(
  entry: ActivityHistoryEntry,
  selectedUserIds: string[]
): boolean {
  if (selectedUserIds.length === 0) return true;
  return selectedUserIds.includes(String(entry.userId));
}

export function buildHistoryActorFilterOptions(
  entries: ActivityHistoryEntry[]
): Array<{ value: string; label: string }> {
  const byUserId = new Map<string, string>();
  for (const entry of entries) {
    const value = String(entry.userId);
    if (byUserId.has(value)) continue;
    const label =
      entry.actor?.displayName || entry.userName || `User ${entry.userId}`;
    byUserId.set(value, label);
  }

  return [...byUserId.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function historySummaryHasActiveFilters(state: {
  searchQuery?: string;
  selectedActionTypes?: string[];
  selectedUserIds?: string[];
  dateRangeActive?: boolean;
  activeTab?: 'all' | 'mine' | 'team';
  selectedCategories?: string[];
  selectedLeadTeamIds?: string[];
}): boolean {
  if (state.activeTab === 'mine' || state.activeTab === 'team') return true;
  if (state.searchQuery?.trim()) return true;
  if (state.dateRangeActive) return true;
  if ((state.selectedActionTypes?.length ?? 0) > 0) return true;
  if ((state.selectedUserIds?.length ?? 0) > 0) return true;
  if ((state.selectedCategories?.length ?? 0) > 0) return true;
  if ((state.selectedLeadTeamIds?.length ?? 0) > 0) return true;
  return false;
}

export function resolveHistoryEmptyVariant(
  hasEntries: boolean,
  hasActiveFilters: boolean,
  searchQuery: string
): 'no-data' | 'no-search-match' | 'no-filter-match' {
  if (hasEntries) return 'no-data';
  if (!hasActiveFilters) return 'no-data';
  if (searchQuery.trim()) return 'no-search-match';
  return 'no-filter-match';
}
