import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import {
  ScheduledDateRangeFields,
  type DateRangeValue,
} from './ScheduledDateRangeFields';

export type { DateRangeValue } from './ScheduledDateRangeFields';

interface ScheduledDateFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

function isDateRangeActive(dateRange: DateRangeValue): boolean {
  return (
    dateRange.startDate !== '' ||
    dateRange.endDate !== '' ||
    dateRange.noStartDate ||
    dateRange.noEndDate
  );
}

export function ScheduledDateFilter({
  value,
  onChange,
}: ScheduledDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(() => value);
  const commitOnCloseRef = useRef<DateRangeValue | null>(null);

  const active = isDateRangeActive(value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  const handleClearTrigger = useCallback(() => {
    onChange({
      startDate: '',
      endDate: '',
      noStartDate: false,
      noEndDate: false,
    });
    setOpen(false);
  }, [onChange]);

  const handleMainOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        commitOnCloseRef.current = null;
        setDraft(value);
        setOpen(true);
      } else {
        const toCommit = commitOnCloseRef.current ?? draft;
        commitOnCloseRef.current = null;
        onChange(toCommit);
        setOpen(false);
      }
    },
    [value, draft, onChange]
  );

  const handleDraftChange = useCallback((next: DateRangeValue) => {
    setDraft(next);
  }, []);

  const handleAfterClear = useCallback(() => {
    const empty = {
      startDate: '',
      endDate: '',
      noStartDate: false,
      noEndDate: false,
    };
    commitOnCloseRef.current = empty;
    setDraft(empty);
    setOpen(false);
  }, []);

  return (
    <Popover open={open} onOpenChange={handleMainOpenChange} modal>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Date"
          active={active}
          count={1}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear date filter"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <ScheduledDateRangeFields
            value={draft}
            onChange={handleDraftChange}
            clearButtonLabel="Clear dates"
            onAfterClear={handleAfterClear}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
