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
  'popover-list-scroll flex flex-row gap-0 overflow-x-auto px-3 py-2.5 sm:h-full sm:min-h-0 sm:min-w-[4.5rem] sm:flex-col sm:overflow-y-scroll sm:[scrollbar-gutter:stable]';

const TIME_PICKER_PERIOD_COL_CLASS =
  'flex flex-row gap-0 overflow-x-auto px-3 py-2.5 sm:h-full sm:min-h-0 sm:min-w-[3.75rem] sm:flex-col sm:justify-center';

export type TwelveHourTimeFieldProps = {
  value: string;
  onChange: (next: string | undefined) => void;
  readOnly?: boolean;
  /** When value is empty, muted trigger styling */
  placeholderMuted?: boolean;
  /** sr-only / aria label for the composite control */
  ariaLabel: string;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
};

export function TwelveHourTimeField({
  value,
  onChange,
  readOnly = false,
  placeholderMuted = false,
  ariaLabel,
  popoverOpen,
  onPopoverOpenChange,
}: TwelveHourTimeFieldProps) {
  const baseId = useId();

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
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onMinKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      focusSegment('period');
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      focusSegment('hour');
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

  const viewOnly = readOnly;
  const showMuted = placeholderMuted && !value && !viewOnly;

  if (viewOnly) {
    const label = value ? formatTime12h(value) : '\u00a0';
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
    <Popover
      modal={false}
      open={popoverOpen}
      onOpenChange={handleRadixOpenChange}
    >
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className="w-full min-w-0 flex-1"
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
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        data-time-picker-popover=""
        align="start"
        sideOffset={4}
        className="w-auto p-0 sm:flex"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as Node | null;
          if (target && anchorRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex max-h-[min(320px,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col divide-y overflow-y-auto sm:h-[min(320px,70vh)] sm:min-h-0 sm:w-auto sm:flex-row sm:divide-x sm:divide-y-0">
          <div className={TIME_PICKER_SCROLL_COL_CLASS}>
            {HOUR12_OPTIONS.map((h) => (
              <Button
                key={h}
                type="button"
                size="icon-lg"
                variant={
                  pickerPreviewParts && pickerPreviewParts.hour12 === h
                    ? 'default'
                    : 'ghost'
                }
                className="shrink-0 sm:aspect-square sm:w-full"
                onClick={() => handlePickerHour(h)}
              >
                {h}
              </Button>
            ))}
          </div>
          <div className={TIME_PICKER_SCROLL_COL_CLASS}>
            {FIVE_MINUTE_OPTIONS.map((m) => (
              <Button
                key={m}
                type="button"
                size="icon-lg"
                variant={
                  pickerPreviewParts != null && displayMinuteForPicker === m
                    ? 'default'
                    : 'ghost'
                }
                className="shrink-0 sm:aspect-square sm:w-full"
                onClick={() => handlePickerMinute(m)}
              >
                {String(m).padStart(2, '0')}
              </Button>
            ))}
          </div>
          <div className={TIME_PICKER_PERIOD_COL_CLASS}>
            {(['am', 'pm'] as const).map((p) => {
              const pm = p === 'pm';
              return (
                <Button
                  key={p}
                  type="button"
                  size="icon-lg"
                  variant={
                    pickerPreviewParts && pickerPreviewParts.isPm === pm
                      ? 'default'
                      : 'ghost'
                  }
                  className="shrink-0 lowercase sm:aspect-square sm:w-full"
                  onClick={() => handlePickerPeriod(pm)}
                >
                  {p}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
