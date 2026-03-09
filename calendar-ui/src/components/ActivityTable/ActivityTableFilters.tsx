import { Search, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { ResponsiveFilterRow } from '@/components/ResponsiveFilterRow';
import {
  SortDropdown,
  type SortColumnConfig,
} from '@/components/Table/SortDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterCheckboxDropdown } from '@/components/users/FilterCheckboxDropdown';

import type { ActivityFilterState } from './activityFilterState';
import { ConfirmedFilter } from './ConfirmedFilter';
import { LeadsFilter, type LeadFilterOption } from './LeadsFilter';
import { LookAheadFilter } from './LookAheadFilter';
import { PitchFilter } from './PitchFilter';
import { ScheduledDateFilter } from './ScheduledDateFilter';
import { isDateRangeActive } from './ScheduledDateRangeFields';
import { TagsFilter, type TagFilterOption } from './TagsFilter';
import {
  TranslationsFilter,
  type TranslationFilterOption,
  type TranslationStatusFilterOption,
} from './TranslationsFilter';

export interface ActivityTableFiltersProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
  defaultSortKey: string;
  defaultSortDirection: 'asc' | 'desc';
  sortColumns: SortColumnConfig[];
  categoryOptions: { value: string; label: string }[];
  pitchRequiredStatusOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  tagOptions: TagFilterOption[];
  ministryOptions: LeadFilterOption[];
  organizationOptions: LeadFilterOption[];
  commsContactOptions: LeadFilterOption[];
  eventPlannerOptions: LeadFilterOption[];
  translationStatusOptions: TranslationStatusFilterOption[];
  translationOptions: TranslationFilterOption[];
}

function hasAnyFilterActive(filterState: ActivityFilterState): boolean {
  const {
    dateRange,
    categoryNames,
    activityStatusIds,
    pitchRequiredStatusNames,
    pitchDateFilter,
    lookAheadStatusValues,
    lookAheadSectionValues,
    dateConfirmedFilter,
    timeConfirmedFilter,
    tagIds,
    leadMinistryIds,
    leadOrgIds,
    commsContactLeadUserIds,
    eventPlannerLeadIds,
    translationRequiredStatusIds,
    translationLanguageIds,
  } = filterState;
  const pitchDateRangeActive =
    pitchDateFilter.kind === 'scheduled' &&
    isDateRangeActive(pitchDateFilter.dateRange);
  const pitchActive =
    pitchRequiredStatusNames.length > 0 ||
    pitchDateFilter.kind !== 'any' ||
    pitchDateRangeActive;
  const lookAheadActive =
    lookAheadStatusValues.length > 0 || lookAheadSectionValues.length > 0;
  const leadsActive =
    leadMinistryIds.length > 0 ||
    leadOrgIds.length > 0 ||
    commsContactLeadUserIds.length > 0 ||
    eventPlannerLeadIds.length > 0;
  const translationsActive =
    translationRequiredStatusIds.length > 0 ||
    translationLanguageIds.length > 0;
  return (
    dateRange.startDate !== '' ||
    dateRange.endDate !== '' ||
    dateRange.noStartDate ||
    dateRange.noEndDate ||
    categoryNames.length > 0 ||
    activityStatusIds.length > 0 ||
    pitchActive ||
    lookAheadActive ||
    dateConfirmedFilter !== 'any' ||
    timeConfirmedFilter !== 'any' ||
    tagIds.length > 0 ||
    leadsActive ||
    translationsActive
  );
}

export function ActivityTableFilters({
  filterState,
  onFilterStateChange,
  searchKeyword,
  onSearchKeywordChange,
  sortKey,
  sortDirection,
  onSortChange,
  defaultSortKey,
  defaultSortDirection,
  sortColumns,
  categoryOptions,
  pitchRequiredStatusOptions,
  statusOptions,
  tagOptions,
  ministryOptions,
  organizationOptions,
  commsContactOptions,
  eventPlannerOptions,
  translationStatusOptions,
  translationOptions,
}: ActivityTableFiltersProps) {
  const anyActive = useMemo(
    () => hasAnyFilterActive(filterState),
    [filterState]
  );

  const handleDateRangeChange = useCallback(
    (dateRange: ActivityFilterState['dateRange']) => {
      onFilterStateChange({
        ...filterState,
        dateRange,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleCategoryChange = useCallback(
    (values: string[]) => {
      onFilterStateChange({
        ...filterState,
        categoryNames: values,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleStatusChange = useCallback(
    (values: string[]) => {
      onFilterStateChange({
        ...filterState,
        activityStatusIds: values
          .map((v) => parseInt(v, 10))
          .filter((n) => !Number.isNaN(n)),
      });
    },
    [filterState, onFilterStateChange]
  );

  /** Clears all filter state only. Search keyword is intentionally left unchanged so users can adjust filters without losing their search. If search is later moved to the left with filters, consider extending this to also call onSearchKeywordChange(''). */
  const handleClearAllFilters = useCallback(() => {
    onFilterStateChange({
      dateRange: {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      },
      categoryNames: [],
      activityStatusIds: [],
      pitchRequiredStatusNames: [],
      pitchDateFilter: { kind: 'any' },
      lookAheadStatusValues: [],
      lookAheadSectionValues: [],
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'any',
      tagIds: [],
      leadMinistryIds: [],
      leadOrgIds: [],
      commsContactLeadUserIds: [],
      eventPlannerLeadIds: [],
      translationRequiredStatusIds: [],
      translationLanguageIds: [],
    });
  }, [onFilterStateChange]);

  const handleTagIdsChange = useCallback(
    (tagIds: number[]) => {
      onFilterStateChange({
        ...filterState,
        tagIds,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleTranslationRequiredStatusIdsChange = useCallback(
    (translationRequiredStatusIds: number[]) => {
      onFilterStateChange({
        ...filterState,
        translationRequiredStatusIds,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleTranslationLanguageIdsChange = useCallback(
    (translationLanguageIds: number[]) => {
      onFilterStateChange({
        ...filterState,
        translationLanguageIds,
      });
    },
    [filterState, onFilterStateChange]
  );

  const categorySelectedValues = filterState.categoryNames;
  const statusSelectedValues = filterState.activityStatusIds.map(String);

  const filterSlots = useMemo(
    () => [
      <ScheduledDateFilter
        key="date"
        value={filterState.dateRange}
        onChange={handleDateRangeChange}
      />,
      <FilterCheckboxDropdown
        key="category"
        label="Category"
        options={categoryOptions}
        selectedValues={categorySelectedValues}
        onChange={handleCategoryChange}
      />,
      <PitchFilter
        key="pitch"
        filterState={filterState}
        onFilterStateChange={onFilterStateChange}
        pitchRequiredStatusOptions={pitchRequiredStatusOptions}
      />,
      <LookAheadFilter
        key="lookAhead"
        filterState={filterState}
        onFilterStateChange={onFilterStateChange}
      />,
      <ConfirmedFilter
        key="confirmed"
        filterState={filterState}
        onFilterStateChange={onFilterStateChange}
      />,
      <FilterCheckboxDropdown
        key="status"
        label="Status"
        options={statusOptions}
        selectedValues={statusSelectedValues}
        onChange={handleStatusChange}
      />,
      <TagsFilter
        key="tags"
        tagOptions={tagOptions}
        selectedTagIds={filterState.tagIds}
        onTagIdsChange={handleTagIdsChange}
      />,
      <TranslationsFilter
        key="translations"
        translationStatusOptions={translationStatusOptions}
        translationOptions={translationOptions}
        selectedStatusIds={filterState.translationRequiredStatusIds}
        selectedLanguageIds={filterState.translationLanguageIds}
        onStatusIdsChange={handleTranslationRequiredStatusIdsChange}
        onLanguageIdsChange={handleTranslationLanguageIdsChange}
      />,
      <LeadsFilter
        key="leads"
        filterState={filterState}
        onFilterStateChange={onFilterStateChange}
        ministryOptions={ministryOptions}
        organizationOptions={organizationOptions}
        commsContactOptions={commsContactOptions}
        eventPlannerOptions={eventPlannerOptions}
      />,
    ],
    [
      filterState,
      onFilterStateChange,
      categoryOptions,
      categorySelectedValues,
      handleCategoryChange,
      handleDateRangeChange,
      handleStatusChange,
      handleTagIdsChange,
      handleTranslationRequiredStatusIdsChange,
      handleTranslationLanguageIdsChange,
      pitchRequiredStatusOptions,
      statusOptions,
      statusSelectedValues,
      tagOptions,
      translationStatusOptions,
      translationOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
    ]
  );

  return (
    <div
      className="mb-4 flex flex-nowrap items-center justify-between gap-8"
      role="search"
      aria-label="Filter activities by date, category, pitch, look ahead, confirmed, status, tags, translations, leads, and keyword"
    >
      <div className="flex max-w-4xl min-w-0 flex-1 items-center">
        <ResponsiveFilterRow
          overflowTriggerLabel="All filters"
          overflowTriggerClassName="h-10"
          reservedWidthForTrailing={120}
          trailingContent={
            anyActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex h-10 shrink-0 items-center gap-1"
                onClick={handleClearAllFilters}
                aria-label="Clear all filters"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            ) : undefined
          }
        >
          {filterSlots}
        </ResponsiveFilterRow>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative max-w-md min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            className="pr-8 pl-8"
            aria-label="Search activities"
          />
          {searchKeyword && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              onClick={() => onSearchKeywordChange('')}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <SortDropdown
          hideDirectionLabel
          columns={sortColumns}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          defaultSortKey={defaultSortKey}
          defaultSortDirection={defaultSortDirection}
          ariaLabel="Sort by"
        />
      </div>
    </div>
  );
}
