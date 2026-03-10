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
  CONFIRMED_STATUS_LABEL,
  UNCONFIRMED_STATUS_LABEL,
} from '@/lib/datetime-utils';

import type { ActivityFilterState } from './activityFilterState';
import { FilterSectionLabel } from './FilterSectionLabel';

export interface ConfirmedFilterPanelProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
}

export type ConfirmedFilterProps = ConfirmedFilterPanelProps;

type ConfirmedFilterValue = ActivityFilterState['dateConfirmedFilter'];

function isConfirmedFilterActive(
  dateConfirmedFilter: ConfirmedFilterValue,
  timeConfirmedFilter: ConfirmedFilterValue
): boolean {
  return dateConfirmedFilter !== 'any' || timeConfirmedFilter !== 'any';
}

export function ConfirmedFilterPanel({
  filterState,
  onFilterStateChange,
}: ConfirmedFilterPanelProps) {
  const { dateConfirmedFilter, timeConfirmedFilter } = filterState;

  const handleDateSelect = useCallback(
    (value: 'confirmed' | 'not_confirmed') => {
      const next: ConfirmedFilterValue =
        dateConfirmedFilter === value ? 'any' : value;
      onFilterStateChange({
        ...filterState,
        dateConfirmedFilter: next,
      });
    },
    [filterState, onFilterStateChange, dateConfirmedFilter]
  );

  const handleTimeSelect = useCallback(
    (value: 'confirmed' | 'not_confirmed') => {
      const next: ConfirmedFilterValue =
        timeConfirmedFilter === value ? 'any' : value;
      onFilterStateChange({
        ...filterState,
        timeConfirmedFilter: next,
      });
    },
    [filterState, onFilterStateChange, timeConfirmedFilter]
  );

  const handleClearDate = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      dateConfirmedFilter: 'any',
    });
  }, [filterState, onFilterStateChange]);

  const handleClearTime = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      timeConfirmedFilter: 'any',
    });
  }, [filterState, onFilterStateChange]);

  return (
    <>
      <FilterSectionLabel
        onClearAll={dateConfirmedFilter !== 'any' ? handleClearDate : undefined}
      >
        Date
      </FilterSectionLabel>
      <DropdownMenuCheckboxItem
        checked={dateConfirmedFilter === 'confirmed'}
        onCheckedChange={() => handleDateSelect('confirmed')}
        onSelect={(e) => e.preventDefault()}
      >
        {CONFIRMED_STATUS_LABEL}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={dateConfirmedFilter === 'not_confirmed'}
        onCheckedChange={() => handleDateSelect('not_confirmed')}
        onSelect={(e) => e.preventDefault()}
      >
        {UNCONFIRMED_STATUS_LABEL}
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <FilterSectionLabel
        onClearAll={timeConfirmedFilter !== 'any' ? handleClearTime : undefined}
      >
        Time
      </FilterSectionLabel>
      <DropdownMenuCheckboxItem
        checked={timeConfirmedFilter === 'confirmed'}
        onCheckedChange={() => handleTimeSelect('confirmed')}
        onSelect={(e) => e.preventDefault()}
      >
        {CONFIRMED_STATUS_LABEL}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={timeConfirmedFilter === 'not_confirmed'}
        onCheckedChange={() => handleTimeSelect('not_confirmed')}
        onSelect={(e) => e.preventDefault()}
      >
        {UNCONFIRMED_STATUS_LABEL}
      </DropdownMenuCheckboxItem>
    </>
  );
}

export function ConfirmedFilter({
  filterState,
  onFilterStateChange,
}: ConfirmedFilterProps) {
  const { dateConfirmedFilter, timeConfirmedFilter } = filterState;
  const active = useMemo(
    () => isConfirmedFilterActive(dateConfirmedFilter, timeConfirmedFilter),
    [dateConfirmedFilter, timeConfirmedFilter]
  );
  const confirmedCount =
    (dateConfirmedFilter !== 'any' ? 1 : 0) +
    (timeConfirmedFilter !== 'any' ? 1 : 0);
  const handleClearTrigger = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'any',
    });
  }, [filterState, onFilterStateChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label="Confirmed"
          active={active}
          count={confirmedCount}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Confirmed filter"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <ConfirmedFilterPanel
          filterState={filterState}
          onFilterStateChange={onFilterStateChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
