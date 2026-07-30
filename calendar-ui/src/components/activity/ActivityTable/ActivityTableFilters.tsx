import { Search, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import {
  hasActivityFilterCriteria,
  type ActivityFilterState,
} from '@corpcal/shared';
import { canViewActivityFieldScope } from '@corpcal/shared/auth';
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
import { useAuth } from '@/hooks/useAuth';
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
import { LookAheadFilterPanel } from './LookAheadFilter';
import { PitchFilterPanel } from './PitchFilter';
import { ScheduledDateFilterPanel } from './ScheduledDateFilter';
import { isDateRangeActive } from './ScheduledDateRangeFields';
import { TagsFilterPanel, type TagFilterOption } from './TagsFilter';
import {
  TranslationsFilterPanel,
  type TranslationFilterOption,
  type TranslationStatusFilterOption,
} from './TranslationsFilter';

export type LeadFilterOption = IdSearchableFilterOption;

type IdArrayFilterStateKey =
  | 'leadMinistryIds'
  | 'leadOrgIds'
  | 'commsContactLeadUserIds'
  | 'eventPlannerLeadIds'
  | 'leadTeamIds';

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
  pitchRequiredStatusOptions: OptionItem[];
  statusOptions: OptionItem[];
  tagOptions: TagFilterOption[];
  ministryOptions: LeadFilterOption[];
  organizationOptions: LeadFilterOption[];
  commsContactOptions: LeadFilterOption[];
  eventPlannerOptions: LeadFilterOption[];
  teamOptions: LeadFilterOption[];
  translationStatusOptions: TranslationStatusFilterOption[];
  translationOptions: TranslationFilterOption[];
  savedFilters?: UseSavedFiltersReturn;
  onApplySavedFilter?: (
    filterState: ActivityFilterState,
    searchKeyword: string,
    appliedFrom: { id: number; name: string }
  ) => void;
  activeSavedFilterId?: number | null;
  /** When omitted, derived from the current user (for tests). */
  pitchFieldVisibility?: {
    canViewPitchStatus: boolean;
    canViewPitchDate: boolean;
  };
}

/**
 * True when any filter criteria are present in `filterState`.
 *
 * Delegates to the shared {@link hasActivityFilterCriteria}: detection is purely
 * value-based, so applied pitch / look-ahead criteria count as active even when
 * their controls are hidden by field scope. The optional `pitchVisibility`
 * parameter is retained for call-site compatibility but no longer affects the
 * result (pitch criteria always count when present).
 */
export function hasAnyActivityTableFilterActive(
  filterState: ActivityFilterState,
  _pitchVisibility?: {
    canViewPitchStatus: boolean;
    canViewPitchDate: boolean;
  }
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
  pitchRequiredStatusOptions,
  statusOptions,
  tagOptions,
  ministryOptions,
  organizationOptions,
  commsContactOptions,
  eventPlannerOptions,
  teamOptions,
  translationStatusOptions,
  translationOptions,
  savedFilters,
  onApplySavedFilter,
  activeSavedFilterId = null,
  pitchFieldVisibility: pitchFieldVisibilityProp,
}: ActivityTableFiltersProps) {
  const { user } = useAuth();
  const pitchFieldVisibility = useMemo(() => {
    if (pitchFieldVisibilityProp) return pitchFieldVisibilityProp;
    if (!user) {
      return { canViewPitchStatus: false, canViewPitchDate: false };
    }
    const ctx = { permissions: user.permissions, roleName: user.roleName };
    return {
      canViewPitchStatus: canViewActivityFieldScope(ctx, 'pitchStatus'),
      canViewPitchDate: canViewActivityFieldScope(ctx, 'pitchDate'),
    };
  }, [pitchFieldVisibilityProp, user]);

  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const getLookAheadSectionLabel = useCallback(
    (value: string) =>
      getLookAheadSectionLabelFromRows(lookAheadSectionRows, value),
    [lookAheadSectionRows]
  );

  const summaryContext = useMemo((): ActivityFilterSummaryContext => {
    return {
      statusOptions,
      categoryOptions,
      pitchRequiredStatusOptions,
      tagOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
      teamOptions,
      translationStatusOptions,
      translationOptions,
      getLookAheadSectionLabel,
    };
  }, [
    statusOptions,
    categoryOptions,
    pitchRequiredStatusOptions,
    tagOptions,
    ministryOptions,
    organizationOptions,
    commsContactOptions,
    eventPlannerOptions,
    teamOptions,
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
        ministryOptions,
        organizationOptions,
        commsContactOptions,
        eventPlannerOptions,
        translationStatusOptions,
        translationOptions,
        teamOptions,
      }),
    [
      statusOptions,
      categoryOptions,
      tagOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
      teamOptions,
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

  /** Clears all filter state only. Search keyword is intentionally left unchanged so users can adjust filters without losing their search. If search is later moved to the left with filters, consider extending this to also call onSearchKeywordChange(''). */
  const handleClearAllFilters = useCallback(() => {
    onFilterStateChange({
      dateRange: {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      },
      categoryIds: [],
      activityStatusIds: [],
      pitchRequiredStatusNames: [],
      pitchDateFilter: { kind: 'any' },
      lookAheadStatusValues: [],
      lookAheadSectionValues: [],
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'any',
      tagIds: [],
      leadTeamIds: [],
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

  const categorySelectedIds = filterState.categoryIds;
  const statusSelectedValues = filterState.activityStatusIds.map(String);

  const canViewPitchStatus = pitchFieldVisibility.canViewPitchStatus;
  const canViewPitchDate = pitchFieldVisibility.canViewPitchDate;
  const showPitchFilter = canViewPitchStatus || canViewPitchDate;

  const filterSlots = useMemo<ResponsiveFilterSlot[]>(
    () => [
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
      buildIdArrayFilterSlot(
        'ministry',
        'Ministry',
        'leadMinistryIds',
        ministryOptions,
        filterState,
        onFilterStateChange,
        'Search ministries...',
        'Search ministries'
      ),
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
      {
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
      },
      {
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
      },
      {
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
      },
      ...(showPitchFilter
        ? [
            {
              key: 'pitch',
              label: 'Pitch',
              panel: (
                <PitchFilterPanel
                  filterState={filterState}
                  onFilterStateChange={onFilterStateChange}
                  pitchRequiredStatusOptions={pitchRequiredStatusOptions}
                  canViewPitchStatus={canViewPitchStatus}
                  canViewPitchDate={canViewPitchDate}
                />
              ),
              triggerProps: {
                active: (() => {
                  const pitchDateRangeActive =
                    filterState.pitchDateFilter.kind === 'scheduled' &&
                    isDateRangeActive(filterState.pitchDateFilter.dateRange);
                  const statusPart =
                    canViewPitchStatus &&
                    filterState.pitchRequiredStatusNames.length > 0;
                  const datePart =
                    canViewPitchDate &&
                    (filterState.pitchDateFilter.kind !== 'any' ||
                      pitchDateRangeActive);
                  return statusPart || datePart;
                })(),
                count: (() => {
                  const pitchDateRangeActive =
                    filterState.pitchDateFilter.kind === 'scheduled' &&
                    isDateRangeActive(filterState.pitchDateFilter.dateRange);
                  return (
                    (canViewPitchStatus
                      ? filterState.pitchRequiredStatusNames.length
                      : 0) +
                    (canViewPitchDate &&
                    (filterState.pitchDateFilter.kind !== 'any' ||
                      pitchDateRangeActive)
                      ? 1
                      : 0)
                  );
                })(),
                onClear: () =>
                  onFilterStateChange({
                    ...filterState,
                    pitchRequiredStatusNames: [],
                    pitchDateFilter: { kind: 'any' },
                  }),
                clearAriaLabel: 'Clear Pitch filter',
              },
            } satisfies ResponsiveFilterSlot,
          ]
        : []),
      buildIdArrayFilterSlot(
        'team',
        'Team',
        'leadTeamIds',
        teamOptions,
        filterState,
        onFilterStateChange,
        'Search teams...',
        'Search teams'
      ),
      buildIdArrayFilterSlot(
        'organization',
        'Organization',
        'leadOrgIds',
        organizationOptions,
        filterState,
        onFilterStateChange,
        'Search organizations...',
        'Search organizations'
      ),
      buildIdArrayFilterSlot(
        'eventPlanner',
        'Event planner',
        'eventPlannerLeadIds',
        eventPlannerOptions,
        filterState,
        onFilterStateChange,
        'Search event planners...',
        'Search event planners'
      ),
    ],
    [
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
      teamOptions,
      showPitchFilter,
      canViewPitchStatus,
      canViewPitchDate,
    ]
  );

  return (
    <div
      className="mb-4 flex flex-nowrap items-center justify-between gap-8"
      role="search"
      aria-label="Filter activities by date, category, ministry, comms contact, status, look ahead, tags, translations, pitch, team, organization, event planner, and keyword"
    >
      <div className="flex min-w-0 flex-1 items-center">
        <ResponsiveFilterRow
          slots={filterSlots}
          overflowTriggerClassName="h-10"
          onClearAll={handleClearAllFilters}
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
        <div className="relative max-w-md min-w-[240px] flex-1">
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
