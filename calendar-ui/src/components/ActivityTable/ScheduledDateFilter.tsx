import { useCallback, useEffect, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';

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

export interface ScheduledDateFilterPanelProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

/**
 * Panel content only (no trigger). For use in ResponsiveFilterRow inline and overflow.
 */
export function ScheduledDateFilterPanel({
  value,
  onChange,
}: ScheduledDateFilterPanelProps) {
  const [draft, setDraft] = useState<DateRangeValue>(() => value);

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

  const handleAfterClear = useCallback(() => {
    onChange(EMPTY_DATE_RANGE);
    setDraft(EMPTY_DATE_RANGE);
  }, [onChange]);

  return (
    <div className="p-3">
      <ScheduledDateRangeFields
        value={draft}
        onChange={handleDraftChange}
        clearButtonLabel="Clear dates"
        onAfterClear={handleAfterClear}
      />
    </div>
  );
}

type ScheduledDateFilterProps = ScheduledDateFilterPanelProps;

export function ScheduledDateFilter({
  value,
  onChange,
}: ScheduledDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(() => value);

  const active = isDateRangeActive(value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  const handleClearTrigger = useCallback(() => {
    onChange(EMPTY_DATE_RANGE);
    setOpen(false);
  }, [onChange]);

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
          label="Date"
          active={active}
          count={1}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear date filter"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ScheduledDateFilterPanel
          value={draft}
          onChange={(next) => {
            setDraft(next);
            onChange(next);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
