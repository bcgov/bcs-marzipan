import { Search, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import {
  hasActivityFilterCriteria,
  type ActivityFilterState,
} from '@corpcal/shared';
import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import {
  ResponsiveFilterRow,
  type ResponsiveFilterSlot,
} from '@/components/shared/ResponsiveFilterRow';
import {
  SortDropdown,
  type SortColumnConfig,
} from '@/components/table/SortDropdown';
import { Input } from '@/components/ui/input';
import { FilterCheckboxDropdownPanel } from '@/components/users/FilterCheckboxDropdown';
import { useActivityFilterVisibility } from '@/hooks/useActivityFilterVisibility';
import {
  getLookAheadSectionLabelFromRows,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import type { UseSavedFiltersReturn } from '@/hooks/useSavedFilters';
import { buildValidFilterLookupsFromOptions } from '@/lib/activity-filter-lookups';
import type { ActivityFilterSummaryContext } from '@/lib/activity-filter-summary';
import {
  sanitizeSavedFilterPayload,
  type ValidFilterLookups,
} from '@/lib/savedFilterSanitize';
import type { OptionItem } from '@/schemas/types';

import {
  CategoriesFilterPanel,
  type CategoryFilterOption,
} from './CategoriesFilter';
import {
  IdSearchableFilterPanel,
  type IdSearchableFilterOption,
} from './IdSearchableFilterPanel';
import {
  LeadTeamFilterPanel,
  type LeadTeamFilterOption,
} from './LeadTeamFilterPanel';
import { LookAheadFilterPanel } from './LookAheadFilter';
import { ScheduledDateFilterPanel } from './ScheduledDateFilter';
import { isDateRangeActive } from './ScheduledDateRangeFields';
import { TagsFilterPanel, type TagFilterOption } from './TagsFilter';
import {
  TranslationsFilterPanel,
  type TranslationFilterOption,
  type TranslationStatusFilterOption,
} from './TranslationsFilter';

export type LeadFilterOption = IdSearchableFilterOption;

type IdArrayFilterStateKey = 'commsContactLeadUserIds' | 'eventPlannerLeadIds';

export function buildIdArrayFilterSlot(
  key: string,
  label: string,
  stateKey: IdArrayFilterStateKey,
  options: IdSearchableFilterOption[],
  filterState: ActivityFilterState,
  onFilterStateChange: (state: ActivityFilterState) => void,
  searchPlaceholder: string,
  searchAriaLabel: string
): ResponsiveFilterSlot {
  const selectedIds = filterState[stateKey];
  return {
    key,
    label,
    panel: (
      <IdSearchableFilterPanel
        options={options}
        selectedIds={selectedIds}
        onSelectedIdsChange={(ids) =>
          onFilterStateChange({ ...filterState, [stateKey]: ids })
        }
        searchPlaceholder={searchPlaceholder}
        searchAriaLabel={searchAriaLabel}
      />
    ),
    triggerProps: {
      active: selectedIds.length > 0,
      count: selectedIds.length,
      onClear: () => onFilterStateChange({ ...filterState, [stateKey]: [] }),
      clearAriaLabel: `Clear ${label} filter`,
    },
  };
}

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
  categoryOptions: CategoryFilterOption[];
  statusOptions: OptionItem[];
  tagOptions: TagFilterOption[];
  leadTeamOptions: LeadTeamFilterOption[];
  commsContactOptions: LeadFilterOption[];
  eventPlannerOptions: LeadFilterOption[];
  translationStatusOptions: TranslationStatusFilterOption[];
  translationOptions: TranslationFilterOption[];
  savedFilters?: UseSavedFiltersReturn;
  onApplySavedFilter?: (
    filterState: ActivityFilterState,
    searchKeyword: string,
    appliedFrom: { id: number; name: string }
  ) => void;
  activeSavedFilterId?: number | null;
  /** Resets search, saved filter selection, and filter state to the view baseline. */
  onResetAll?: () => void;
  /** When true, overflow filter trigger shows a clear-all control wired to `onResetAll`. */
  hasClearableFilters?: boolean;
}

/**
 * True when any filter criteria are present in `filterState`.
 */
export function hasAnyActivityTableFilterActive(
  filterState: ActivityFilterState
): boolean {
  return hasActivityFilterCriteria(filterState);
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
  statusOptions,
  tagOptions,
  leadTeamOptions,
  commsContactOptions,
  eventPlannerOptions,
  translationStatusOptions,
  translationOptions,
  savedFilters,
  onApplySavedFilter,
  activeSavedFilterId = null,
  onResetAll,
  hasClearableFilters = false,
}: ActivityTableFiltersProps) {
  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const filterVisibility = useActivityFilterVisibility();

  const getLookAheadSectionLabel = useCallback(
    (value: string) =>
      getLookAheadSectionLabelFromRows(lookAheadSectionRows, value),
    [lookAheadSectionRows]
  );

  const summaryContext = useMemo((): ActivityFilterSummaryContext => {
    return {
      statusOptions,
      categoryOptions,
      tagOptions,
      leadTeamOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
      getLookAheadSectionLabel,
    };
  }, [
    statusOptions,
    categoryOptions,
    tagOptions,
    leadTeamOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationStatusOptions,
    translationOptions,
    getLookAheadSectionLabel,
  ]);

  const validFilterLookupsForPreview = useMemo(
    (): ValidFilterLookups =>
      buildValidFilterLookupsFromOptions({
        statusOptions,
        categoryOptions,
        tagOptions,
        commsContactOptions,
        eventPlannerOptions,
        leadTeamOptions,
        translationStatusOptions,
        translationOptions,
      }),
    [
      statusOptions,
      categoryOptions,
      tagOptions,
      commsContactOptions,
      eventPlannerOptions,
      leadTeamOptions,
      translationStatusOptions,
      translationOptions,
    ]
  );

  const parseSavedFilterForDraft = useCallback(
    (sf: SavedFilterResponse) => {
      const { filterState: parsed, searchKeyword: sk } =
        sanitizeSavedFilterPayload(
          {
            filterState: sf.filterState,
            searchKeyword: sf.searchKeyword,
          },
          validFilterLookupsForPreview
        );
      return { filterState: parsed, searchKeyword: sk };
    },
    [validFilterLookupsForPreview]
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
    (categoryIds: number[]) => {
      onFilterStateChange({
        ...filterState,
        categoryIds,
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

  const categorySelectedIds = filterState.categoryIds;
  const statusSelectedValues = filterState.activityStatusIds.map(String);

  // Build filter slots dynamically, conditionally including permission-scoped filters.
  // This reduces UI clutter for users without advanced permissions.
  // See useActivityFilterVisibility for visibility rules per role.
  const filterSlots = useMemo<ResponsiveFilterSlot[]>(() => {
    const slots: ResponsiveFilterSlot[] = [
      {
        key: 'scheduledDate',
        label: 'Date',
        panel: (
          <ScheduledDateFilterPanel
            value={filterState.dateRange}
            onChange={handleDateRangeChange}
            filterState={filterState}
            onFilterStateChange={onFilterStateChange}
          />
        ),
        triggerProps: {
          active:
            isDateRangeActive(filterState.dateRange) ||
            filterState.dateConfirmedFilter !== 'any' ||
            filterState.timeConfirmedFilter !== 'any',
          count:
            (isDateRangeActive(filterState.dateRange) ? 1 : 0) +
            (filterState.dateConfirmedFilter !== 'any' ? 1 : 0) +
            (filterState.timeConfirmedFilter !== 'any' ? 1 : 0),
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              dateRange: {
                startDate: '',
                endDate: '',
                noStartDate: false,
                noEndDate: false,
              },
              dateConfirmedFilter: 'any',
              timeConfirmedFilter: 'any',
            }),
          clearAriaLabel: 'Clear Datetime filter',
        },
      },
      {
        key: 'category',
        label: 'Category',
        panel: (
          <CategoriesFilterPanel
            categoryOptions={categoryOptions}
            selectedCategoryIds={categorySelectedIds}
            onCategoryIdsChange={handleCategoryChange}
          />
        ),
        triggerProps: {
          active: categorySelectedIds.length > 0,
          count: categorySelectedIds.length,
          onClear: () => handleCategoryChange([]),
          clearAriaLabel: 'Clear Category filter',
        },
      },
      {
        key: 'lead',
        label: 'Lead team',
        panel: (
          <LeadTeamFilterPanel
            teamOptions={leadTeamOptions}
            selectedTeamIds={filterState.leadTeamIds}
            onSelectedTeamIdsChange={(leadTeamIds) =>
              onFilterStateChange({ ...filterState, leadTeamIds })
            }
          />
        ),
        triggerProps: {
          active: filterState.leadTeamIds.length > 0,
          count: filterState.leadTeamIds.length,
          onClear: () =>
            onFilterStateChange({ ...filterState, leadTeamIds: [] }),
          clearAriaLabel: 'Clear Lead team filter',
        },
      },
      buildIdArrayFilterSlot(
        'commsContact',
        'Comms contact',
        'commsContactLeadUserIds',
        commsContactOptions,
        filterState,
        onFilterStateChange,
        'Search comms contacts...',
        'Search comms contacts'
      ),
      {
        key: 'status',
        label: 'Status',
        panel: (
          <FilterCheckboxDropdownPanel
            options={statusOptions}
            selectedValues={statusSelectedValues}
            onChange={handleStatusChange}
            emptyMessage="No results"
          />
        ),
        triggerProps: {
          active: statusSelectedValues.length > 0,
          count: statusSelectedValues.length,
          onClear: () => handleStatusChange([]),
          clearAriaLabel: 'Clear Status filter',
        },
      },
    ];

    // Look Ahead filter: Admin+ only to reduce clutter for regular users.
    // This operational metric is only relevant for administrators.
    if (filterVisibility.lookAhead) {
      slots.push({
        key: 'lookAhead',
        label: 'Look Ahead',
        panel: (
          <LookAheadFilterPanel
            filterState={filterState}
            onFilterStateChange={onFilterStateChange}
          />
        ),
        triggerProps: {
          active:
            filterState.lookAheadStatusValues.length > 0 ||
            filterState.lookAheadSectionValues.length > 0,
          count:
            filterState.lookAheadStatusValues.length +
            filterState.lookAheadSectionValues.length,
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              lookAheadStatusValues: [],
              lookAheadSectionValues: [],
            }),
          clearAriaLabel: 'Clear Look Ahead filter',
        },
      });
    }

    // Tags (always visible)
    slots.push({
      key: 'tags',
      label: 'Tags',
      panel: (
        <TagsFilterPanel
          tagOptions={tagOptions}
          selectedTagIds={filterState.tagIds}
          onTagIdsChange={handleTagIdsChange}
        />
      ),
      triggerProps: {
        active: filterState.tagIds.length > 0,
        count: filterState.tagIds.length,
        onClear: () => handleTagIdsChange([]),
        clearAriaLabel: 'Clear Tags filter',
      },
    });

    // Translations filter: Advanced Viewer+ only.
    // Editorial workflow (translation status and languages) is relevant for planners and above.
    if (filterVisibility.translations) {
      slots.push({
        key: 'translations',
        label: 'Translations',
        panel: (
          <TranslationsFilterPanel
            translationStatusOptions={translationStatusOptions}
            translationOptions={translationOptions}
            selectedStatusIds={filterState.translationRequiredStatusIds}
            selectedLanguageIds={filterState.translationLanguageIds}
            onStatusIdsChange={handleTranslationRequiredStatusIdsChange}
            onLanguageIdsChange={handleTranslationLanguageIdsChange}
          />
        ),
        triggerProps: {
          active:
            filterState.translationRequiredStatusIds.length > 0 ||
            filterState.translationLanguageIds.length > 0,
          count:
            filterState.translationRequiredStatusIds.length +
            filterState.translationLanguageIds.length,
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              translationRequiredStatusIds: [],
              translationLanguageIds: [],
            }),
          clearAriaLabel: 'Clear Translations filter',
        },
      });
    }

    // Event Planner filter: Advanced Viewer+ only.
    // Detailed event planning details are relevant for planners and above.
    if (filterVisibility.eventPlanner) {
      slots.push(
        buildIdArrayFilterSlot(
          'eventPlanner',
          'Event planner',
          'eventPlannerLeadIds',
          eventPlannerOptions,
          filterState,
          onFilterStateChange,
          'Search event planners...',
          'Search event planners'
        )
      );
    }

    return slots;
  }, [
    filterState,
    onFilterStateChange,
    categoryOptions,
    categorySelectedIds,
    handleCategoryChange,
    handleDateRangeChange,
    handleStatusChange,
    handleTagIdsChange,
    handleTranslationRequiredStatusIdsChange,
    handleTranslationLanguageIdsChange,
    statusOptions,
    statusSelectedValues,
    tagOptions,
    translationStatusOptions,
    translationOptions,
    leadTeamOptions,
    commsContactOptions,
    eventPlannerOptions,
    filterVisibility,
  ]);

  return (
    <div
      className="flex flex-nowrap items-center justify-between gap-8"
      role="search"
      aria-label="Filter activities by date, category, lead team, comms contact, status, Look Ahead, tags, translations, event planner, and keyword"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative max-w-md min-w-[240px] shrink-0">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            className="pr-8 pl-8 shadow-none"
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
        <ResponsiveFilterRow
          slots={filterSlots}
          overflowTriggerClassName="h-10"
          onClearAll={hasClearableFilters ? onResetAll : undefined}
          savedFilters={savedFilters}
          filterState={filterState}
          searchKeyword={searchKeyword}
          onApplySavedFilter={onApplySavedFilter}
          activeSavedFilterId={activeSavedFilterId}
          filterSummaryContext={summaryContext}
          parseSavedFilterForDraft={parseSavedFilterForDraft}
          validFilterLookups={validFilterLookupsForPreview}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SortDropdown
          hideDirectionLabel
          columns={sortColumns}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          defaultSortKey={defaultSortKey}
          defaultSortDirection={defaultSortDirection}
          ariaLabel="Sort by"
          triggerClassName="shadow-none"
        />
      </div>
    </div>
  );
}
