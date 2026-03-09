import { Check, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import type { ActivityFilterState } from './activityFilterState';

export interface LeadFilterOption {
  value: string;
  label: string;
}

export interface LeadsFilterProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
  ministryOptions: LeadFilterOption[];
  organizationOptions: LeadFilterOption[];
  commsContactOptions: LeadFilterOption[];
  eventPlannerOptions: LeadFilterOption[];
}

function filterOptionsBySearch(
  options: LeadFilterOption[],
  search: string
): LeadFilterOption[] {
  const term = search.trim().toLowerCase();
  if (term === '') return options;
  return options.filter((opt) => opt.label.toLowerCase().includes(term));
}

function isLeadsFilterActive(filterState: ActivityFilterState): boolean {
  return (
    filterState.leadMinistryIds.length > 0 ||
    filterState.leadOrgIds.length > 0 ||
    filterState.commsContactLeadUserIds.length > 0 ||
    filterState.eventPlannerLeadIds.length > 0
  );
}

/** Same list-item pattern as TagsFilter: button with Check icon when checked, pl-8 for icon space. */
function LeadSubList({
  options,
  selectedIds,
  onToggle,
  searchValue,
  onSearchChange,
  searchAriaLabel,
}: {
  options: LeadFilterOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchAriaLabel: string;
}) {
  const filtered = useMemo(
    () => filterOptionsBySearch(options, searchValue),
    [options, searchValue]
  );
  return (
    <>
      <div className="border-b p-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            type="text"
            className="h-8 pr-3 pl-8 text-sm"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={searchAriaLabel}
          />
        </div>
      </div>
      <div className="max-h-[250px] overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-center text-sm">
            No results
          </div>
        ) : (
          filtered.map((opt) => {
            const id = parseInt(opt.value, 10);
            const checked = Number.isFinite(id) && selectedIds.includes(id);
            return (
              <button
                key={opt.value}
                type="button"
                className="focus:bg-accent focus:text-accent-foreground hover:bg-accent relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-left text-sm outline-none select-none"
                onClick={() => Number.isFinite(id) && onToggle(id)}
              >
                <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                  {checked ? <Check className="size-4" /> : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

export function LeadsFilter({
  filterState,
  onFilterStateChange,
  ministryOptions,
  organizationOptions,
  commsContactOptions,
  eventPlannerOptions,
}: LeadsFilterProps) {
  const [open, setOpen] = useState(false);
  const [ministrySearch, setMinistrySearch] = useState('');
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [commsSearch, setCommsSearch] = useState('');
  const [eventPlannerSearch, setEventPlannerSearch] = useState('');

  const active = useMemo(
    () => isLeadsFilterActive(filterState),
    [
      filterState.leadMinistryIds.length,
      filterState.leadOrgIds.length,
      filterState.commsContactLeadUserIds.length,
      filterState.eventPlannerLeadIds.length,
    ]
  );
  const totalCount =
    filterState.leadMinistryIds.length +
    filterState.leadOrgIds.length +
    filterState.commsContactLeadUserIds.length +
    filterState.eventPlannerLeadIds.length;

  const handleClearTrigger = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      leadMinistryIds: [],
      leadOrgIds: [],
      commsContactLeadUserIds: [],
      eventPlannerLeadIds: [],
    });
  }, [filterState, onFilterStateChange]);

  const handleMinistryToggle = useCallback(
    (id: number) => {
      const next = filterState.leadMinistryIds.includes(id)
        ? filterState.leadMinistryIds.filter((x) => x !== id)
        : [...filterState.leadMinistryIds, id];
      onFilterStateChange({ ...filterState, leadMinistryIds: next });
    },
    [filterState, onFilterStateChange]
  );
  const handleOrgToggle = useCallback(
    (id: number) => {
      const next = filterState.leadOrgIds.includes(id)
        ? filterState.leadOrgIds.filter((x) => x !== id)
        : [...filterState.leadOrgIds, id];
      onFilterStateChange({ ...filterState, leadOrgIds: next });
    },
    [filterState, onFilterStateChange]
  );
  const handleCommsToggle = useCallback(
    (id: number) => {
      const next = filterState.commsContactLeadUserIds.includes(id)
        ? filterState.commsContactLeadUserIds.filter((x) => x !== id)
        : [...filterState.commsContactLeadUserIds, id];
      onFilterStateChange({
        ...filterState,
        commsContactLeadUserIds: next,
      });
    },
    [filterState, onFilterStateChange]
  );
  const handleEventPlannerToggle = useCallback(
    (id: number) => {
      const next = filterState.eventPlannerLeadIds.includes(id)
        ? filterState.eventPlannerLeadIds.filter((x) => x !== id)
        : [...filterState.eventPlannerLeadIds, id];
      onFilterStateChange({
        ...filterState,
        eventPlannerLeadIds: next,
      });
    },
    [filterState, onFilterStateChange]
  );

  const ministryCount = filterState.leadMinistryIds.length;
  const orgCount = filterState.leadOrgIds.length;
  const commsCount = filterState.commsContactLeadUserIds.length;
  const eventPlannerCount = filterState.eventPlannerLeadIds.length;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setMinistrySearch('');
          setOrganizationSearch('');
          setCommsSearch('');
          setEventPlannerSearch('');
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label="Leads"
          active={active}
          count={totalCount}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Leads filter"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-48"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-label="Filter by leads (ministry, organization, comms contact, event planner)"
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {ministryCount > 0 ? `Ministry (${ministryCount})` : 'Ministry'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <LeadSubList
              options={ministryOptions}
              selectedIds={filterState.leadMinistryIds}
              onToggle={handleMinistryToggle}
              searchValue={ministrySearch}
              onSearchChange={setMinistrySearch}
              searchAriaLabel="Search ministries"
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {orgCount > 0 ? `Organization (${orgCount})` : 'Organization'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <LeadSubList
              options={organizationOptions}
              selectedIds={filterState.leadOrgIds}
              onToggle={handleOrgToggle}
              searchValue={organizationSearch}
              onSearchChange={setOrganizationSearch}
              searchAriaLabel="Search organizations"
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {commsCount > 0 ? `Comms contact (${commsCount})` : 'Comms contact'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <LeadSubList
              options={commsContactOptions}
              selectedIds={filterState.commsContactLeadUserIds}
              onToggle={handleCommsToggle}
              searchValue={commsSearch}
              onSearchChange={setCommsSearch}
              searchAriaLabel="Search comms contacts"
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {eventPlannerCount > 0
              ? `Event planner (${eventPlannerCount})`
              : 'Event planner'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <LeadSubList
              options={eventPlannerOptions}
              selectedIds={filterState.eventPlannerLeadIds}
              onToggle={handleEventPlannerToggle}
              searchValue={eventPlannerSearch}
              onSearchChange={setEventPlannerSearch}
              searchAriaLabel="Search event planners"
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
