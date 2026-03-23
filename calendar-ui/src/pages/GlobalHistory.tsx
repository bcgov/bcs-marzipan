import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

import type { GlobalActivityHistoryEntry } from '@corpcal/shared/api/types';
import { fetchGlobalActivityHistory } from '@/api/activitiesApi';
import { fetchCategories } from '@/api/lookupsApi';
import { fetchTeams } from '@/api/usersApi';
import {
  isDateRangeActive,
  ScheduledDateRangeFields,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { PageContainer } from '@/components/layout';
import { ErrorState } from '@/components/shared';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { useAuth } from '@/hooks/useAuth';
import {
  formatHistoryFieldValue,
  getActionText,
  getHistoryFieldLabel,
} from '@/lib/activity-history-format';
import { formatExactDate, formatLongDate } from '@/lib/datetime-utils';

const EMPTY_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

type HistoryTab = 'all' | 'mine';

type FilterOption = {
  value: string;
  label: string;
};

function getActorDisplayName(entry: GlobalActivityHistoryEntry): string {
  return entry.actor?.displayName || entry.userName || `User ${entry.userId}`;
}

function getActorInitials(entry: GlobalActivityHistoryEntry): string {
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

function isEntryInDateRange(
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

function matchesSearch(
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
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="mb-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeValue>(EMPTY_DATE_RANGE);
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLeadTeamIds, setSelectedLeadTeamIds] = useState<string[]>([]);

  const historyQuery = useQuery({
    queryKey: ['activities', 'global-history'],
    queryFn: fetchGlobalActivityHistory,
  });

  const teamsQuery = useQuery({
    queryKey: ['teams', 'history-filters'],
    queryFn: fetchTeams,
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['lookups', 'categories', 'history-filters'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const entries = historyQuery.data ?? [];

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
      categoriesQuery.data?.map((category) => ({
        value: category.name,
        label: category.displayName || category.name,
      })) ?? [];

    if (categories.length > 0) {
      return categories.sort((a, b) => a.label.localeCompare(b.label));
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

  return (
    <PageContainer className="max-w-[1100px] min-w-0 px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            History
          </h1>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as HistoryTab)}
        >
          <TabsList variant="line" className="border-b border-slate-200 pb-0">
            <TabsTrigger value="all" className="px-0 pr-6">
              All
            </TabsTrigger>
            <TabsTrigger value="mine" className="px-0">
              My history
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[250px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm"
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
            No matching history found.
          </div>
        ) : (
          <div className="space-y-8">
            {groupedEntries.map(([heading, dayEntries]) => (
              <section key={heading} className="space-y-4">
                <h2 className="text-base font-semibold text-slate-700">
                  {heading}
                </h2>
                <div className="space-y-5">
                  {dayEntries.map((entry) => {
                    const timestamp = new Date(entry.timestamp);
                    const teamName = leadTeamLabelMap.get(
                      entry.activity.leadTeamId
                    );
                    const hasChanges = (entry.changes?.length ?? 0) > 0;

                    return (
                      <article
                        key={entry.id}
                        className="flex items-start justify-between gap-6 rounded-lg border border-slate-200 bg-white px-5 py-4"
                      >
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {getActorInitials(entry)}
                          </div>
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                              <span className="font-medium text-slate-900">
                                {getActorDisplayName(entry)}
                              </span>
                              {teamName ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                  {teamName}
                                </span>
                              ) : null}
                              <span>
                                {getActionText(entry.actionType).toLowerCase()}
                              </span>
                              <Link
                                to={`/activity/${entry.activity.id}`}
                                className="font-medium text-blue-700 hover:underline"
                              >
                                {entry.activity.displayId ||
                                  `Activity ${entry.activity.id}`}
                              </Link>
                            </div>

                            <div className="text-sm text-slate-900">
                              {entry.activity.title}
                            </div>

                            {entry.notes ? (
                              <div className="text-sm text-slate-700">
                                {entry.notes}
                              </div>
                            ) : null}

                            {hasChanges ? (
                              <div className="space-y-1 pt-1">
                                {entry.changes
                                  ?.slice(0, 3)
                                  .map((change, index) => (
                                    <div
                                      key={`${entry.id}-${index}`}
                                      className="text-sm text-slate-600"
                                    >
                                      <span className="font-medium text-slate-700">
                                        {getHistoryFieldLabel(change.field)}:
                                      </span>{' '}
                                      <span>
                                        {formatHistoryFieldValue(
                                          change.field,
                                          change.oldValue
                                        )}
                                      </span>{' '}
                                      <span aria-hidden>→</span>{' '}
                                      <span>
                                        {formatHistoryFieldValue(
                                          change.field,
                                          change.newValue
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                {(entry.changes?.length ?? 0) > 3 ? (
                                  <div className="text-sm text-blue-700">
                                    {entry.changes!.length - 3} more change
                                    {entry.changes!.length - 3 === 1 ? '' : 's'}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {entry.activity.categories.length > 0 ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {entry.activity.categories.map((category) => (
                                  <span
                                    key={`${entry.id}-${category}`}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                  >
                                    {category}
                                  </span>
                                ))}
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
        )}
      </div>
    </PageContainer>
  );
}
