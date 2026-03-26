import { ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { filterPopoverSubmenuTriggerClass } from '@/components/users/filterPopoverMenuItemClasses';
import { useSubPopoverHover } from '@/hooks/useSubPopoverHover';
import { cn } from '@/lib/utils';

import type { ActivityFilterState } from './activityFilterState';
import { FilterSearchableList } from './FilterSearchableList';

export interface LeadFilterOption {
  value: string;
  label: string;
}

export interface LeadsFilterPanelProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
  ministryOptions: LeadFilterOption[];
  organizationOptions: LeadFilterOption[];
  commsContactOptions: LeadFilterOption[];
  eventPlannerOptions: LeadFilterOption[];
}

export type LeadsFilterProps = LeadsFilterPanelProps;

interface LeadSectionConfig {
  key: string;
  label: string;
  stateKey: keyof Pick<
    ActivityFilterState,
    | 'leadMinistryIds'
    | 'leadOrgIds'
    | 'commsContactLeadUserIds'
    | 'eventPlannerLeadIds'
  >;
  searchPlaceholder: string;
  searchAriaLabel: string;
}

const LEAD_SECTIONS: LeadSectionConfig[] = [
  {
    key: 'ministry',
    label: 'Ministry',
    stateKey: 'leadMinistryIds',
    searchPlaceholder: 'Search ministries...',
    searchAriaLabel: 'Search ministries',
  },
  {
    key: 'organization',
    label: 'Organization',
    stateKey: 'leadOrgIds',
    searchPlaceholder: 'Search organizations...',
    searchAriaLabel: 'Search organizations',
  },
  {
    key: 'comms',
    label: 'Comms contact',
    stateKey: 'commsContactLeadUserIds',
    searchPlaceholder: 'Search comms contacts...',
    searchAriaLabel: 'Search comms contacts',
  },
  {
    key: 'eventPlanner',
    label: 'Event planner',
    stateKey: 'eventPlannerLeadIds',
    searchPlaceholder: 'Search event planners...',
    searchAriaLabel: 'Search event planners',
  },
];

interface LeadSectionPopoverProps {
  section: LeadSectionConfig;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  options: LeadFilterOption[];
  onToggle: (id: number) => void;
  onClear: () => void;
}

function LeadSectionPopover({
  section,
  isOpen,
  onOpenChange,
  selectedIds,
  options,
  onToggle,
  onClear,
}: LeadSectionPopoverProps) {
  const subPopoverHover = useSubPopoverHover(isOpen, onOpenChange);
  const count = selectedIds.length;

  return (
    <Popover open={isOpen} onOpenChange={subPopoverHover.onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 px-2 py-1.5 text-sm',
            filterPopoverSubmenuTriggerClass
          )}
          aria-expanded={isOpen}
          aria-label={`${section.label} filter${count > 0 ? ` (${count} selected)` : ''}`}
          {...subPopoverHover.triggerPointerHandlers}
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-normal">{section.label}</span>
            {count > 0 && <span className="text-sm">({count})</span>}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-auto min-w-48 p-0"
        sideOffset={2}
        {...subPopoverHover.contentPointerHandlers}
      >
        <FilterSearchableList
          options={options}
          selectedIds={selectedIds}
          onToggle={onToggle}
          searchPlaceholder={section.searchPlaceholder}
          searchAriaLabel={section.searchAriaLabel}
          emptyMessage="No results"
          showClearButton
          onClear={onClear}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Leads filter panel with four trigger rows, each opening a sub Popover
 * containing a searchable list for that section.
 */
export function LeadsFilterPanel({
  filterState,
  onFilterStateChange,
  ministryOptions,
  organizationOptions,
  commsContactOptions,
  eventPlannerOptions,
}: LeadsFilterPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const optionsMap: Record<string, LeadFilterOption[]> = {
    ministry: ministryOptions,
    organization: organizationOptions,
    comms: commsContactOptions,
    eventPlanner: eventPlannerOptions,
  };

  const handleToggle = useCallback(
    (stateKey: LeadSectionConfig['stateKey'], id: number) => {
      const current = filterState[stateKey];
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      onFilterStateChange({ ...filterState, [stateKey]: next });
    },
    [filterState, onFilterStateChange]
  );

  const handleClear = useCallback(
    (stateKey: LeadSectionConfig['stateKey']) => {
      onFilterStateChange({ ...filterState, [stateKey]: [] });
    },
    [filterState, onFilterStateChange]
  );

  return (
    <div className="min-w-48 py-1">
      {LEAD_SECTIONS.map((section) => (
        <LeadSectionPopover
          key={section.key}
          section={section}
          isOpen={openSection === section.key}
          onOpenChange={(open) => setOpenSection(open ? section.key : null)}
          selectedIds={filterState[section.stateKey]}
          options={optionsMap[section.key]}
          onToggle={(id) => handleToggle(section.stateKey, id)}
          onClear={() => handleClear(section.stateKey)}
        />
      ))}
    </div>
  );
}
