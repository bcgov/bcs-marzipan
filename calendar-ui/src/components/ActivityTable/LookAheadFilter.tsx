import { useCallback, useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import {
  lookAheadSectionOptions,
  lookAheadStatusOptions,
} from '@/constants/form-options';

import type { ActivityFilterState } from './activityFilterState';
import { FilterSectionLabel } from './FilterSectionLabel';

export interface LookAheadFilterProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
}

function isLookAheadFilterActive(
  lookAheadStatusValues: string[],
  lookAheadSectionValues: string[]
): boolean {
  return lookAheadStatusValues.length > 0 || lookAheadSectionValues.length > 0;
}

export function LookAheadFilter({
  filterState,
  onFilterStateChange,
}: LookAheadFilterProps) {
  const { lookAheadStatusValues, lookAheadSectionValues } = filterState;

  const active = useMemo(
    () =>
      isLookAheadFilterActive(lookAheadStatusValues, lookAheadSectionValues),
    [lookAheadStatusValues, lookAheadSectionValues]
  );

  const lookAheadCount =
    lookAheadStatusValues.length + lookAheadSectionValues.length;

  const handleClearTrigger = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      lookAheadStatusValues: [],
      lookAheadSectionValues: [],
    });
  }, [filterState, onFilterStateChange]);

  const handleStatusToggle = useCallback(
    (value: string) => {
      const next = lookAheadStatusValues.includes(value)
        ? lookAheadStatusValues.filter((v) => v !== value)
        : [...lookAheadStatusValues, value];
      onFilterStateChange({
        ...filterState,
        lookAheadStatusValues: next,
      });
    },
    [filterState, onFilterStateChange, lookAheadStatusValues]
  );

  const handleSectionToggle = useCallback(
    (value: string) => {
      const next = lookAheadSectionValues.includes(value)
        ? lookAheadSectionValues.filter((v) => v !== value)
        : [...lookAheadSectionValues, value];
      onFilterStateChange({
        ...filterState,
        lookAheadSectionValues: next,
      });
    },
    [filterState, onFilterStateChange, lookAheadSectionValues]
  );

  const handleClearLookAheadStatus = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      lookAheadStatusValues: [],
    });
  }, [filterState, onFilterStateChange]);

  const handleClearLookAheadSection = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      lookAheadSectionValues: [],
    });
  }, [filterState, onFilterStateChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label="Look Ahead"
          active={active}
          count={lookAheadCount}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Look Ahead filter"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-[min(70vh,400px)] min-w-[280px] overflow-y-auto"
        align="start"
      >
        <FilterSectionLabel
          onClearAll={
            lookAheadStatusValues.length > 0
              ? handleClearLookAheadStatus
              : undefined
          }
        >
          Look Ahead status
        </FilterSectionLabel>
        {lookAheadStatusOptions.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={lookAheadStatusValues.includes(opt.value)}
            onCheckedChange={() => handleStatusToggle(opt.value)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="truncate">{opt.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <FilterSectionLabel
          onClearAll={
            lookAheadSectionValues.length > 0
              ? handleClearLookAheadSection
              : undefined
          }
        >
          Look Ahead section
        </FilterSectionLabel>
        {lookAheadSectionOptions.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={lookAheadSectionValues.includes(opt.value)}
            onCheckedChange={() => handleSectionToggle(opt.value)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="truncate">{opt.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
