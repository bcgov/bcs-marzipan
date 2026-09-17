import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';

import { isDefaultGlobalHistoryDateRange } from './default-history-date-range';

export type HistorySummaryTab = 'all' | 'mine' | 'team';

type HistorySummaryFilterState = {
  searchQuery?: string;
  dateRange?: DateRangeValue;
  activeTab?: HistorySummaryTab;
  selectedActionTypes?: string[];
  selectedUserIds?: string[];
  selectedCategories?: string[];
  selectedLeadTeamIds?: string[];
};

export function buildHistoryAppliedFilterTypeLabels({
  searchQuery = '',
  dateRange,
  activeTab = 'all',
  selectedActionTypes = [],
  selectedUserIds = [],
  selectedCategories = [],
  selectedLeadTeamIds = [],
}: HistorySummaryFilterState): string[] {
  const labels: string[] = [];

  if (activeTab === 'mine') {
    labels.push('My history');
  }
  if (activeTab === 'team') {
    labels.push('My team');
  }
  if (searchQuery.trim()) {
    labels.push('Search');
  }
  if (
    dateRange &&
    isDateRangeActive(dateRange) &&
    !isDefaultGlobalHistoryDateRange(dateRange)
  ) {
    labels.push('Date');
  }
  if (selectedActionTypes.length > 0) {
    labels.push('Type');
  }
  if (selectedUserIds.length > 0) {
    labels.push('Updated by');
  }
  if (selectedCategories.length > 0) {
    labels.push('Category');
  }
  if (selectedLeadTeamIds.length > 0) {
    labels.push('Team');
  }

  return labels;
}

export function historySummaryHasClearableFilters(
  state: HistorySummaryFilterState
): boolean {
  return buildHistoryAppliedFilterTypeLabels(state).length > 0;
}
