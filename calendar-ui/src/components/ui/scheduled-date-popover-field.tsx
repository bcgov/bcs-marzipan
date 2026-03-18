import { format, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/table/tableConstants';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  parseIsoDateLocal,
  type ScheduledDatePreset,
} from '@/lib/scheduled-date-presets';
import { cn } from '@/lib/utils';

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

function focusTabbableDay(containerRef: RefObject<HTMLDivElement | null>) {
  requestAnimationFrame(() => {
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      'table button[tabindex="0"]:not([disabled])'
    );
    btn?.focus();
  });
}

export interface ScheduledDatePopoverFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  /** Resolved label on the trigger (formatted date, placeholder, or filter copy). */
  label: string;
  /** Muted trigger text when no concrete date (form empty state). */
  triggerMuted?: boolean;
  disabled?: boolean;
  popoverTitle: string;
  /** e.g. filter "Clear" / "No end date" ghost action */
  headerRight?: ReactNode;
  presets?: ScheduledDatePreset[];
  /**
   * Called when user clicks a preset; anchor should be start-of-day normalized.
   * Required when presets is non-empty.
   */
  getPresetAnchor?: () => Date;
  showPresets?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  popoverContentClassName?: string;
  triggerClassName?: string;
  align?: 'start' | 'center' | 'end';
  triggerAriaLabel?: string;
  /**
   * `form`: same height as Input/Select (`--input-height` / `form-field-tokens`) via Button `size="input"`.
   * `filter`: compact row for table filters (default).
   */
  triggerVariant?: 'filter' | 'form';
}

export function ScheduledDatePopoverField({
  value,
  onChange,
  label,
  triggerMuted = false,
  disabled = false,
  popoverTitle,
  headerRight,
  presets,
  getPresetAnchor,
  showPresets,
  isDateDisabled = () => false,
  popoverContentClassName,
  triggerClassName,
  align = 'start',
  triggerAriaLabel,
  triggerVariant = 'filter',
}: ScheduledDatePopoverFieldProps) {
  const isFormTrigger = triggerVariant === 'form';
  const calendarRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const effectivePresets = presets ?? [];
  const showPresetSection =
    showPresets !== false &&
    effectivePresets.length > 0 &&
    getPresetAnchor !== undefined;

  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    value ? startOfMonth(parseIsoDateLocal(value)) : startOfMonth(new Date())
  );

  useEffect(() => {
    if (value) {
      setCalendarMonth(startOfMonth(parseIsoDateLocal(value)));
    }
  }, [value]);

  const selectedDate = useMemo(
    () => (value ? parseIsoDateLocal(value) : undefined),
    [value]
  );

  const placeholderDay = useMemo(
    () => getPlaceholderDay(calendarMonth, selectedDate, isDateDisabled),
    [calendarMonth, selectedDate, isDateDisabled]
  );

  const modifiers = useMemo(
    () => (placeholderDay ? { placeholder: placeholderDay } : undefined),
    [placeholderDay]
  );

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      onChange(format(date, 'yyyy-MM-dd'));
    },
    [onChange]
  );

  const handlePreset = useCallback(
    (preset: ScheduledDatePreset) => {
      if (!getPresetAnchor) return;
      const anchor = startOfDay(getPresetAnchor());
      onChange(preset.toIsoDate(anchor));
      setOpen(false);
    },
    [getPresetAnchor, onChange]
  );

  const handleMonthChange = useCallback((month: Date) => {
    setCalendarMonth(month);
    focusTabbableDay(calendarRef);
  }, []);

  const firstRow = effectivePresets.slice(0, 3);
  const secondRow = effectivePresets.slice(3, 5);

  return (
    <div
      className={cn(
        isFormTrigger ? 'w-full max-w-full min-w-0 flex-1' : 'min-w-0 flex-1'
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={isFormTrigger ? 'input' : 'sm'}
            disabled={disabled}
            aria-label={triggerAriaLabel}
            className={cn(
              'justify-start text-left font-normal',
              isFormTrigger ? 'w-full min-w-0' : 'w-full min-w-[160px] flex-1',
              triggerMuted && 'text-muted-foreground',
              triggerClassName
            )}
          >
            <CalendarIcon
              className={cn(
                'mr-2 shrink-0',
                isFormTrigger ? 'size-4' : 'h-3.5 w-3.5'
              )}
            />
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            <ChevronDown
              className={cn(
                'ml-2 shrink-0 opacity-50',
                isFormTrigger ? 'size-4' : 'h-3.5 w-3.5'
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            FILTER_PANEL_MIN_WIDTH,
            'w-auto p-0',
            popoverContentClassName
          )}
          align={align}
        >
          <div className="flex flex-col items-center p-3">
            <div
              className={cn(
                'flex w-full min-w-0 items-center justify-between gap-2',
                isFormTrigger && 'min-h-9'
              )}
            >
              <span className="text-sm leading-none font-medium">
                {popoverTitle}
              </span>
              <div
                className={cn(
                  'flex shrink-0 items-center justify-end',
                  isFormTrigger && 'min-h-9 min-w-13'
                )}
              >
                {headerRight}
              </div>
            </div>
            <div
              ref={calendarRef}
              className="flex w-full flex-col items-center"
            >
              <div className="flex w-fit flex-col">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  month={calendarMonth}
                  onMonthChange={handleMonthChange}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={calendarYearFrom}
                  toYear={calendarYearTo}
                  classNames={calendarDropdownCaptionClassNames}
                  formatters={calendarFormatters}
                  labels={calendarDropdownLabels}
                  disabled={isDateDisabled}
                  modifiers={modifiers}
                  modifiersClassNames={PLACEHOLDER_MODIFIER_CLASS_NAMES}
                />
              </div>
            </div>
            {showPresetSection ? (
              <div className="w-full border-t pt-4">
                <div className="flex flex-col items-center gap-1.5">
                  {firstRow.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {firstRow.map((p) => (
                        <Button
                          key={p.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[14px]"
                          onClick={() => handlePreset(p)}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  {secondRow.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {secondRow.map((p) => (
                        <Button
                          key={p.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[14px]"
                          onClick={() => handlePreset(p)}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
