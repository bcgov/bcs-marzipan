import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';

type HistorySummaryFilterState = {
  searchQuery?: string;
  dateRange?: DateRangeValue;
  activeTab?: 'all' | 'mine';
  selectedActionTypes?: string[];
  selectedUserIds?: string[];
  selectedCategories?: string[];
  selectedLeadTeamIds?: string[];
  selectedFields?: string[];
};

export function buildHistoryAppliedFilterTypeLabels({
  searchQuery = '',
  dateRange,
  activeTab = 'all',
  selectedActionTypes = [],
  selectedUserIds = [],
  selectedCategories = [],
  selectedLeadTeamIds = [],
  selectedFields = [],
}: HistorySummaryFilterState): string[] {
  const labels: string[] = [];

  if (activeTab === 'mine') {
    labels.push('My history');
  }
  if (searchQuery.trim()) {
    labels.push('Search');
  }
  if (dateRange && isDateRangeActive(dateRange)) {
    labels.push('Date');
  }
  if (selectedActionTypes.length > 0) {
    labels.push('Update type');
  }
  if (selectedUserIds.length > 0) {
    labels.push('Updated by');
  }
  if (selectedFields.length > 0) {
    labels.push('Field');
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
