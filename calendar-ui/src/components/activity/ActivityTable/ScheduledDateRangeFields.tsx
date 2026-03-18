import { format, startOfDay } from 'date-fns';
import { useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { ScheduledDatePopoverField } from '@/components/ui/scheduled-date-popover-field';
import {
  PRESETS_FUTURE_FROM_ANCHOR,
  PRESETS_PAST_FROM_ANCHOR,
} from '@/lib/scheduled-date-presets';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  startDate: string;
  endDate: string;
  noStartDate: boolean;
  noEndDate: boolean;
}

/** True when the date range has any constraint (dates set or "no start/end date" toggles). */
export function isDateRangeActive(dateRange: DateRangeValue): boolean {
  return (
    dateRange.startDate !== '' ||
    dateRange.endDate !== '' ||
    dateRange.noStartDate ||
    dateRange.noEndDate
  );
}

export interface ScheduledDateRangeFieldsProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  startNoDateLabel?: string;
  endNoDateLabel?: string;
  clearButtonLabel?: string;
  showClearButton?: boolean;
  onAfterClear?: () => void;
}

const anchorToday = () => startOfDay(new Date());

export function ScheduledDateRangeFields({
  value,
  onChange,
  startNoDateLabel = 'Clear',
  endNoDateLabel = 'Clear',
  clearButtonLabel = 'Clear dates',
  showClearButton = true,
  onAfterClear,
}: ScheduledDateRangeFieldsProps) {
  const startLabel = useMemo(() => {
    if (value.noStartDate) return 'No start date';
    if (value.startDate)
      return format(new Date(value.startDate + 'T12:00:00'), 'MMM d, yyyy');
    return 'No start date';
  }, [value.startDate, value.noStartDate]);

  const endLabel = useMemo(() => {
    if (value.noEndDate) return 'No end date';
    if (value.endDate)
      return format(new Date(value.endDate + 'T12:00:00'), 'MMM d, yyyy');
    return 'No end date';
  }, [value.endDate, value.noEndDate]);

  const handleStartChange = useCallback(
    (iso: string) => {
      onChange({
        ...value,
        startDate: iso,
        noStartDate: false,
      });
    },
    [value, onChange]
  );

  const handleEndChange = useCallback(
    (iso: string) => {
      onChange({
        ...value,
        endDate: iso,
        noEndDate: false,
      });
    },
    [value, onChange]
  );

  const handleStartNoDate = useCallback(() => {
    onChange({
      ...value,
      noStartDate: true,
      startDate: '',
    });
  }, [value, onChange]);

  const handleEndNoDate = useCallback(() => {
    onChange({
      ...value,
      noEndDate: true,
      endDate: '',
    });
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    onChange({
      startDate: '',
      endDate: '',
      noStartDate: false,
      noEndDate: false,
    });
    onAfterClear?.();
  }, [onChange, onAfterClear]);

  const isStartDisabled = useCallback(
    (date: Date) =>
      Boolean(value.endDate && date > new Date(value.endDate + 'T23:59:59')),
    [value.endDate]
  );

  const isEndDisabled = useCallback(
    (date: Date) =>
      Boolean(
        value.startDate && date < new Date(value.startDate + 'T00:00:00')
      ),
    [value.startDate]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ScheduledDatePopoverField
          value={value.noStartDate ? '' : value.startDate}
          onChange={handleStartChange}
          label={startLabel}
          triggerMuted={!value.startDate && !value.noStartDate}
          popoverTitle="Select start date"
          presets={PRESETS_PAST_FROM_ANCHOR}
          getPresetAnchor={anchorToday}
          isDateDisabled={isStartDisabled}
          headerRight={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value.startDate}
              className={cn('text-sm', value.startDate && 'text-primary')}
              onClick={handleStartNoDate}
            >
              {startNoDateLabel}
            </Button>
          }
        />
        <span className="text-muted-foreground shrink-0" aria-hidden>
          →
        </span>
        <ScheduledDatePopoverField
          value={value.noEndDate ? '' : value.endDate}
          onChange={handleEndChange}
          label={endLabel}
          triggerMuted={!value.endDate && !value.noEndDate}
          popoverTitle="Select end date"
          presets={PRESETS_FUTURE_FROM_ANCHOR}
          getPresetAnchor={anchorToday}
          isDateDisabled={isEndDisabled}
          headerRight={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value.endDate}
              className={cn('text-sm', value.endDate && 'text-primary')}
              onClick={handleEndNoDate}
            >
              {endNoDateLabel}
            </Button>
          }
        />
      </div>
      {showClearButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full"
          onClick={handleClear}
        >
          {clearButtonLabel}
        </Button>
      )}
    </div>
  );
}
