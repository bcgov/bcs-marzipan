import { ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
      {LEAD_SECTIONS.map((section) => {
        const selectedIds = filterState[section.stateKey];
        const count = selectedIds.length;
        const isOpen = openSection === section.key;

        return (
          <Popover
            key={section.key}
            open={isOpen}
            onOpenChange={(open) => setOpenSection(open ? section.key : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                aria-expanded={isOpen}
                aria-label={`${section.label} filter${count > 0 ? ` (${count} selected)` : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-normal uppercase">
                    {section.label}
                  </span>
                  {count > 0 && (
                    <span className="text-muted-foreground text-xs">
                      ({count})
                    </span>
                  )}
                </span>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="w-auto min-w-48 p-0"
              sideOffset={2}
            >
              <FilterSearchableList
                options={optionsMap[section.key]}
                selectedIds={selectedIds}
                onToggle={(id) => handleToggle(section.stateKey, id)}
                searchPlaceholder={section.searchPlaceholder}
                searchAriaLabel={section.searchAriaLabel}
                emptyMessage="No results"
                showClearButton
                onClear={() => handleClear(section.stateKey)}
              />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
