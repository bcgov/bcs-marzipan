import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { GlobalActivityHistoryEntry } from '@corpcal/shared/api/types';
import {
  fetchGlobalActivityHistoryPaged,
  type PagedResult,
} from '@/api/activitiesApi';
import {
  fetchDateStatuses,
  fetchNewsReleaseDistributions,
  fetchNewsReleaseOrigins,
  fetchPitchRequiredStatuses,
  fetchPremierRequested,
  fetchTimeStatuses,
  fetchTranslationRequiredStatuses,
} from '@/api/lookupsApi';
import {
  isDateRangeActive,
  ScheduledDateRangeFields,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import {
  buildGlobalHistoryFilterDetailLines,
  buildHistoryAppliedFilterTypeLabels,
  createDefaultGlobalHistoryDateRange,
  GLOBAL_ACTIVITY_HISTORY_ACTION_TYPE_OPTIONS,
  HistoryFieldFilterPanel,
  HistoryListEmptyState,
  HistoryListLoading,
  HistoryListToolbar,
  HistoryMultiSelectFilter,
  HistoryResponsiveEntries,
  HistorySearchInput,
  historySummaryHasActiveFilters,
  historySummaryHasClearableFilters,
  HistoryTableLoading,
  isGlobalHistoryDateRangeActive,
  resolveHistoryEmptyVariant,
  toGlobalActivityHistoryViewModel,
} from '@/components/history';
import { HistoryDayRangeTabs } from '@/components/history/HistoryDayRangeTabs';
import { PageHeader } from '@/components/layout';
import { ErrorState } from '@/components/shared';
import { ContentSection } from '@/components/table/ContentSection';
import { FilterSection } from '@/components/table/FilterSection';
import { TablePagination } from '@/components/table/TablePagination';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import {
  TableContentSummary,
  TableFilterSummary,
} from '@/components/table/TableSummaryBar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityStatuses,
  useCategories,
  useMinistries,
  useOrganizations,
  useTeams,
  useUsers,
} from '@/hooks/useLookups';
import { activityFormLinkState } from '@/lib/activity-form-navigation-state';
import { formatHistoryFieldValue } from '@/lib/activity-history-format';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

const MAX_CHANGE_VALUE_LENGTH = 120;

const HISTORY_FILTER_LOOKUP_STALE_MS = 5 * 60 * 1000;

type HistoryTab = 'all' | 'mine' | 'team';

type FilterOption = {
  value: string;
  label: string;
};

export function truncateChangeLogValue(value: string): string {
  const normalizedValue = value.replace(/\s+/g, ' ').trim();

  if (normalizedValue.length <= MAX_CHANGE_VALUE_LENGTH) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, MAX_CHANGE_VALUE_LENGTH - 3).trimEnd()}...`;
}

export function formatActorUsername(username?: string | null): string | null {
  if (!username) {
    return null;
  }

  const hadDomain = username.includes('\\');
  const normalizedUsername = username.split('\\').at(-1)?.split('@')[0]?.trim();

  if (!normalizedUsername) {
    return null;
  }

  if (!/[._-]/.test(normalizedUsername)) {
    if (hadDomain) {
      return (
        normalizedUsername.charAt(0).toUpperCase() +
        normalizedUsername.slice(1).toLocaleLowerCase()
      );
    }

    return normalizedUsername;
  }

  return normalizedUsername
    .split(/[._-]+/)
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLocaleLowerCase()
    )
    .join(' ');
}

function getActorDisplayName(entry: GlobalActivityHistoryEntry): string {
  return (
    entry.actor?.displayName ||
    formatActorUsername(entry.actor?.username ?? entry.userName) ||
    entry.userName ||
    `User ${entry.userId}`
  );
}

export function getActorInitials(entry: GlobalActivityHistoryEntry): string {
  const displayName = getActorDisplayName(entry);
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function DateFilter({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  const active = isDateRangeActive(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Date"
          active={active}
          count={active ? 1 : 0}
          onClear={() => onChange(createDefaultGlobalHistoryDateRange())}
          clearAriaLabel="Clear date filter"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
            Date
          </div>
          <ScheduledDateRangeFields
            value={value}
            onChange={onChange}
            startNoDateLabel="No start date"
            endNoDateLabel="No end date"
            showClearButton={false}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function GlobalHistory() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    createDefaultGlobalHistoryDateRange()
  );
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLeadTeamIds, setSelectedLeadTeamIds] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const userTeamIds = useMemo(() => user?.teamIds ?? [], [user?.teamIds]);

  const historyViewer = useMemo(
    () =>
      user
        ? { permissions: user.permissions, roleName: user.roleName }
        : { permissions: [], roleName: 'Viewer' },
    [user]
  );

  useEffect(() => {
    if (activeTab === 'mine') {
      setSelectedUserIds([]);
    }
    if (activeTab === 'team') {
      setSelectedLeadTeamIds([]);
    }
  }, [activeTab]);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [
    dateRange.startDate,
    dateRange.endDate,
    searchQuery,
    activeTab,
    selectedActionTypes,
    selectedUserIds,
    selectedCategories,
    selectedLeadTeamIds,
    selectedFields,
  ]);

  const globalHistoryQueryParams = useMemo(
    () => ({
      page,
      pageSize,
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
      query: searchQuery || undefined,
      order: 'desc' as const,
      userId:
        activeTab === 'mine' && user?.id != null ? Number(user.id) : undefined,
      userIds:
        activeTab === 'all' && selectedUserIds.length > 0
          ? selectedUserIds
              .map((id) => Number(id))
              .filter((id) => !Number.isNaN(id))
          : undefined,
      actionTypes:
        selectedActionTypes.length > 0 ? selectedActionTypes : undefined,
      categories:
        selectedCategories.length > 0 ? selectedCategories : undefined,
      leadTeamIds:
        activeTab === 'team' && userTeamIds.length > 0
          ? userTeamIds
          : activeTab === 'all' && selectedLeadTeamIds.length > 0
            ? selectedLeadTeamIds
                .map((id) => Number(id))
                .filter((id) => !Number.isNaN(id))
            : undefined,
      changedFields: selectedFields.length > 0 ? selectedFields : undefined,
    }),
    [
      activeTab,
      dateRange.endDate,
      dateRange.startDate,
      page,
      pageSize,
      searchQuery,
      selectedActionTypes,
      selectedCategories,
      selectedFields,
      selectedLeadTeamIds,
      selectedUserIds,
      user?.id,
      userTeamIds,
    ]
  );

  const historyQuery = useQuery({
    queryKey: ['activities', 'global-history', globalHistoryQueryParams],
    queryFn: (): Promise<PagedResult<GlobalActivityHistoryEntry>> =>
      fetchGlobalActivityHistoryPaged(globalHistoryQueryParams),
    placeholderData: (prev) => prev,
  });

  const teamsQuery = useTeams();
  const categoriesQuery = useCategories();
  const usersQuery = useUsers();
  const organizationsQuery = useOrganizations();
  const ministriesQuery = useMinistries();
  const activityStatusesQuery = useActivityStatuses();

  const dateStatusesQuery = useQuery({
    queryKey: [...lookupQueryKeys.dateStatuses(), 'history-filters'],
    queryFn: fetchDateStatuses,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const timeStatusesQuery = useQuery({
    queryKey: [...lookupQueryKeys.timeStatuses(), 'history-filters'],
    queryFn: fetchTimeStatuses,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const pitchRequiredStatusesQuery = useQuery({
    queryKey: [...lookupQueryKeys.pitchRequiredStatuses(), 'history-filters'],
    queryFn: fetchPitchRequiredStatuses,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const translationRequiredStatusesQuery = useQuery({
    queryKey: [
      ...lookupQueryKeys.translationRequiredStatuses(),
      'history-filters',
    ],
    queryFn: fetchTranslationRequiredStatuses,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const newsReleaseOriginsQuery = useQuery({
    queryKey: [...lookupQueryKeys.newsReleaseOrigins(), 'history-filters'],
    queryFn: fetchNewsReleaseOrigins,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const newsReleaseDistributionsQuery = useQuery({
    queryKey: [
      ...lookupQueryKeys.newsReleaseDistributions(),
      'history-filters',
    ],
    queryFn: fetchNewsReleaseDistributions,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const premierRequestedQuery = useQuery({
    queryKey: [...lookupQueryKeys.premierRequested(), 'history-filters'],
    queryFn: fetchPremierRequested,
    staleTime: HISTORY_FILTER_LOOKUP_STALE_MS,
  });

  const entries = useMemo(
    () => historyQuery.data?.items ?? [],
    [historyQuery.data]
  );

  const actionTypeOptions = GLOBAL_ACTIVITY_HISTORY_ACTION_TYPE_OPTIONS;

  const userOptions = useMemo<FilterOption[]>(() => {
    return (usersQuery.data ?? [])
      .map((entry) => ({
        value: String(entry.id),
        label: entry.label || entry.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [usersQuery.data]);

  const categoryOptions = useMemo<FilterOption[]>(() => {
    return (categoriesQuery.data ?? [])
      .map((category) => {
        const displayValue = category.displayName || category.name;
        return {
          value: displayValue,
          label: displayValue,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categoriesQuery.data]);

  const leadTeamOptions = useMemo<FilterOption[]>(() => {
    return (teamsQuery.data ?? [])
      .map((team) => ({
        value: String(team.id),
        label: team.displayName || team.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teamsQuery.data]);

  const leadTeamLabelMap = useMemo(
    () =>
      new Map(
        (teamsQuery.data ?? []).map((team) => [
          team.id,
          team.displayName || team.name,
        ])
      ),
    [teamsQuery.data]
  );

  const activityStatusLabelMap = useMemo(
    () =>
      new Map(
        (activityStatusesQuery.data ?? []).map((status) => [
          status.id,
          status.displayName || status.label || status.name,
        ])
      ),
    [activityStatusesQuery.data]
  );

  const userLabelMap = useMemo(
    () =>
      new Map(
        (usersQuery.data ?? []).map((user) => [
          user.id,
          user.label || user.name,
        ])
      ),
    [usersQuery.data]
  );

  const organizationLabelMap = useMemo(
    () =>
      new Map(
        (organizationsQuery.data ?? []).map((organization) => [
          organization.id,
          organization.displayName || organization.label || organization.name,
        ])
      ),
    [organizationsQuery.data]
  );

  const ministryLabelMap = useMemo(
    () =>
      new Map(
        (ministriesQuery.data ?? []).map((ministry) => [
          ministry.id,
          ministry.displayName || ministry.label || ministry.name,
        ])
      ),
    [ministriesQuery.data]
  );

  const dateStatusLabelMap = useMemo(
    () =>
      new Map(
        (dateStatusesQuery.data ?? []).map((status) => [
          status.id,
          status.displayName || status.label || status.name,
        ])
      ),
    [dateStatusesQuery.data]
  );

  const timeStatusLabelMap = useMemo(
    () =>
      new Map(
        (timeStatusesQuery.data ?? []).map((status) => [
          status.id,
          status.displayName || status.label || status.name,
        ])
      ),
    [timeStatusesQuery.data]
  );

  const pitchRequiredStatusLabelMap = useMemo(
    () =>
      new Map(
        (pitchRequiredStatusesQuery.data ?? []).map((status) => [
          status.id,
          status.displayName || status.label || status.name,
        ])
      ),
    [pitchRequiredStatusesQuery.data]
  );

  const translationRequiredStatusLabelMap = useMemo(
    () =>
      new Map(
        (translationRequiredStatusesQuery.data ?? []).map((status) => [
          status.id,
          status.displayName || status.label || status.name,
        ])
      ),
    [translationRequiredStatusesQuery.data]
  );

  const newsReleaseOriginLabelMap = useMemo(
    () =>
      new Map(
        (newsReleaseOriginsQuery.data ?? []).map((item) => [
          item.id,
          item.label,
        ])
      ),
    [newsReleaseOriginsQuery.data]
  );

  const newsReleaseDistributionLabelMap = useMemo(
    () =>
      new Map(
        (newsReleaseDistributionsQuery.data ?? []).map((item) => [
          item.id,
          item.label,
        ])
      ),
    [newsReleaseDistributionsQuery.data]
  );

  const premierRequestedLabelMap = useMemo(
    () =>
      new Map(
        (premierRequestedQuery.data ?? []).map((item) => [item.id, item.label])
      ),
    [premierRequestedQuery.data]
  );

  const historyLinkState = useMemo(
    () => activityFormLinkState(location).state,
    [location]
  );

  const formatChangeValue = useCallback(
    (field: string, value: unknown): string => {
      let formattedValue: string;

      if (typeof value === 'number') {
        switch (field) {
          case 'activityStatusId':
            formattedValue = activityStatusLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'createdBy':
          case 'lastUpdatedBy':
          case 'eventPlannerLeadId':
          case 'commsContactLeadId':
            formattedValue = userLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'leadTeamId':
            formattedValue = leadTeamLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'leadMinistryId':
            formattedValue = ministryLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'leadOrgId':
            formattedValue = organizationLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'dateStatusId':
            formattedValue = dateStatusLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'timeStatusId':
            formattedValue = timeStatusLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'pitchRequiredStatusId':
            formattedValue =
              pitchRequiredStatusLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'translationsRequiredStatusId':
            formattedValue =
              translationRequiredStatusLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'newsReleaseOriginId':
            formattedValue =
              newsReleaseOriginLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'newsReleaseDistributionId':
            formattedValue =
              newsReleaseDistributionLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          case 'premierRequestedId':
            formattedValue =
              premierRequestedLabelMap.get(value) || String(value);
            return truncateChangeLogValue(formattedValue);
          default:
            break;
        }
      }

      return truncateChangeLogValue(formatHistoryFieldValue(field, value));
    },
    [
      activityStatusLabelMap,
      dateStatusLabelMap,
      leadTeamLabelMap,
      ministryLabelMap,
      newsReleaseDistributionLabelMap,
      newsReleaseOriginLabelMap,
      organizationLabelMap,
      pitchRequiredStatusLabelMap,
      premierRequestedLabelMap,
      timeStatusLabelMap,
      translationRequiredStatusLabelMap,
      userLabelMap,
    ]
  );

  const historyEntries = useMemo(
    () =>
      entries.map((entry) =>
        toGlobalActivityHistoryViewModel(entry, {
          team: leadTeamLabelMap.get(entry.activity.leadTeamId),
          subjectState: historyLinkState,
          formatValue: formatChangeValue,
        })
      ),
    [entries, formatChangeValue, historyLinkState, leadTeamLabelMap]
  );

  const recordCount = historyQuery.data?.totalItems ?? 0;

  const appliedFilterTypeLabels = useMemo(
    () =>
      buildHistoryAppliedFilterTypeLabels({
        searchQuery,
        dateRange,
        activeTab,
        selectedActionTypes,
        selectedUserIds,
        selectedCategories,
        selectedLeadTeamIds,
        selectedFields,
      }),
    [
      activeTab,
      dateRange,
      searchQuery,
      selectedActionTypes,
      selectedCategories,
      selectedFields,
      selectedLeadTeamIds,
      selectedUserIds,
    ]
  );

  const hasActiveFilters = historySummaryHasActiveFilters({
    searchQuery,
    dateRangeActive: isGlobalHistoryDateRangeActive(dateRange),
    activeTab,
    selectedActionTypes,
    selectedUserIds,
    selectedCategories,
    selectedLeadTeamIds,
    selectedFields,
  });

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDateRange(createDefaultGlobalHistoryDateRange());
    setSelectedActionTypes([]);
    setSelectedUserIds([]);
    setSelectedCategories([]);
    setSelectedLeadTeamIds([]);
    setSelectedFields([]);
    setActiveTab('all');
  }, []);

  const showClearFilters = historySummaryHasClearableFilters({
    searchQuery,
    dateRange,
    activeTab,
    selectedActionTypes,
    selectedUserIds,
    selectedCategories,
    selectedLeadTeamIds,
    selectedFields,
  });

  const filterDetailLines = useMemo(
    () =>
      buildGlobalHistoryFilterDetailLines({
        searchQuery,
        activeTab,
        dateRange,
        selectedActionTypes,
        selectedUserIds,
        selectedFields,
        selectedCategories,
        selectedLeadTeamIds,
        categoryOptions,
        leadTeamOptions,
        userOptions,
      }),
    [
      activeTab,
      categoryOptions,
      dateRange,
      leadTeamOptions,
      searchQuery,
      selectedActionTypes,
      selectedCategories,
      selectedFields,
      selectedLeadTeamIds,
      selectedUserIds,
      userOptions,
    ]
  );

  const renderCountSummary = useCallback(
    (countTrailing?: ReactNode) =>
      !historyQuery.isError ? (
        <TableContentSummary
          count={historyQuery.isLoading ? 0 : recordCount}
          singularLabel="record"
          pluralLabel="records"
          countTrailing={countTrailing}
        />
      ) : null,
    [historyQuery.isError, historyQuery.isLoading, recordCount]
  );

  return (
    <>
      <PageHeader title="History" />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as HistoryTab)}
      >
        <div className="mb-4">
          <TabsList className="mb-0" variant="line" size="med">
            <TabsTrigger value="all">All</TabsTrigger>
            {userTeamIds.length > 0 ? (
              <TabsTrigger value="team">My team</TabsTrigger>
            ) : null}
            <TabsTrigger value="mine">My history</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <FilterSection>
        <div className="flex flex-wrap items-center gap-3">
          <HistorySearchInput value={searchQuery} onChange={setSearchQuery} />
          <DateFilter value={dateRange} onChange={setDateRange} />
          <HistoryMultiSelectFilter
            label="Type"
            options={actionTypeOptions}
            selectedValues={selectedActionTypes}
            onChange={setSelectedActionTypes}
          />
          {activeTab === 'all' ? (
            <HistoryMultiSelectFilter
              label="Updated by"
              options={userOptions}
              selectedValues={selectedUserIds}
              onChange={setSelectedUserIds}
              searchPlaceholder="Search users"
            />
          ) : null}
          <HistoryMultiSelectFilter
            label="Field"
            options={[]}
            selectedValues={selectedFields}
            onChange={setSelectedFields}
            renderPanel
            panel={
              <HistoryFieldFilterPanel
                viewer={historyViewer}
                selectedFields={selectedFields}
                onSelectedFieldsChange={setSelectedFields}
              />
            }
          />
          <HistoryMultiSelectFilter
            label="Category"
            options={categoryOptions}
            selectedValues={selectedCategories}
            onChange={setSelectedCategories}
          />
          {activeTab === 'all' ? (
            <HistoryMultiSelectFilter
              label="Team"
              options={leadTeamOptions}
              selectedValues={selectedLeadTeamIds}
              onChange={setSelectedLeadTeamIds}
              searchPlaceholder="Search teams"
            />
          ) : null}
        </div>

        <HistoryDayRangeTabs value={dateRange} onChange={setDateRange} />

        <TableFilterSummary
          appliedFilterTypeLabels={appliedFilterTypeLabels}
          filterDetailLines={filterDetailLines}
          onClearFilters={
            !historyQuery.isError && showClearFilters
              ? clearAllFilters
              : undefined
          }
        />
      </FilterSection>

      <ContentSection className="min-w-0">
        {historyQuery.isLoading ? (
          <>
            <HistoryListToolbar summary={renderCountSummary()} />
            <div className="md:hidden">
              <HistoryListLoading />
            </div>
            <TableScrollContainer className="hidden md:flex">
              <HistoryTableLoading />
            </TableScrollContainer>
          </>
        ) : historyQuery.isError ? (
          <ErrorState
            title="Unable to load history"
            message="Try again or refresh the page."
            onRetry={() => void historyQuery.refetch()}
          />
        ) : historyEntries.length === 0 ? (
          <>
            <HistoryListToolbar summary={renderCountSummary()} />
            <TableScrollContainer>
              <HistoryListEmptyState
                variant={
                  isDateRangeActive(dateRange) && !hasActiveFilters
                    ? 'no-timeframe'
                    : resolveHistoryEmptyVariant(
                        (historyQuery.data?.totalItems ?? 0) > 0,
                        hasActiveFilters,
                        searchQuery
                      )
                }
              />
            </TableScrollContainer>
          </>
        ) : (
          <>
            <HistoryResponsiveEntries
              entries={historyEntries}
              tableScrollRef={tableScrollRef}
              renderCountSummary={renderCountSummary}
            />
            <TablePagination
              totalItems={historyQuery.data?.totalItems ?? 0}
              page={page}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                setPage(1);
              }}
              scrollContainerRef={tableScrollRef}
              aria-label="History pagination"
            />
          </>
        )}
      </ContentSection>
    </>
  );
}
