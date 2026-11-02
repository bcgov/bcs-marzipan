import { Clock } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { formatTime12h } from '@/lib/datetime-utils';
import { FORM_CONTROL_INVALID_RING_CLASS } from '@/lib/form-field-tokens';
import { READ_ONLY_STATIC_TRIGGER } from '@/lib/read-only-static-field';
import {
  clampHour12,
  clampMinute,
  derivePickerPreviewParts,
  FIVE_MINUTE_OPTIONS,
  hhmmToTwelveHourParts,
  HOUR12_OPTIONS,
  nearestFiveMinute,
  snapMinuteToFive,
  twelveHourPartsToHHmm,
} from '@/lib/time-input-utils';
import { cn } from '@/lib/utils';

/** Hour/minute columns: shared width, padding, and scrollbar styling (see globals `.popover-list-scroll`). */
const TIME_PICKER_SCROLL_COL_CLASS =
  'popover-list-scroll flex flex-row gap-0 overflow-x-auto px-3 py-2.5 sm:h-full sm:min-h-0 sm:min-w-[3.25rem] sm:flex-col sm:overflow-y-scroll sm:[scrollbar-gutter:stable]';

const TIME_PICKER_PERIOD_COL_CLASS =
  'flex flex-row gap-0 overflow-x-auto px-3 py-2.5 sm:h-full sm:min-h-0 sm:min-w-[2.75rem] sm:flex-col sm:justify-center';

const TIME_PICKER_GRID_CLASS =
  'flex max-h-[min(320px,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col divide-y overflow-y-auto sm:h-[min(320px,70vh)] sm:min-h-0 sm:w-auto sm:flex-row sm:divide-x sm:divide-y-0';

function focusPickerCell(el: HTMLButtonElement | null | undefined) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

export type TimePickerAllDayProps = {
  isAllDay: boolean;
  onAllDayChange: (checked: boolean) => void;
  label: string;
};

export type TimePickerProps = {
  value: string;
  onChange: (next: string | undefined) => void;
  readOnly?: boolean;
  /** When value is empty, muted trigger styling */
  placeholderMuted?: boolean;
  /** Accessible name for the trigger button */
  ariaLabel: string;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  /**
   * All-day switch at top of popover; when true, trigger shows `label` and the scroll columns are disabled.
   */
  allDay?: TimePickerAllDayProps;
} & Omit<
  ComponentPropsWithoutRef<typeof Button>,
  'type' | 'variant' | 'size' | 'children' | 'onClick' | 'onChange'
>;

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
  function TimePicker(
    {
      value,
      onChange,
      readOnly = false,
      placeholderMuted = false,
      ariaLabel,
      popoverOpen,
      onPopoverOpenChange,
      allDay,
      ...triggerProps
    },
    ref
  ) {
    const { className: slotClassName, ...buttonPassthrough } = triggerProps;

    const baseId = useId();
    const allDaySwitchId = `${baseId}-all-day`;

    const [hourDraft, setHourDraft] = useState('');
    const [minDraft, setMinDraft] = useState('');
    const [isPm, setIsPm] = useState(false);

    /** Ignore Radix dismiss callbacks briefly after open (avoids open→immediate close). */
    const suppressDismissRef = useRef(false);

    const [portalHostEl, setPortalHostEl] = useState<HTMLDivElement | null>(
      null
    );
    const [hourRovingIndex, setHourRovingIndex] = useState(0);
    const [minuteRovingIndex, setMinuteRovingIndex] = useState(0);
    const [periodRovingIndex, setPeriodRovingIndex] = useState(0);
    const hourBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const minuteBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const periodBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const rovingInitDoneRef = useRef(false);

    useEffect(() => {
      const nextParts = hhmmToTwelveHourParts(value);
      if (nextParts) {
        setHourDraft(String(nextParts.hour12));
        setMinDraft(String(nextParts.minute).padStart(2, '0'));
        setIsPm(nextParts.isPm);
      } else {
        setHourDraft('');
        setMinDraft('');
        setIsPm(false);
      }
    }, [value]);

    useLayoutEffect(() => {
      if (!popoverOpen) return;
      suppressDismissRef.current = true;
      const t = window.setTimeout(() => {
        suppressDismissRef.current = false;
      }, 200);
      return () => window.clearTimeout(t);
    }, [popoverOpen]);

    const handleRadixOpenChange = useCallback(
      (next: boolean) => {
        if (!next && suppressDismissRef.current) return;
        onPopoverOpenChange(next);
      },
      [onPopoverOpenChange]
    );

    const handleAllDayCheckedChange = useCallback(
      (checked: boolean) => {
        if (!allDay) return;
        allDay.onAllDayChange(checked);
      },
      [allDay]
    );

    const pickerPreviewParts = useMemo(
      () =>
        derivePickerPreviewParts({
          value,
          hourDraft,
          minDraft,
          isPm,
        }),
      [value, hourDraft, minDraft, isPm]
    );

    const displayMinuteForPicker =
      pickerPreviewParts != null
        ? nearestFiveMinute(pickerPreviewParts.minute)
        : null;

    const handlePickerHour = (h: number) => {
      const hClamped = clampHour12(h);
      const m = clampMinute(parseInt(minDraft || '0', 10) || 0);
      const mUse = snapMinuteToFive(m);
      setHourDraft(String(hClamped));
      setMinDraft(String(mUse).padStart(2, '0'));
      const next = twelveHourPartsToHHmm({
        hour12: hClamped,
        minute: mUse,
        isPm,
      });
      onChange(next);
    };

    const handlePickerMinute = (m: number) => {
      const h = clampHour12(parseInt(hourDraft || '12', 10));
      const snapped = snapMinuteToFive(m);
      setMinDraft(String(snapped).padStart(2, '0'));
      const next = twelveHourPartsToHHmm({
        hour12: h,
        minute: snapped,
        isPm,
      });
      onChange(next);
    };

    const handlePickerPeriod = (pm: boolean) => {
      setIsPm(pm);
      const h = clampHour12(parseInt(hourDraft || '12', 10));
      const m = clampMinute(parseInt(minDraft || '0', 10) || 0);
      const next = twelveHourPartsToHHmm({
        hour12: h,
        minute: m,
        isPm: pm,
      });
      onChange(next);
    };

    const pickerDisabled = Boolean(allDay?.isAllDay);

    useLayoutEffect(() => {
      if (!popoverOpen || readOnly) {
        rovingInitDoneRef.current = false;
        return;
      }
      if (rovingInitDoneRef.current) return;
      rovingInitDoneRef.current = true;

      const h = pickerPreviewParts?.hour12 ?? 12;
      const hi = HOUR12_OPTIONS.findIndex((x) => x === h);
      setHourRovingIndex(hi >= 0 ? hi : 0);

      const m =
        displayMinuteForPicker ??
        nearestFiveMinute(clampMinute(parseInt(minDraft || '0', 10) || 0));
      const mi = FIVE_MINUTE_OPTIONS.indexOf(m);
      setMinuteRovingIndex(mi >= 0 ? mi : 0);

      setPeriodRovingIndex(pickerPreviewParts?.isPm ? 1 : 0);

      const focusIndex = hi >= 0 ? hi : 0;
      requestAnimationFrame(() => {
        if (pickerDisabled) return;
        focusPickerCell(hourBtnRefs.current[focusIndex]);
      });
    }, [
      popoverOpen,
      readOnly,
      pickerPreviewParts,
      displayMinuteForPicker,
      minDraft,
      pickerDisabled,
    ]);

    const handlePopoverOpenAutoFocus = useCallback((e: Event) => {
      e.preventDefault();
    }, []);

    const viewOnly = readOnly;
    const showMuted =
      placeholderMuted && !value && !viewOnly && !allDay?.isAllDay;

    const triggerText = allDay?.isAllDay
      ? allDay.label
      : value
        ? formatTime12h(value)
        : '--:--';

    if (viewOnly) {
      return (
        <div className={cn('relative w-full min-w-0 flex-1', slotClassName)}>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            size="input"
            tabIndex={-1}
            aria-readonly
            aria-label={ariaLabel}
            className={cn(
              'pointer-events-none w-full min-w-0 justify-start text-left font-normal',
              FORM_CONTROL_INVALID_RING_CLASS,
              READ_ONLY_STATIC_TRIGGER,
              !value && !allDay?.isAllDay && 'text-foreground'
            )}
            {...buttonPassthrough}
          >
            <Clock
              className={cn(
                'mr-2 size-4 shrink-0',
                value || allDay?.isAllDay
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-left">
              {triggerText === '--:--' && !allDay?.isAllDay
                ? '\u00a0'
                : triggerText}
            </span>
          </Button>
        </div>
      );
    }

    return (
      <div
        ref={setPortalHostEl}
        className={cn('relative w-full min-w-0 flex-1', slotClassName)}
      >
        <Popover
          modal={false}
          open={popoverOpen}
          onOpenChange={handleRadixOpenChange}
        >
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              type="button"
              variant="outline"
              size="input"
              aria-label={ariaLabel}
              aria-expanded={popoverOpen}
              className={cn(
                'w-full min-w-0 justify-start text-left font-normal',
                FORM_CONTROL_INVALID_RING_CLASS,
                showMuted && 'text-muted-foreground',
                slotClassName
              )}
              {...buttonPassthrough}
            >
              <Clock className="mr-2 size-4 shrink-0 opacity-70" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-left">
                {triggerText}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            container={portalHostEl}
            data-time-picker-popover=""
            align="start"
            sideOffset={4}
            className="w-auto p-0 sm:flex"
            onOpenAutoFocus={handlePopoverOpenAutoFocus}
          >
            <div className="flex w-full flex-col outline-none">
              {allDay ? (
                <div className="border-border w-full border-b px-3 py-3">
                  <div className="flex flex-row items-center gap-2">
                    <Switch
                      id={allDaySwitchId}
                      checked={allDay.isAllDay}
                      readOnly={readOnly}
                      onCheckedChange={handleAllDayCheckedChange}
                    />
                    <label
                      htmlFor={allDaySwitchId}
                      className="cursor-pointer text-sm leading-none font-medium"
                    >
                      {allDay.label}
                    </label>
                  </div>
                </div>
              ) : null}
              <div className={TIME_PICKER_GRID_CLASS} role="presentation">
                <div
                  className={TIME_PICKER_SCROLL_COL_CLASS}
                  role="group"
                  aria-label={`${ariaLabel}, hour`}
                  aria-orientation="vertical"
                >
                  {HOUR12_OPTIONS.map((h, i) => (
                    <Button
                      key={h}
                      ref={(el) => {
                        hourBtnRefs.current[i] = el;
                      }}
                      type="button"
                      size="icon"
                      tabIndex={
                        pickerDisabled || i !== hourRovingIndex ? -1 : 0
                      }
                      disabled={pickerDisabled}
                      variant={
                        !pickerDisabled &&
                        pickerPreviewParts &&
                        pickerPreviewParts.hour12 === h
                          ? 'default'
                          : 'ghost'
                      }
                      className="shrink-0 sm:aspect-square sm:w-full"
                      onClick={() => {
                        setHourRovingIndex(i);
                        handlePickerHour(h);
                      }}
                      onKeyDown={(e) => {
                        if (pickerDisabled) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const next = Math.min(
                            HOUR12_OPTIONS.length - 1,
                            i + 1
                          );
                          setHourRovingIndex(next);
                          focusPickerCell(hourBtnRefs.current[next]);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const next = Math.max(0, i - 1);
                          setHourRovingIndex(next);
                          focusPickerCell(hourBtnRefs.current[next]);
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          setHourRovingIndex(0);
                          focusPickerCell(hourBtnRefs.current[0]);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          const last = HOUR12_OPTIONS.length - 1;
                          setHourRovingIndex(last);
                          focusPickerCell(hourBtnRefs.current[last]);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          focusPickerCell(
                            minuteBtnRefs.current[minuteRovingIndex]
                          );
                        }
                      }}
                    >
                      {h}
                    </Button>
                  ))}
                </div>
                <div
                  className={TIME_PICKER_SCROLL_COL_CLASS}
                  role="group"
                  aria-label={`${ariaLabel}, minutes`}
                  aria-orientation="vertical"
                >
                  {FIVE_MINUTE_OPTIONS.map((m, i) => (
                    <Button
                      key={m}
                      ref={(el) => {
                        minuteBtnRefs.current[i] = el;
                      }}
                      type="button"
                      size="icon"
                      tabIndex={
                        pickerDisabled || i !== minuteRovingIndex ? -1 : 0
                      }
                      disabled={pickerDisabled}
                      variant={
                        !pickerDisabled &&
                        pickerPreviewParts != null &&
                        displayMinuteForPicker === m
                          ? 'default'
                          : 'ghost'
                      }
                      className="shrink-0 sm:aspect-square sm:w-full"
                      onClick={() => {
                        setMinuteRovingIndex(i);
                        handlePickerMinute(m);
                      }}
                      onKeyDown={(e) => {
                        if (pickerDisabled) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const next = Math.min(
                            FIVE_MINUTE_OPTIONS.length - 1,
                            i + 1
                          );
                          setMinuteRovingIndex(next);
                          focusPickerCell(minuteBtnRefs.current[next]);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const next = Math.max(0, i - 1);
                          setMinuteRovingIndex(next);
                          focusPickerCell(minuteBtnRefs.current[next]);
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          setMinuteRovingIndex(0);
                          focusPickerCell(minuteBtnRefs.current[0]);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          const last = FIVE_MINUTE_OPTIONS.length - 1;
                          setMinuteRovingIndex(last);
                          focusPickerCell(minuteBtnRefs.current[last]);
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          focusPickerCell(hourBtnRefs.current[hourRovingIndex]);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          focusPickerCell(
                            periodBtnRefs.current[periodRovingIndex]
                          );
                        }
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </Button>
                  ))}
                </div>
                <div
                  className={TIME_PICKER_PERIOD_COL_CLASS}
                  role="group"
                  aria-label={`${ariaLabel}, am or pm`}
                  aria-orientation="vertical"
                >
                  {(['am', 'pm'] as const).map((p, i) => {
                    const pm = p === 'pm';
                    return (
                      <Button
                        key={p}
                        ref={(el) => {
                          periodBtnRefs.current[i] = el;
                        }}
                        type="button"
                        size="icon"
                        tabIndex={
                          pickerDisabled || i !== periodRovingIndex ? -1 : 0
                        }
                        disabled={pickerDisabled}
                        variant={
                          !pickerDisabled &&
                          pickerPreviewParts &&
                          pickerPreviewParts.isPm === pm
                            ? 'default'
                            : 'ghost'
                        }
                        className="shrink-0 lowercase sm:aspect-square sm:w-full"
                        onClick={() => {
                          setPeriodRovingIndex(i);
                          handlePickerPeriod(pm);
                        }}
                        onKeyDown={(e) => {
                          if (pickerDisabled) return;
                          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                            e.preventDefault();
                            const next = i === 0 ? 1 : 0;
                            setPeriodRovingIndex(next);
                            focusPickerCell(periodBtnRefs.current[next]);
                          } else if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            focusPickerCell(
                              minuteBtnRefs.current[minuteRovingIndex]
                            );
                          }
                        }}
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
