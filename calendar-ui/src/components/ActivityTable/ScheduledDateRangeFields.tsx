import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/Table/tableConstants';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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

/** True when the date range has any constraint (dates set or "no start/end date" toggles). */
export function isDateRangeActive(dateRange: DateRangeValue): boolean {
  return (
    dateRange.startDate !== '' ||
    dateRange.endDate !== '' ||
    dateRange.noStartDate ||
    dateRange.noEndDate
  );
}

/**
 * For use only inside DropdownMenuContent or DropdownMenuSubContent.
 * Date buttons are wrapped in DropdownMenuItem so they participate in
 * the menu's roving tabindex (arrow-key navigation).
 */
export interface ScheduledDateRangeFieldsProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Label for the start-date clear control in the calendar. Default "Clear". */
  startNoDateLabel?: string;
  /** Label for the end-date "no date" control (e.g. "No end date (all upcoming pitches)"). Default "Clear". */
  endNoDateLabel?: string;
  /** Label for the clear button. Default "Clear dates". */
  clearButtonLabel?: string;
  /** When false, the clear button below the inputs is hidden (caller renders clear in header). Default true. */
  showClearButton?: boolean;
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

const PLACEHOLDER_MODIFIER_CLASS_NAMES = {
  placeholder: 'bg-accent text-accent-foreground',
};

/**
 * Returns the first non-disabled day of `visibleMonth` when neither `selected`
 * nor today falls within that month. Used as a visual focus-target placeholder
 * so the calendar grid always has an obvious anchor day.
 */
function getPlaceholderDay(
  visibleMonth: Date,
  selected: Date | undefined,
  isDisabled: (date: Date) => boolean
): Date | undefined {
  const today = startOfDay(new Date());
  if (selected && isSameMonth(selected, visibleMonth)) return undefined;
  if (isSameMonth(today, visibleMonth)) return undefined;

  const monthStart = startOfMonth(visibleMonth);
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  ).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
    if (!isDisabled(date)) return date;
  }
  return undefined;
}

/**
 * After a month change, react-day-picker recalculates which day gets
 * `tabIndex={0}` (selected > today > first focusable). However it only calls
 * `.focus()` on mount via `initialFocus`. This helper focuses the new
 * tabbable day after re-render so arrow-key navigation works immediately.
 */
function focusTabbableDay(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  requestAnimationFrame(() => {
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      'table button[tabindex="0"]:not([disabled])'
    );
    btn?.focus();
  });
}

export function ScheduledDateRangeFields({
  value,
  onChange,
  startNoDateLabel = 'Clear',
  endNoDateLabel = 'Clear',
  clearButtonLabel = 'Clear dates',
  showClearButton = true,
  onAfterClear,
}: ScheduledDateRangeFieldsProps) {
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  const [startCalendarMonth, setStartCalendarMonth] = useState<Date>(() =>
    value.startDate
      ? startOfMonth(new Date(value.startDate + 'T12:00:00'))
      : startOfMonth(new Date())
  );
  const [endCalendarMonth, setEndCalendarMonth] = useState<Date>(() =>
    value.endDate
      ? startOfMonth(new Date(value.endDate + 'T12:00:00'))
      : startOfMonth(new Date())
  );

  useEffect(() => {
    if (value.startDate) {
      setStartCalendarMonth(
        startOfMonth(new Date(value.startDate + 'T12:00:00'))
      );
    }
  }, [value.startDate]);

  useEffect(() => {
    if (value.endDate) {
      setEndCalendarMonth(startOfMonth(new Date(value.endDate + 'T12:00:00')));
    }
  }, [value.endDate]);

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

  const startPlaceholder = useMemo(
    () => getPlaceholderDay(startCalendarMonth, startDateObj, isStartDisabled),
    [startCalendarMonth, startDateObj, isStartDisabled]
  );
  const endPlaceholder = useMemo(
    () => getPlaceholderDay(endCalendarMonth, endDateObj, isEndDisabled),
    [endCalendarMonth, endDateObj, isEndDisabled]
  );

  const startModifiers = useMemo(
    () => (startPlaceholder ? { placeholder: startPlaceholder } : undefined),
    [startPlaceholder]
  );
  const endModifiers = useMemo(
    () => (endPlaceholder ? { placeholder: endPlaceholder } : undefined),
    [endPlaceholder]
  );

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

  const handleStartMonthChange = useCallback((month: Date) => {
    setStartCalendarMonth(month);
    focusTabbableDay(startCalendarRef);
  }, []);

  const handleEndMonthChange = useCallback((month: Date) => {
    setEndCalendarMonth(month);
    focusTabbableDay(endCalendarRef);
  }, []);

  const handleStartDateKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
            cancelable: true,
          })
        );
      }
    },
    []
  );

  const handleEndDateKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowUp',
            bubbles: true,
            cancelable: true,
          })
        );
      }
    },
    []
  );

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
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
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
                onKeyDown={handleStartDateKeyDown}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {startLabel}
                <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
          </DropdownMenuItem>
          <PopoverContent
            className={cn(FILTER_PANEL_MIN_WIDTH, 'w-auto p-0')}
            align="start"
          >
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
                  {startNoDateLabel}
                </Button>
              </div>
              <div
                ref={startCalendarRef}
                className="flex w-full flex-col items-center"
              >
                <div className="flex w-fit flex-col">
                  <Calendar
                    mode="single"
                    selected={startDateObj}
                    onSelect={handleStartSelect}
                    month={startCalendarMonth}
                    onMonthChange={handleStartMonthChange}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={calendarYearFrom}
                    toYear={calendarYearTo}
                    classNames={calendarDropdownCaptionClassNames}
                    formatters={calendarFormatters}
                    labels={calendarDropdownLabels}
                    disabled={isStartDisabled}
                    modifiers={startModifiers}
                    modifiersClassNames={PLACEHOLDER_MODIFIER_CLASS_NAMES}
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
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'min-w-[160px] flex-1 justify-start text-left font-normal',
                  !value.endDate && !value.noEndDate && 'text-muted-foreground'
                )}
                onKeyDown={handleEndDateKeyDown}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {endLabel}
                <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
          </DropdownMenuItem>
          <PopoverContent
            className={cn(FILTER_PANEL_MIN_WIDTH, 'w-auto p-0')}
            align="start"
          >
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
              <div
                ref={endCalendarRef}
                className="flex w-full flex-col items-center"
              >
                <div className="flex w-fit flex-col">
                  <Calendar
                    mode="single"
                    selected={endDateObj}
                    onSelect={handleEndSelect}
                    month={endCalendarMonth}
                    onMonthChange={handleEndMonthChange}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={calendarYearFrom}
                    toYear={calendarYearTo}
                    classNames={calendarDropdownCaptionClassNames}
                    formatters={calendarFormatters}
                    labels={calendarDropdownLabels}
                    disabled={isEndDisabled}
                    modifiers={endModifiers}
                    modifiersClassNames={PLACEHOLDER_MODIFIER_CLASS_NAMES}
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
      {showClearButton && (
        <Button
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
