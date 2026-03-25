import { Clock } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { formatTime12h } from '@/lib/datetime-utils';
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

const SEGMENT_BASE_CLASS =
  'min-w-0 border-0 bg-transparent text-sm tabular-nums shadow-none outline-none focus-visible:ring-0';

const HOUR_SEGMENT_CLASS = cn(
  SEGMENT_BASE_CLASS,
  'w-[2ch] min-w-[2ch] text-right'
);

const MINUTE_SEGMENT_CLASS = cn(
  SEGMENT_BASE_CLASS,
  'w-[2ch] min-w-[2ch] text-left'
);

/** Debounce form commit while typing so parent `value` tracks drafts (picker uses drafts immediately). */
const TYPING_COMMIT_DEBOUNCE_MS = 150;

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
  /** sr-only / aria label for the composite control */
  ariaLabel: string;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  /**
   * All-day switch at top of popover; when true, trigger shows `label` instead of segments and the picker is disabled (no selection highlight).
   */
  allDay?: TimePickerAllDayProps;
};

export function TimePicker({
  value,
  onChange,
  readOnly = false,
  placeholderMuted = false,
  ariaLabel,
  popoverOpen,
  onPopoverOpenChange,
  allDay,
}: TimePickerProps) {
  const baseId = useId();
  const allDaySwitchId = `${baseId}-all-day`;

  const [hourDraft, setHourDraft] = useState('');
  const [minDraft, setMinDraft] = useState('');
  const [isPm, setIsPm] = useState(false);

  const draftsRef = useRef({ hourDraft, minDraft, isPm });
  useEffect(() => {
    draftsRef.current = { hourDraft, minDraft, isPm };
  }, [hourDraft, minDraft, isPm]);

  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const periodRef = useRef<HTMLButtonElement>(null);
  /** Ignore Radix dismiss callbacks briefly after open (avoids open→immediate close). */
  const suppressDismissRef = useRef(false);

  const [portalHostEl, setPortalHostEl] = useState<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!popoverOpen || readOnly) return;

    const onFocusIn = (ev: FocusEvent) => {
      const el = ev.target;
      if (!(el instanceof Element)) return;
      if (anchorRef.current?.contains(el)) return;
      if (el.closest('[data-time-picker-popover]')) return;
      onPopoverOpenChange(false);
    };

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [popoverOpen, readOnly, onPopoverOpenChange]);

  const commitFromDrafts = useCallback(
    (hStr: string, mStr: string, pm: boolean) => {
      const trimmedH = hStr.trim();
      const trimmedM = mStr.trim();
      if (!trimmedH && !trimmedM) {
        onChange(undefined);
        return;
      }
      const h = clampHour12(parseInt(trimmedH || '12', 10));
      const rawMinute = parseInt(trimmedM || '0', 10);
      const clampedMin = clampMinute(rawMinute);
      /** Nearest 5 min when minute was entered with at least two digits; single digit may be incomplete. */
      const m =
        trimmedM.length >= 2 ? snapMinuteToFive(clampedMin) : clampedMin;
      const next = twelveHourPartsToHHmm({
        hour12: h,
        minute: m,
        isPm: pm,
      });
      onChange(next);
    },
    [onChange]
  );

  const clearCommitTimer = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearCommitTimer(), [clearCommitTimer]);

  const scheduleDebouncedCommit = useCallback(() => {
    clearCommitTimer();
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      const d = draftsRef.current;
      commitFromDrafts(d.hourDraft, d.minDraft, d.isPm);
    }, TYPING_COMMIT_DEBOUNCE_MS);
  }, [clearCommitTimer, commitFromDrafts]);

  const handleBlurCommit = useCallback(() => {
    clearCommitTimer();
    commitFromDrafts(hourDraft, minDraft, isPm);
  }, [clearCommitTimer, commitFromDrafts, hourDraft, minDraft, isPm]);

  const handleFocusCapture = useCallback(() => {
    if (!readOnly) {
      onPopoverOpenChange(true);
    }
  }, [onPopoverOpenChange, readOnly]);

  const handleAllDayCheckedChange = useCallback(
    (checked: boolean) => {
      if (!allDay) return;
      allDay.onAllDayChange(checked);
    },
    [allDay]
  );

  const focusSegment = (seg: 'hour' | 'minute' | 'period') => {
    if (seg === 'hour') hourRef.current?.focus();
    if (seg === 'minute') minRef.current?.focus();
    if (seg === 'period') periodRef.current?.focus();
  };

  const onHourKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      focusSegment('minute');
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      clearCommitTimer();
      const num = clampHour12(parseInt(hourDraft || '12', 10) || 12);
      const nextHour = clampHour12(num + (e.key === 'ArrowUp' ? 1 : -1));
      const hStr = String(nextHour);
      draftsRef.current = { hourDraft: hStr, minDraft, isPm };
      setHourDraft(hStr);
      commitFromDrafts(hStr, minDraft, isPm);
    }
  };

  const onMinKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      focusSegment('period');
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      focusSegment('hour');
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      clearCommitTimer();
      const current = clampMinute(parseInt(minDraft || '0', 10) || 0);
      const delta = e.key === 'ArrowUp' ? 5 : -5;
      const snapped = snapMinuteToFive(clampMinute(current + delta));
      const mStr = String(snapped).padStart(2, '0');
      draftsRef.current = { hourDraft, minDraft: mStr, isPm };
      setMinDraft(mStr);
      commitFromDrafts(hourDraft, mStr, isPm);
    }
  };

  const onPeriodKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      focusSegment('minute');
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
    clearCommitTimer();
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
    clearCommitTimer();
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
    clearCommitTimer();
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
  }, [
    popoverOpen,
    readOnly,
    pickerPreviewParts,
    displayMinuteForPicker,
    minDraft,
  ]);

  const handlePopoverOpenAutoFocus = useCallback((e: Event) => {
    const active = document.activeElement;
    const inAnchor = Boolean(
      anchorRef.current &&
      active instanceof Node &&
      anchorRef.current.contains(active)
    );
    const keepFocusOnTrigger =
      inAnchor &&
      (active instanceof HTMLInputElement ||
        (active instanceof HTMLElement &&
          active.getAttribute('data-slot') === 'time-segment'));
    if (keepFocusOnTrigger) {
      e.preventDefault();
    }
  }, []);

  const viewOnly = readOnly;
  const showMuted =
    placeholderMuted && !value && !viewOnly && !allDay?.isAllDay;

  if (viewOnly) {
    const label = allDay?.isAllDay
      ? allDay.label
      : value
        ? formatTime12h(value)
        : '\u00a0';
    return (
      <div
        className={cn(
          'border-input bg-background flex h-(--input-height) w-full min-w-0 items-center justify-start rounded-md border px-3 text-left text-sm shadow-xs',
          READ_ONLY_STATIC_TRIGGER,
          !value && 'text-foreground'
        )}
        aria-label={ariaLabel}
      >
        <Clock
          className={cn(
            'mr-2 size-4 shrink-0',
            value ? 'text-foreground' : 'text-muted-foreground'
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      </div>
    );
  }

  return (
    <div ref={setPortalHostEl} className="relative w-full min-w-0 flex-1">
      <Popover
        modal={false}
        open={popoverOpen}
        onOpenChange={handleRadixOpenChange}
      >
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className="w-full min-w-0"
            onFocusCapture={handleFocusCapture}
          >
            <div
              role="group"
              aria-label={ariaLabel}
              aria-expanded={popoverOpen}
              className={cn(
                'border-input bg-background flex h-(--input-height) w-full min-w-0 items-center justify-start gap-0 rounded-md border px-3 text-left text-sm shadow-xs',
                'has-[[data-slot=time-segment]:focus-visible]:border-ring has-[[data-slot=time-segment]:focus-visible]:ring-ring/50 has-[[data-slot=time-segment]:focus-visible]:ring-[3px]',
                showMuted && 'text-muted-foreground'
              )}
            >
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mr-2 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label={`${ariaLabel}, open time picker`}
                onClick={() => {
                  onPopoverOpenChange(true);
                }}
              >
                <Clock className="size-4" aria-hidden />
              </button>
              {allDay?.isAllDay ? (
                <button
                  type="button"
                  className="text-foreground hover:text-foreground/90 focus-visible:ring-ring min-w-0 flex-1 truncate rounded-sm text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={`${ariaLabel}, open time picker`}
                  onClick={() => onPopoverOpenChange(true)}
                >
                  {allDay.label}
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-center justify-start gap-0">
                  <input
                    id={`${baseId}-hour`}
                    ref={hourRef}
                    data-slot="time-segment"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    aria-label={`${ariaLabel}, hour`}
                    className={HOUR_SEGMENT_CLASS}
                    value={hourDraft}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                      draftsRef.current = { hourDraft: v, minDraft, isPm };
                      setHourDraft(v);
                      scheduleDebouncedCommit();
                    }}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleBlurCommit}
                    onKeyDown={onHourKeyDown}
                  />
                  <span className="text-muted-foreground shrink-0" aria-hidden>
                    :
                  </span>
                  <input
                    id={`${baseId}-minute`}
                    ref={minRef}
                    data-slot="time-segment"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    aria-label={`${ariaLabel}, minutes`}
                    className={MINUTE_SEGMENT_CLASS}
                    value={minDraft}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                      draftsRef.current = { hourDraft, minDraft: v, isPm };
                      setMinDraft(v);
                      scheduleDebouncedCommit();
                    }}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleBlurCommit}
                    onKeyDown={onMinKeyDown}
                  />
                  <button
                    type="button"
                    id={`${baseId}-period`}
                    ref={periodRef}
                    data-slot="time-segment"
                    aria-label={`${ariaLabel}, am or pm`}
                    className={cn(
                      SEGMENT_BASE_CLASS,
                      'w-9 shrink-0 cursor-pointer px-0.5 text-left lowercase'
                    )}
                    onClick={() => {
                      clearCommitTimer();
                      const next = !isPm;
                      setIsPm(next);
                      commitFromDrafts(hourDraft, minDraft, next);
                    }}
                    onFocus={() => {
                      onPopoverOpenChange(true);
                    }}
                    onKeyDown={(e) => {
                      onPeriodKeyDown(e);
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        clearCommitTimer();
                        const next = !isPm;
                        setIsPm(next);
                        commitFromDrafts(hourDraft, minDraft, next);
                      }
                    }}
                  >
                    {isPm ? 'pm' : 'am'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          container={portalHostEl}
          data-time-picker-popover=""
          align="start"
          sideOffset={4}
          className="w-auto p-0 sm:flex"
          onOpenAutoFocus={handlePopoverOpenAutoFocus}
          onInteractOutside={(e) => {
            const target = e.target as Node | null;
            if (target && anchorRef.current?.contains(target)) {
              e.preventDefault();
            }
          }}
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
                    tabIndex={pickerDisabled || i !== hourRovingIndex ? -1 : 0}
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
                        const next = Math.min(HOUR12_OPTIONS.length - 1, i + 1);
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
