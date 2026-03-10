import { useCallback, useMemo, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import type { ActivityFilterState } from './activityFilterState';
import { FilterSearchableList } from './FilterSearchableList';

export interface LeadFilterOption {
  value: string;
  label: string;
}

export interface LeadsFilterOverflowPanelProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
  ministryOptions: LeadFilterOption[];
  organizationOptions: LeadFilterOption[];
  commsContactOptions: LeadFilterOption[];
  eventPlannerOptions: LeadFilterOption[];
}

export type LeadsFilterProps = LeadsFilterOverflowPanelProps;

function isLeadsFilterActive(filterState: ActivityFilterState): boolean {
  return (
    filterState.leadMinistryIds.length > 0 ||
    filterState.leadOrgIds.length > 0 ||
    filterState.commsContactLeadUserIds.length > 0 ||
    filterState.eventPlannerLeadIds.length > 0
  );
}

function PanelSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-foreground px-2 py-1.5 text-xs font-normal">
      {children}
    </div>
  );
}

/**
 * SubTrigger-based dropdown content for use in ResponsiveFilterRow (inline or overflow).
 * Renders Ministry, Organization, Comms contact, and Event planner as submenus.
 */
export function LeadsFilterDropdownContent({
  filterState,
  onFilterStateChange,
  ministryOptions,
  organizationOptions,
  commsContactOptions,
  eventPlannerOptions,
}: LeadsFilterOverflowPanelProps) {
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
  const handleClearMinistry = useCallback(() => {
    onFilterStateChange({ ...filterState, leadMinistryIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearOrg = useCallback(() => {
    onFilterStateChange({ ...filterState, leadOrgIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearComms = useCallback(() => {
    onFilterStateChange({ ...filterState, commsContactLeadUserIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearEventPlanner = useCallback(() => {
    onFilterStateChange({ ...filterState, eventPlannerLeadIds: [] });
  }, [filterState, onFilterStateChange]);

  const ministryCount = filterState.leadMinistryIds.length;
  const orgCount = filterState.leadOrgIds.length;
  const commsCount = filterState.commsContactLeadUserIds.length;
  const eventPlannerCount = filterState.eventPlannerLeadIds.length;

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {ministryCount > 0 ? `Ministry (${ministryCount})` : 'Ministry'}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64 p-0">
          <FilterSearchableList
            options={ministryOptions}
            selectedIds={filterState.leadMinistryIds}
            onToggle={handleMinistryToggle}
            searchPlaceholder="Search ministries..."
            searchAriaLabel="Search ministries"
            emptyMessage="No results"
            showClearButton
            onClear={handleClearMinistry}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {orgCount > 0 ? `Organization (${orgCount})` : 'Organization'}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64 p-0">
          <FilterSearchableList
            options={organizationOptions}
            selectedIds={filterState.leadOrgIds}
            onToggle={handleOrgToggle}
            searchPlaceholder="Search organizations..."
            searchAriaLabel="Search organizations"
            emptyMessage="No results"
            showClearButton
            onClear={handleClearOrg}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {commsCount > 0 ? `Comms contact (${commsCount})` : 'Comms contact'}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64 p-0">
          <FilterSearchableList
            options={commsContactOptions}
            selectedIds={filterState.commsContactLeadUserIds}
            onToggle={handleCommsToggle}
            searchPlaceholder="Search comms contacts..."
            searchAriaLabel="Search comms contacts"
            emptyMessage="No results"
            showClearButton
            onClear={handleClearComms}
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
          <FilterSearchableList
            options={eventPlannerOptions}
            selectedIds={filterState.eventPlannerLeadIds}
            onToggle={handleEventPlannerToggle}
            searchPlaceholder="Search event planners..."
            searchAriaLabel="Search event planners"
            emptyMessage="No results"
            showClearButton
            onClear={handleClearEventPlanner}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}

/**
 * Flattened panel for overflow only (all four sections in one view). No scroll/border wrapper.
 */
export function LeadsFilterOverflowPanel({
  filterState,
  onFilterStateChange,
  ministryOptions,
  organizationOptions,
  commsContactOptions,
  eventPlannerOptions,
}: LeadsFilterOverflowPanelProps) {
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
  const handleClearMinistry = useCallback(() => {
    onFilterStateChange({ ...filterState, leadMinistryIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearOrg = useCallback(() => {
    onFilterStateChange({ ...filterState, leadOrgIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearComms = useCallback(() => {
    onFilterStateChange({ ...filterState, commsContactLeadUserIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearEventPlanner = useCallback(() => {
    onFilterStateChange({ ...filterState, eventPlannerLeadIds: [] });
  }, [filterState, onFilterStateChange]);

  return (
    <div className="min-w-48 space-y-3 py-1">
      <div>
        <PanelSectionLabel>Ministry</PanelSectionLabel>
        <FilterSearchableList
          options={ministryOptions}
          selectedIds={filterState.leadMinistryIds}
          onToggle={handleMinistryToggle}
          searchPlaceholder="Search ministries..."
          searchAriaLabel="Search ministries"
          emptyMessage="No results"
          showClearButton
          onClear={handleClearMinistry}
        />
      </div>
      <div>
        <PanelSectionLabel>Organization</PanelSectionLabel>
        <FilterSearchableList
          options={organizationOptions}
          selectedIds={filterState.leadOrgIds}
          onToggle={handleOrgToggle}
          searchPlaceholder="Search organizations..."
          searchAriaLabel="Search organizations"
          emptyMessage="No results"
          showClearButton
          onClear={handleClearOrg}
        />
      </div>
      <div>
        <PanelSectionLabel>Comms contact</PanelSectionLabel>
        <FilterSearchableList
          options={commsContactOptions}
          selectedIds={filterState.commsContactLeadUserIds}
          onToggle={handleCommsToggle}
          searchPlaceholder="Search comms contacts..."
          searchAriaLabel="Search comms contacts"
          emptyMessage="No results"
          showClearButton
          onClear={handleClearComms}
        />
      </div>
      <div>
        <PanelSectionLabel>Event planner</PanelSectionLabel>
        <FilterSearchableList
          options={eventPlannerOptions}
          selectedIds={filterState.eventPlannerLeadIds}
          onToggle={handleEventPlannerToggle}
          searchPlaceholder="Search event planners..."
          searchAriaLabel="Search event planners"
          emptyMessage="No results"
          showClearButton
          onClear={handleClearEventPlanner}
        />
      </div>
    </div>
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

  const active = useMemo(() => isLeadsFilterActive(filterState), [filterState]);
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

  const handleClearMinistry = useCallback(() => {
    onFilterStateChange({ ...filterState, leadMinistryIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearOrg = useCallback(() => {
    onFilterStateChange({ ...filterState, leadOrgIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearComms = useCallback(() => {
    onFilterStateChange({ ...filterState, commsContactLeadUserIds: [] });
  }, [filterState, onFilterStateChange]);
  const handleClearEventPlanner = useCallback(() => {
    onFilterStateChange({ ...filterState, eventPlannerLeadIds: [] });
  }, [filterState, onFilterStateChange]);

  const ministryCount = filterState.leadMinistryIds.length;
  const orgCount = filterState.leadOrgIds.length;
  const commsCount = filterState.commsContactLeadUserIds.length;
  const eventPlannerCount = filterState.eventPlannerLeadIds.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
        aria-label="Filter by leads (ministry, organization, comms contact, event planner)"
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {ministryCount > 0 ? `Ministry (${ministryCount})` : 'Ministry'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <FilterSearchableList
              options={ministryOptions}
              selectedIds={filterState.leadMinistryIds}
              onToggle={handleMinistryToggle}
              searchPlaceholder="Search ministries..."
              searchAriaLabel="Search ministries"
              emptyMessage="No results"
              showClearButton
              onClear={handleClearMinistry}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {orgCount > 0 ? `Organization (${orgCount})` : 'Organization'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <FilterSearchableList
              options={organizationOptions}
              selectedIds={filterState.leadOrgIds}
              onToggle={handleOrgToggle}
              searchPlaceholder="Search organizations..."
              searchAriaLabel="Search organizations"
              emptyMessage="No results"
              showClearButton
              onClear={handleClearOrg}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {commsCount > 0 ? `Comms contact (${commsCount})` : 'Comms contact'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
            <FilterSearchableList
              options={commsContactOptions}
              selectedIds={filterState.commsContactLeadUserIds}
              onToggle={handleCommsToggle}
              searchPlaceholder="Search comms contacts..."
              searchAriaLabel="Search comms contacts"
              emptyMessage="No results"
              showClearButton
              onClear={handleClearComms}
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
            <FilterSearchableList
              options={eventPlannerOptions}
              selectedIds={filterState.eventPlannerLeadIds}
              onToggle={handleEventPlannerToggle}
              searchPlaceholder="Search event planners..."
              searchAriaLabel="Search event planners"
              emptyMessage="No results"
              showClearButton
              onClear={handleClearEventPlanner}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
