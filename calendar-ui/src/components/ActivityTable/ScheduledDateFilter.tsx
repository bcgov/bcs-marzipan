import { useCallback, useEffect, useState, type MouseEvent } from 'react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/Table/tableConstants';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSectionTitle,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { cn } from '@/lib/utils';

import type { ActivityFilterState } from './activityFilterState';
import {
  isDateRangeActive,
  ScheduledDateRangeFields,
  type DateRangeValue,
} from './ScheduledDateRangeFields';

export type { DateRangeValue } from './ScheduledDateRangeFields';

const EMPTY_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

type ConfirmedFilterValue = ActivityFilterState['dateConfirmedFilter'];

export interface ScheduledDateFilterPanelProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
}

/**
 * Panel content only (no trigger). For use in ResponsiveFilterRow inline and overflow.
 * Combines date range and date/time confirmation filters (Datetime filter).
 */
export function ScheduledDateFilterPanel({
  value,
  onChange,
  filterState,
  onFilterStateChange,
}: ScheduledDateFilterPanelProps) {
  const [draft, setDraft] = useState<DateRangeValue>(() => value);
  const { dateConfirmedFilter, timeConfirmedFilter } = filterState;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleDraftChange = useCallback(
    (next: DateRangeValue) => {
      setDraft(next);
      onChange(next);
    },
    [onChange]
  );

  const handleClearDates = useCallback(() => {
    onChange(EMPTY_DATE_RANGE);
    setDraft(EMPTY_DATE_RANGE);
  }, [onChange]);

  const dateRangeActive = isDateRangeActive(value);

  const handleClearDatesClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleClearDates();
    },
    [handleClearDates]
  );

  const handleDateConfirmedChange = useCallback(
    (checked: boolean) => {
      const next: ConfirmedFilterValue = checked ? 'confirmed' : 'any';
      onFilterStateChange({
        ...filterState,
        dateConfirmedFilter: next,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleDateNotConfirmedChange = useCallback(
    (checked: boolean) => {
      const next: ConfirmedFilterValue = checked ? 'not_confirmed' : 'any';
      onFilterStateChange({
        ...filterState,
        dateConfirmedFilter: next,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleTimeConfirmedChange = useCallback(
    (checked: boolean) => {
      const next: ConfirmedFilterValue = checked ? 'confirmed' : 'any';
      onFilterStateChange({
        ...filterState,
        timeConfirmedFilter: next,
      });
    },
    [filterState, onFilterStateChange]
  );

  const handleTimeNotConfirmedChange = useCallback(
    (checked: boolean) => {
      const next: ConfirmedFilterValue = checked ? 'not_confirmed' : 'any';
      onFilterStateChange({
        ...filterState,
        timeConfirmedFilter: next,
      });
    },
    [filterState, onFilterStateChange]
  );

  return (
    <div className="p-3">
      <div
        className={cn(
          'text-foreground mb-2 flex w-full items-center justify-between gap-2 text-xs font-normal'
        )}
      >
        <span className="text-muted-foreground text-xs font-normal uppercase">
          Date range
        </span>
        {dateRangeActive ? (
          <button
            type="button"
            onClick={handleClearDatesClick}
            className="text-primary shrink-0 text-xs font-normal hover:underline"
            aria-label="Clear date range"
          >
            Clear dates
          </button>
        ) : null}
      </div>
      <ScheduledDateRangeFields
        value={draft}
        onChange={handleDraftChange}
        showClearButton={false}
        onAfterClear={handleClearDates}
      />
      <div className="border-border my-4 border-t" role="separator" />
      <DropdownMenuSectionTitle>Date status</DropdownMenuSectionTitle>
      <DropdownMenuCheckboxItem
        checked={dateConfirmedFilter === 'confirmed'}
        onCheckedChange={(c) => handleDateConfirmedChange(c === true)}
        onSelect={(e) => e.preventDefault()}
      >
        Confirmed
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={dateConfirmedFilter === 'not_confirmed'}
        onCheckedChange={(c) => handleDateNotConfirmedChange(c === true)}
        onSelect={(e) => e.preventDefault()}
        className="flex-1"
      >
        Not confirmed
      </DropdownMenuCheckboxItem>

      {/* <DropdownMenuSeparator /> */}
      <DropdownMenuSectionTitle>Time status</DropdownMenuSectionTitle>
      <DropdownMenuCheckboxItem
        checked={timeConfirmedFilter === 'confirmed'}
        onCheckedChange={(c) => handleTimeConfirmedChange(c === true)}
        onSelect={(e) => e.preventDefault()}
      >
        Confirmed
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={timeConfirmedFilter === 'not_confirmed'}
        onCheckedChange={(c) => handleTimeNotConfirmedChange(c === true)}
        onSelect={(e) => e.preventDefault()}
        className="flex-1"
      >
        Not confirmed
      </DropdownMenuCheckboxItem>
    </div>
  );
}

type ScheduledDateFilterProps = ScheduledDateFilterPanelProps;

export function ScheduledDateFilter({
  value,
  onChange,
  filterState,
  onFilterStateChange,
}: ScheduledDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(() => value);

  const dateRangeActive = isDateRangeActive(value);
  const confirmedActive =
    filterState.dateConfirmedFilter !== 'any' ||
    filterState.timeConfirmedFilter !== 'any';
  const active = dateRangeActive || confirmedActive;

  useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  const handleClearTrigger = useCallback(() => {
    onChange(EMPTY_DATE_RANGE);
    onFilterStateChange({
      ...filterState,
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'any',
    });
    setOpen(false);
  }, [onChange, filterState, onFilterStateChange]);

  const handleMainOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setDraft(value);
        setOpen(true);
      } else {
        onChange(draft);
        setOpen(false);
      }
    },
    [value, draft, onChange]
  );

  return (
    <Popover open={open} onOpenChange={handleMainOpenChange} modal>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Scheduled date"
          active={active}
          count={
            (dateRangeActive ? 1 : 0) +
            (filterState.dateConfirmedFilter !== 'any' ? 1 : 0) +
            (filterState.timeConfirmedFilter !== 'any' ? 1 : 0)
          }
          onClear={handleClearTrigger}
          clearAriaLabel="Clear scheduled date filter"
        />
      </PopoverTrigger>
      <PopoverContent
        className={cn(FILTER_PANEL_MIN_WIDTH, 'w-auto p-0')}
        align="start"
      >
        <ScheduledDateFilterPanel
          value={draft}
          onChange={(next) => {
            setDraft(next);
            onChange(next);
          }}
          filterState={filterState}
          onFilterStateChange={onFilterStateChange}
        />
      </PopoverContent>
    </Popover>
  );
}
