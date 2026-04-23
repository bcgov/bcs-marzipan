import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import { PageHeader } from '@/components/layout';
import { ErrorState } from '@/components/shared';
import { TablePagination } from '@/components/table/TablePagination';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
import {
  formatHistoryFieldValue,
  getActionText,
  getHistoryFieldLabel,
} from '@/lib/activity-history-format';
import { formatExactDate, formatLongDate } from '@/lib/datetime-utils';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

const EMPTY_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

const MAX_CHANGE_VALUE_LENGTH = 120;

const HISTORY_FILTER_LOOKUP_STALE_MS = 5 * 60 * 1000;

type HistoryTab = 'all' | 'mine';

type FilterOption = {
  value: string;
  label: string;
};

/** Format a Date using local date parts to avoid UTC off-by-one in timezones ahead of UTC */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

function formatDateHeading(date: Date): string {
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

export function isEntryInDateRange(
  entry: GlobalActivityHistoryEntry,
  range: DateRangeValue
): boolean {
  if (!isDateRangeActive(range)) {
    return true;
  }

  const timestamp = new Date(entry.timestamp);
  const entryDate = new Date(
    timestamp.getFullYear(),
    timestamp.getMonth(),
    timestamp.getDate()
  );

  if (range.startDate && !range.noStartDate) {
    const start = new Date(range.startDate + 'T00:00:00');
    if (entryDate < start) {
      return false;
    }
  }

  if (range.endDate && !range.noEndDate) {
    const end = new Date(range.endDate + 'T00:00:00');
    if (entryDate > end) {
      return false;
    }
  }

  return true;
}

export function matchesSearch(
  entry: GlobalActivityHistoryEntry,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const timestamp = new Date(entry.timestamp);
  const haystacks = [
    getActorDisplayName(entry),
    entry.actor?.username,
    entry.actionType,
    getActionText(entry.actionType),
    entry.activity.displayId,
    entry.activity.title,
    entry.notes,
    formatDateHeading(timestamp),
    formatLongDate(timestamp),
    formatExactDate(timestamp, { includeTime: true }),
    ...entry.activity.categories,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return haystacks.some((value) => value.includes(normalizedQuery));
}

function SearchableMultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  searchPlaceholder,
}: {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FilterTrigger
          label={label}
          active={selectedValues.length > 0}
          count={selectedValues.length}
          onClear={() => onChange([])}
          clearAriaLabel={`Clear ${label} filter`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3">
          <div className="mb-3 text-xs font-medium tracking-wide text-slate-500 uppercase">
            {label}
          </div>
          {searchPlaceholder ? (
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="mb-3"
            />
          ) : null}
          <div className="max-h-64 space-y-1 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-2 text-center text-sm text-slate-500">
                No results
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
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
          onClear={() => onChange(EMPTY_DATE_RANGE)}
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
  const [dateRange, setDateRange] = useState<DateRangeValue>(EMPTY_DATE_RANGE);
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLeadTeamIds, setSelectedLeadTeamIds] = useState<string[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    () => new Set()
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const tableScrollRef = useRef<HTMLDivElement>(null);

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
  ]);

  const historyQuery = useQuery({
    queryKey: [
      'activities',
      'global-history',
      page,
      pageSize,
      dateRange.startDate,
      dateRange.endDate,
      searchQuery,
    ],
    queryFn: (): Promise<PagedResult<GlobalActivityHistoryEntry>> =>
      fetchGlobalActivityHistoryPaged({
        page,
        pageSize,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        query: searchQuery || undefined,
        order: 'desc',
      }),
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

  const actionTypeOptions = useMemo<FilterOption[]>(() => {
    const values = [...new Set(entries.map((entry) => entry.actionType))];
    return values
      .sort((a, b) => getActionText(a).localeCompare(getActionText(b)))
      .map((value) => ({ value, label: getActionText(value) }));
  }, [entries]);

  const userOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<string, string>();
    entries.forEach((entry) => {
      seen.set(String(entry.userId), getActorDisplayName(entry));
    });

    return [...seen.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [entries]);

  const categoryOptions = useMemo<FilterOption[]>(() => {
    const categories =
      categoriesQuery.data?.map((category) => {
        const displayValue = category.displayName || category.name;

        return {
          value: displayValue,
          label: displayValue,
        };
      }) ?? [];

    if (categories.length > 0) {
      return [
        ...new Map(
          categories.map((category) => [category.value, category])
        ).values(),
      ].sort((a, b) => a.label.localeCompare(b.label));
    }

    return [...new Set(entries.flatMap((entry) => entry.activity.categories))]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }));
  }, [categoriesQuery.data, entries]);

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

  const toggleExpandedEntry = (entryId: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const formatChangeValue = (field: string, value: unknown): string => {
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
          formattedValue = premierRequestedLabelMap.get(value) || String(value);
          return truncateChangeLogValue(formattedValue);
        default:
          break;
      }
    }

    return truncateChangeLogValue(formatHistoryFieldValue(field, value));
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (activeTab === 'mine' && entry.userId !== user?.id) {
        return false;
      }

      if (!matchesSearch(entry, searchQuery)) {
        return false;
      }

      if (!isEntryInDateRange(entry, dateRange)) {
        return false;
      }

      if (
        selectedActionTypes.length > 0 &&
        !selectedActionTypes.includes(entry.actionType)
      ) {
        return false;
      }

      if (
        selectedUserIds.length > 0 &&
        !selectedUserIds.includes(String(entry.userId))
      ) {
        return false;
      }

      if (
        selectedCategories.length > 0 &&
        !entry.activity.categories.some((category) =>
          selectedCategories.includes(category)
        )
      ) {
        return false;
      }

      if (
        selectedLeadTeamIds.length > 0 &&
        !selectedLeadTeamIds.includes(String(entry.activity.leadTeamId))
      ) {
        return false;
      }

      return true;
    });
  }, [
    activeTab,
    dateRange,
    entries,
    searchQuery,
    selectedActionTypes,
    selectedCategories,
    selectedLeadTeamIds,
    selectedUserIds,
    user?.id,
  ]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, GlobalActivityHistoryEntry[]>();

    filteredEntries.forEach((entry) => {
      const heading = formatDateHeading(new Date(entry.timestamp));
      const group = groups.get(heading);
      if (group) {
        group.push(entry);
      } else {
        groups.set(heading, [entry]);
      }
    });

    return [...groups.entries()];
  }, [filteredEntries]);

  // Derive which quick-select preset is active from the current dateRange.
  // Returns null when no preset matches (including on initial load with no date set).
  const activePreset = useMemo(() => {
    if (!isDateRangeActive(dateRange)) return null;
    const now = new Date();
    const todayStr = formatLocalDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate())
    );
    if (dateRange.startDate === todayStr && dateRange.endDate === todayStr)
      return 'today';
    const last7Start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    last7Start.setDate(last7Start.getDate() - 6);
    if (
      dateRange.startDate === formatLocalDate(last7Start) &&
      dateRange.endDate === todayStr
    )
      return 'last7';
    const last30Start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    last30Start.setDate(last30Start.getDate() - 29);
    if (
      dateRange.startDate === formatLocalDate(last30Start) &&
      dateRange.endDate === todayStr
    )
      return 'last30';
    return null;
  }, [dateRange]);

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
            <TabsTrigger value="mine">My history</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="relative w-[240px] max-w-[240px] min-w-[240px]">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            className="pr-3 pl-8"
            aria-label="Search history"
          />
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
        <SearchableMultiSelectFilter
          label="Update type"
          options={actionTypeOptions}
          selectedValues={selectedActionTypes}
          onChange={setSelectedActionTypes}
        />
        <SearchableMultiSelectFilter
          label="Updated by"
          options={userOptions}
          selectedValues={selectedUserIds}
          onChange={setSelectedUserIds}
          searchPlaceholder="Search users"
        />
        <SearchableMultiSelectFilter
          label="Category"
          options={categoryOptions}
          selectedValues={selectedCategories}
          onChange={setSelectedCategories}
        />
        <SearchableMultiSelectFilter
          label="Team"
          options={leadTeamOptions}
          selectedValues={selectedLeadTeamIds}
          onChange={setSelectedLeadTeamIds}
          searchPlaceholder="Search teams"
        />
      </div>

      {/* Quick-select date presets */}
      <div className="mb-4 flex items-center gap-2">
        {(
          [
            {
              key: 'today',
              label: 'Today',
              getRange: () => {
                const now = new Date();
                const d = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate()
                );
                const s = formatLocalDate(d);
                return {
                  startDate: s,
                  endDate: s,
                  noStartDate: false,
                  noEndDate: false,
                };
              },
            },
            {
              key: 'last7',
              label: 'Last 7 days',
              getRange: () => {
                const now = new Date();
                const end = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate()
                );
                const start = new Date(end);
                start.setDate(start.getDate() - 6);
                return {
                  startDate: formatLocalDate(start),
                  endDate: formatLocalDate(end),
                  noStartDate: false,
                  noEndDate: false,
                };
              },
            },
            {
              key: 'last30',
              label: 'Last 30 days',
              getRange: () => {
                const now = new Date();
                const end = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate()
                );
                const start = new Date(end);
                start.setDate(start.getDate() - 29);
                return {
                  startDate: formatLocalDate(start),
                  endDate: formatLocalDate(end),
                  noStartDate: false,
                  noEndDate: false,
                };
              },
            },
          ] as const
        ).map(({ key, label, getRange }) => {
          const isActive = activePreset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                isActive
                  ? setDateRange(EMPTY_DATE_RANGE)
                  : setDateRange(getRange())
              }
              className={
                isActive
                  ? 'rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-300'
                  : 'rounded bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200'
              }
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
        {activePreset !== null && (
          <button
            type="button"
            className="rounded px-2 py-1 text-sm text-slate-500 hover:underline"
            onClick={() => setDateRange(EMPTY_DATE_RANGE)}
          >
            Clear
          </button>
        )}
      </div>

      {historyQuery.isLoading ? (
        <div className="text-sm text-slate-500">Loading history...</div>
      ) : historyQuery.isError ? (
        <ErrorState
          title="Unable to load history"
          message="Try again or refresh the page."
          onRetry={() => void historyQuery.refetch()}
        />
      ) : groupedEntries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {isDateRangeActive(dateRange) ? (
            <div>No changes in the selected timeframe.</div>
          ) : (
            <div>No matching history found.</div>
          )}
        </div>
      ) : (
        <>
          <TableScrollContainer ref={tableScrollRef}>
            <div className="space-y-8 p-5">
              {groupedEntries.map(([heading, dayEntries]) => (
                <section key={heading} className="space-y-4">
                  <h2 className="text-base font-normal text-slate-700">
                    {heading}
                  </h2>
                  <div className="space-y-[2.5px]">
                    {dayEntries.map((entry) => {
                      const timestamp = new Date(entry.timestamp);
                      const teamName = leadTeamLabelMap.get(
                        entry.activity.leadTeamId
                      );
                      const hasChanges = (entry.changes?.length ?? 0) > 0;
                      const isExpanded = expandedEntries.has(entry.id);

                      return (
                        <article
                          key={entry.id}
                          className="flex items-start justify-between gap-6 rounded-lg bg-white"
                        >
                          <div className="flex min-w-0 flex-1 gap-3">
                            <Avatar
                              className="h-9 w-9"
                              title={getActorDisplayName(entry)}
                            >
                              <AvatarFallback className="bg-indigo-100 text-xs font-semibold text-indigo-700">
                                {getActorInitials(entry)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex min-h-9 flex-wrap items-center gap-2 text-sm text-slate-700">
                                <span className="font-medium text-slate-900">
                                  {getActorDisplayName(entry)}
                                </span>
                                {teamName ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                    {teamName}
                                  </span>
                                ) : null}
                                <span>
                                  {getActionText(
                                    entry.actionType
                                  ).toLowerCase()}
                                </span>
                                <Link
                                  to={`/activity/${entry.activity.id}`}
                                  {...activityFormLinkState(location)}
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  {entry.activity.displayId ||
                                    `Activity ${entry.activity.id}`}
                                </Link>
                              </div>

                              <div className="text-sm font-bold text-slate-900">
                                {entry.activity.title}
                              </div>

                              {entry.notes ? (
                                <div className="text-sm text-slate-700">
                                  {entry.notes}
                                </div>
                              ) : null}

                              {hasChanges ? (
                                <div className="space-y-1 pt-1">
                                  {isExpanded ? (
                                    <>
                                      {entry.changes?.map((change, index) => (
                                        <div
                                          key={`${entry.id}-${index}`}
                                          className="text-foreground text-sm"
                                        >
                                          <span className="text-foreground font-medium">
                                            {getHistoryFieldLabel(change.field)}
                                            :
                                          </span>{' '}
                                          <span className="text-muted-foreground">
                                            {formatChangeValue(
                                              change.field,
                                              change.oldValue
                                            )}
                                          </span>{' '}
                                          <span aria-hidden>→</span>{' '}
                                          <span>
                                            {formatChangeValue(
                                              change.field,
                                              change.newValue
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleExpandedEntry(entry.id)
                                        }
                                        className="text-sm font-medium text-blue-700 hover:underline"
                                      >
                                        Show less
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleExpandedEntry(entry.id)
                                      }
                                      className="text-sm font-medium text-blue-700 hover:underline"
                                    >
                                      Show more
                                    </button>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm text-slate-500">
                            {formatExactDate(timestamp, { includeTime: true })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </TableScrollContainer>
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
    </>
  );
}
