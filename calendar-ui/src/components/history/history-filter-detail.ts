import { format } from 'date-fns';

import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import type { TableSummaryFilterDetailLine } from '@/components/table/TableSummaryBar';
import { getHistoryFieldLabel } from '@/lib/activity-history-format';

import { isDefaultGlobalHistoryDateRange } from './default-history-date-range';
import { getHistoryActionLabel } from './history-action-labels';
import type { HistorySummaryTab } from './history-summary-bar';

const MAX_DETAIL_VALUES = 8;

function formatHistoryDateRangeValue(dateRange: DateRangeValue): string {
  const startPart = dateRange.noStartDate
    ? 'No start date'
    : dateRange.startDate
      ? format(new Date(`${dateRange.startDate}T12:00:00`), 'MMM d, yyyy')
      : 'No start date';
  const endPart = dateRange.noEndDate
    ? 'No end date'
    : dateRange.endDate
      ? format(new Date(`${dateRange.endDate}T12:00:00`), 'MMM d, yyyy')
      : 'No end date';
  return `${startPart} – ${endPart}`;
}

function joinDetailValues(values: string[]): string {
  if (values.length <= MAX_DETAIL_VALUES) {
    return values.join(', ');
  }
  const head = values.slice(0, MAX_DETAIL_VALUES);
  const more = values.length - MAX_DETAIL_VALUES;
  return `${head.join(', ')}, +${more} more`;
}

function resolveOptionLabels(
  selectedValues: string[],
  options: Array<{ value: string; label: string }>
): string[] {
  const labelByValue = new Map(
    options.map((option) => [option.value, option.label])
  );
  return selectedValues.map((value) => labelByValue.get(value) ?? value);
}

type ActivityHistoryFilterDetailState = {
  searchQuery?: string;
  selectedActionTypes?: string[];
  selectedUserIds?: string[];
  selectedFields?: string[];
  actorFilterOptions?: Array<{ value: string; label: string }>;
};

export function buildActivityHistoryFilterDetailLines({
  searchQuery = '',
  selectedActionTypes = [],
  selectedUserIds = [],
  selectedFields = [],
  actorFilterOptions = [],
}: ActivityHistoryFilterDetailState): TableSummaryFilterDetailLine[] {
  const lines: TableSummaryFilterDetailLine[] = [];
  const trimmedSearch = searchQuery.trim();

  if (trimmedSearch) {
    lines.push({ label: 'Search', value: trimmedSearch });
  }
  if (selectedActionTypes.length > 0) {
    lines.push({
      label: 'Type',
      value: joinDetailValues(
        selectedActionTypes.map((value) => getHistoryActionLabel(value))
      ),
    });
  }
  if (selectedUserIds.length > 0) {
    lines.push({
      label: 'Updated by',
      value: joinDetailValues(
        resolveOptionLabels(selectedUserIds, actorFilterOptions)
      ),
    });
  }
  if (selectedFields.length > 0) {
    lines.push({
      label: 'Field',
      value: joinDetailValues(
        selectedFields.map((field) => getHistoryFieldLabel(field))
      ),
    });
  }

  return lines;
}

type GlobalHistoryFilterDetailState = ActivityHistoryFilterDetailState & {
  activeTab?: HistorySummaryTab;
  dateRange?: DateRangeValue;
  selectedCategories?: string[];
  selectedLeadTeamIds?: string[];
  categoryOptions?: Array<{ value: string; label: string }>;
  leadTeamOptions?: Array<{ value: string; label: string }>;
  userOptions?: Array<{ value: string; label: string }>;
};

export function buildGlobalHistoryFilterDetailLines({
  searchQuery = '',
  activeTab = 'all',
  dateRange,
  selectedActionTypes = [],
  selectedUserIds = [],
  selectedFields = [],
  selectedCategories = [],
  selectedLeadTeamIds = [],
  actorFilterOptions = [],
  categoryOptions = [],
  leadTeamOptions = [],
  userOptions = [],
}: GlobalHistoryFilterDetailState): TableSummaryFilterDetailLine[] {
  const lines = buildActivityHistoryFilterDetailLines({
    searchQuery,
    selectedActionTypes,
    selectedUserIds,
    selectedFields,
    actorFilterOptions:
      actorFilterOptions.length > 0 ? actorFilterOptions : userOptions,
  });

  if (activeTab === 'mine') {
    lines.unshift({ label: 'Scope', value: 'My history' });
  } else if (activeTab === 'team') {
    lines.unshift({ label: 'Scope', value: 'My team' });
  }

  if (
    dateRange &&
    isDateRangeActive(dateRange) &&
    !isDefaultGlobalHistoryDateRange(dateRange)
  ) {
    lines.push({
      label: 'Date',
      value: formatHistoryDateRangeValue(dateRange),
    });
  }
  if (selectedCategories.length > 0) {
    lines.push({
      label: 'Category',
      value: joinDetailValues(
        resolveOptionLabels(selectedCategories, categoryOptions)
      ),
    });
  }
  if (selectedLeadTeamIds.length > 0) {
    lines.push({
      label: 'Team',
      value: joinDetailValues(
        resolveOptionLabels(selectedLeadTeamIds, leadTeamOptions)
      ),
    });
  }

  return lines;
}
