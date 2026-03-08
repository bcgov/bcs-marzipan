import {
  addDays,
  addMonths,
  format,
  startOfDay,
  subDays,
  subMonths,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/** Past-oriented presets for start date. */
export const START_PRESETS = [
  {
    label: 'Today',
    getStart: () => format(startOfDay(new Date()), 'yyyy-MM-dd'),
  },
  {
    label: '7 days ago',
    getStart: () => format(subDays(startOfDay(new Date()), 7), 'yyyy-MM-dd'),
  },
  {
    label: '14 days ago',
    getStart: () => format(subDays(startOfDay(new Date()), 14), 'yyyy-MM-dd'),
  },
  {
    label: '1 month ago',
    getStart: () => format(subMonths(startOfDay(new Date()), 1), 'yyyy-MM-dd'),
  },
  {
    label: '3 months ago',
    getStart: () => format(subMonths(startOfDay(new Date()), 3), 'yyyy-MM-dd'),
  },
] as const;

/** Future-oriented presets for end date. */
export const END_PRESETS = [
  {
    label: 'Today',
    getEnd: () => format(startOfDay(new Date()), 'yyyy-MM-dd'),
  },
  {
    label: '7 days out',
    getEnd: () => format(addDays(startOfDay(new Date()), 7), 'yyyy-MM-dd'),
  },
  {
    label: '14 days out',
    getEnd: () => format(addDays(startOfDay(new Date()), 14), 'yyyy-MM-dd'),
  },
  {
    label: '1 month out',
    getEnd: () => format(addMonths(startOfDay(new Date()), 1), 'yyyy-MM-dd'),
  },
  {
    label: '3 months out',
    getEnd: () => format(addMonths(startOfDay(new Date()), 3), 'yyyy-MM-dd'),
  },
] as const;

export interface DateRangeValue {
  startDate: string;
  endDate: string;
  noStartDate: boolean;
  noEndDate: boolean;
}

export interface ScheduledDateRangeFieldsProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Label for the end-date "no date" control (e.g. "No end date (all upcoming pitches)"). Default "Reset". */
  endNoDateLabel?: string;
  /** Label for the clear button. Default "Clear dates". */
  clearButtonLabel?: string;
  /** Called after clear is applied (e.g. parent can close popover). */
  onAfterClear?: () => void;
}

const calendarYearFrom = new Date().getFullYear() - 5;
const calendarYearTo = new Date().getFullYear() + 5;

const calendarDropdownCaptionClassNames = {
  caption:
    'flex flex-row justify-center items-center gap-2 pt-1 relative w-full',
  caption_label: 'hidden',
  caption_dropdowns: 'flex flex-row gap-3 items-center flex-1 justify-center',
  dropdown_month: '',
  dropdown_year: '',
};

const calendarFormatters = {
  formatMonthCaption: (date: Date) => format(date, 'MMM'),
};

const calendarDropdownLabels = {
  labelMonthDropdown: () => '',
  labelYearDropdown: () => '',
};

export function ScheduledDateRangeFields({
  value,
  onChange,
  endNoDateLabel = 'Reset',
  clearButtonLabel = 'Clear dates',
  onAfterClear,
}: ScheduledDateRangeFieldsProps) {
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

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

  const startDateObj = value.startDate
    ? new Date(value.startDate + 'T12:00:00')
    : undefined;
  const endDateObj = value.endDate
    ? new Date(value.endDate + 'T12:00:00')
    : undefined;

  const handleStartSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      onChange({
        ...value,
        startDate: format(date, 'yyyy-MM-dd'),
        noStartDate: false,
      });
    },
    [value, onChange]
  );

  const handleEndSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      onChange({
        ...value,
        endDate: format(date, 'yyyy-MM-dd'),
        noEndDate: false,
      });
    },
    [value, onChange]
  );

  const handleStartPreset = useCallback(
    (getStart: () => string) => {
      onChange({
        ...value,
        startDate: getStart(),
        noStartDate: false,
      });
    },
    [value, onChange]
  );

  const handleEndPreset = useCallback(
    (getEnd: () => string) => {
      onChange({
        ...value,
        endDate: getEnd(),
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'min-w-[160px] flex-1 justify-start text-left font-normal',
                !value.startDate &&
                  !value.noStartDate &&
                  'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {startLabel}
              <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col items-center p-3">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">Select start date</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!value.startDate}
                  className={cn('text-sm', value.startDate && 'text-primary')}
                  onClick={handleStartNoDate}
                >
                  Reset
                </Button>
              </div>
              <div className="flex w-full flex-col items-center">
                <div className="flex w-fit flex-col">
                  <Calendar
                    mode="single"
                    selected={startDateObj}
                    onSelect={handleStartSelect}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    defaultMonth={startDateObj ?? new Date()}
                    fromYear={calendarYearFrom}
                    toYear={calendarYearTo}
                    classNames={calendarDropdownCaptionClassNames}
                    formatters={calendarFormatters}
                    labels={calendarDropdownLabels}
                    disabled={(date) =>
                      Boolean(
                        value.endDate &&
                        date > new Date(value.endDate + 'T23:59:59')
                      )
                    }
                  />
                </div>
              </div>
              <div className="w-full border-t pt-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex justify-center gap-1.5">
                    {START_PRESETS.slice(0, 3).map((p) => (
                      <Button
                        key={p.label}
                        variant="outline"
                        size="sm"
                        className="text-[14px]"
                        onClick={() => handleStartPreset(p.getStart)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {START_PRESETS.slice(3, 5).map((p) => (
                      <Button
                        key={p.label}
                        variant="outline"
                        size="sm"
                        className="text-[14px]"
                        onClick={() => handleStartPreset(p.getStart)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground shrink-0" aria-hidden>
          →
        </span>
        <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'min-w-[160px] flex-1 justify-start text-left font-normal',
                !value.endDate && !value.noEndDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {endLabel}
              <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col items-center p-3">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">Select end date</span>
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
              </div>
              <div className="flex w-full flex-col items-center">
                <div className="flex w-fit flex-col">
                  <Calendar
                    mode="single"
                    selected={endDateObj}
                    onSelect={handleEndSelect}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    defaultMonth={endDateObj ?? new Date()}
                    fromYear={calendarYearFrom}
                    toYear={calendarYearTo}
                    classNames={calendarDropdownCaptionClassNames}
                    formatters={calendarFormatters}
                    labels={calendarDropdownLabels}
                    disabled={(date) =>
                      Boolean(
                        value.startDate &&
                        date < new Date(value.startDate + 'T00:00:00')
                      )
                    }
                  />
                </div>
              </div>
              <div className="w-full border-t pt-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex justify-center gap-1.5">
                    {END_PRESETS.slice(0, 3).map((p) => (
                      <Button
                        key={p.label}
                        variant="outline"
                        size="sm"
                        className="text-[14px]"
                        onClick={() => handleEndPreset(p.getEnd)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {END_PRESETS.slice(3, 5).map((p) => (
                      <Button
                        key={p.label}
                        variant="outline"
                        size="sm"
                        className="text-[14px]"
                        onClick={() => handleEndPreset(p.getEnd)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground w-full"
        onClick={handleClear}
      >
        {clearButtonLabel}
      </Button>
    </div>
  );
}
