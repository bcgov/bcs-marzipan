import { Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Switch } from './switch';

export interface TimeRangePickerProps {
  startTime?: string;
  endTime?: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** When provided, shows an "All day" row at the top with switch left of label */
  isAllDay?: boolean;
  onAllDayChange?: (checked: boolean) => void;
  allDayLabel?: string;
  allDayDisabled?: boolean;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  placeholder = 'Pick a time range',
  isAllDay = false,
  onAllDayChange,
  allDayLabel = 'All day',
  allDayDisabled = false,
}: TimeRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [localStartTime, setLocalStartTime] = useState(startTime || '');
  const [localEndTime, setLocalEndTime] = useState(endTime || '');

  // Sync local state when props change
  useEffect(() => {
    setLocalStartTime(startTime || '');
  }, [startTime]);

  useEffect(() => {
    setLocalEndTime(endTime || '');
  }, [endTime]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalStartTime(value);
    onStartTimeChange(value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalEndTime(value);
    onEndTimeChange(value);
  };

  const displayText = useMemo(() => {
    if (isAllDay) {
      return allDayLabel;
    }
    if (!startTime && !endTime) {
      return placeholder;
    }
    const parts = [];
    if (startTime) parts.push(startTime);
    if (endTime) parts.push(endTime);
    return parts.join(' - ');
  }, [isAllDay, allDayLabel, startTime, endTime, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="input"
          className={cn(
            'w-full justify-start text-left font-normal',
            (isAllDay || (!startTime && !endTime)) && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          {onAllDayChange !== undefined && (
            <div className="flex flex-row items-center gap-2">
              <Switch
                id="time-range-picker-all-day"
                checked={isAllDay}
                disabled={allDayDisabled}
                onCheckedChange={onAllDayChange}
              />
              <label
                htmlFor="time-range-picker-all-day"
                className="text-sm font-medium"
              >
                {allDayLabel}
              </label>
            </div>
          )}
          {!isAllDay && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start time</label>
                <Input
                  type="time"
                  value={localStartTime}
                  onChange={handleStartTimeChange}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End time</label>
                <Input
                  type="time"
                  value={localEndTime}
                  onChange={handleEndTimeChange}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
