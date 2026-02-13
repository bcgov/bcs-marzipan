import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  placeholder = 'Pick a date range',
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

  const handleSelect = (range: DateRange | undefined): void => {
    if (range?.from) {
      onStartDateChange(format(range.from, 'yyyy-MM-dd'));
    }
    if (range?.to) {
      onEndDateChange(format(range.to, 'yyyy-MM-dd'));
    } else if (range?.from && !range?.to) {
      // When only from is selected, clear the end date
      onEndDateChange('');
    }
  };

  const displayText = React.useMemo(() => {
    if (!startDate && !endDate) {
      return placeholder;
    }
    const parts = [];
    if (startDate) parts.push(format(new Date(startDate), 'MMM d, yyyy'));
    if (endDate) parts.push(format(new Date(endDate), 'MMM d, yyyy'));
    return parts.join(' - ');
  }, [startDate, endDate, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !startDate && !endDate && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={startDateObj}
          selected={{
            from: startDateObj,
            to: endDateObj,
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
