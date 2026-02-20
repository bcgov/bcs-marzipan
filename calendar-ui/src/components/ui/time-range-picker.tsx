import { Clock } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface TimeRangePickerProps {
  startTime?: string;
  endTime?: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  placeholder = 'Pick a time range',
}: TimeRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [localStartTime, setLocalStartTime] = React.useState(startTime || '');
  const [localEndTime, setLocalEndTime] = React.useState(endTime || '');

  // Sync local state when props change
  React.useEffect(() => {
    setLocalStartTime(startTime || '');
  }, [startTime]);

  React.useEffect(() => {
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

  const displayText = React.useMemo(() => {
    if (!startTime && !endTime) {
      return placeholder;
    }
    const parts = [];
    if (startTime) parts.push(startTime);
    if (endTime) parts.push(endTime);
    return parts.join(' - ');
  }, [startTime, endTime, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !startTime && !endTime && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
