import { useCallback, useEffect, useState, type MouseEvent } from 'react';

import { FilterCheckboxItem } from '@/components/ActivityTable/FilterCheckboxItem';

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

const SECTION_TITLE_CLASS =
  'text-muted-foreground px-2 py-1.5 text-xs font-normal uppercase';

export interface ScheduledDateFilterPanelProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
}

/**
 * Panel content only (no trigger). Uses plain markup so it works inside
 * Popover, DropdownMenuContent, or DropdownMenuSubContent.
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
      <div className="mb-2 flex w-full items-center justify-between gap-2">
        <span className={SECTION_TITLE_CLASS}>Date range</span>
        {dateRangeActive ? (
          <button
            type="button"
            onClick={handleClearDatesClick}
            className="text-primary focus-visible:ring-ring shrink-0 text-xs font-normal hover:underline focus-visible:ring-2 focus-visible:outline-none"
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
      <div className={SECTION_TITLE_CLASS}>Date status</div>
      <FilterCheckboxItem
        checked={dateConfirmedFilter === 'confirmed'}
        onCheckedChange={handleDateConfirmedChange}
      >
        Confirmed
      </FilterCheckboxItem>
      <FilterCheckboxItem
        checked={dateConfirmedFilter === 'not_confirmed'}
        onCheckedChange={handleDateNotConfirmedChange}
      >
        Not confirmed
      </FilterCheckboxItem>
      <div className={SECTION_TITLE_CLASS}>Time status</div>
      <FilterCheckboxItem
        checked={timeConfirmedFilter === 'confirmed'}
        onCheckedChange={handleTimeConfirmedChange}
      >
        Confirmed
      </FilterCheckboxItem>
      <FilterCheckboxItem
        checked={timeConfirmedFilter === 'not_confirmed'}
        onCheckedChange={handleTimeNotConfirmedChange}
      >
        Not confirmed
      </FilterCheckboxItem>
    </div>
  );
}

type _ScheduledDateFilterProps = ScheduledDateFilterPanelProps;

// export function ScheduledDateFilter({
//   value,
//   onChange,
//   filterState,
//   onFilterStateChange,
// }: _ScheduledDateFilterProps) {
//   const [open, setOpen] = useState(false);
//   const [draft, setDraft] = useState<DateRangeValue>(() => value);

//   const dateRangeActive = isDateRangeActive(value);
//   const confirmedActive =
//     filterState.dateConfirmedFilter !== 'any' ||
//     filterState.timeConfirmedFilter !== 'any';
//   const active = dateRangeActive || confirmedActive;

//   useEffect(() => {
//     if (!open) setDraft(value);
//   }, [open, value]);

//   const handleClearTrigger = useCallback(() => {
//     onChange(EMPTY_DATE_RANGE);
//     onFilterStateChange({
//       ...filterState,
//       dateConfirmedFilter: 'any',
//       timeConfirmedFilter: 'any',
//     });
//     setOpen(false);
//   }, [onChange, filterState, onFilterStateChange]);

//   const handleMainOpenChange = useCallback(
//     (nextOpen: boolean) => {
//       if (nextOpen) {
//         setDraft(value);
//         setOpen(true);
//       } else {
//         onChange(draft);
//         setOpen(false);
//       }
//     },
//     [value, draft, onChange]
//   );

//   return (
//     <DropdownMenu open={open} onOpenChange={handleMainOpenChange}>
//       <DropdownMenuTrigger asChild>
//         <FilterTrigger
//           label="Scheduled date"
//           active={active}
//           count={
//             (dateRangeActive ? 1 : 0) +
//             (filterState.dateConfirmedFilter !== 'any' ? 1 : 0) +
//             (filterState.timeConfirmedFilter !== 'any' ? 1 : 0)
//           }
//           onClear={handleClearTrigger}
//           clearAriaLabel="Clear scheduled date filter"
//         />
//       </DropdownMenuTrigger>
//       <DropdownMenuContent
//         className={cn(FILTER_PANEL_MIN_WIDTH, 'w-auto p-0')}
//         align="start"
//       >
//         <ScheduledDateFilterPanel
//           value={draft}
//           onChange={(next) => {
//             setDraft(next);
//             onChange(next);
//           }}
//           filterState={filterState}
//           onFilterStateChange={onFilterStateChange}
//         />
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
