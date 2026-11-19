import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  formatCalendarDateReleasePreview,
  isCalendarDateString,
  PERMISSIONS,
  type CalendarDateString,
  type DateRangeValue,
} from '@corpcal/shared';
import {
  LOOK_AHEAD_CURATED_PRESET_META,
  lookAheadCuratedPresetFromRange,
  lookAheadCuratedPresetRange,
  pacificCalendarDateFromInstant,
  type LookAheadCuratedPresetId,
} from '@corpcal/shared/reports/look-ahead';
import { ScheduledDateRangeFields } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const PACIFIC_DATE_CHECK_MS = 60_000;

function formatLookAheadBoundRange(
  startDate: string,
  endDate: string,
  anchor: Date
): string {
  if (!isCalendarDateString(startDate) || !isCalendarDateString(endDate)) {
    return '';
  }
  const options = { referenceInstant: anchor };
  const formatBound = (date: CalendarDateString) =>
    formatCalendarDateReleasePreview(date, options);
  if (startDate === endDate) return formatBound(startDate);
  return `${formatBound(startDate)} – ${formatBound(endDate)}`;
}

export interface LookAheadDateRangeControlProps {
  dateRange: DateRangeValue;
  activePreset: LookAheadCuratedPresetId | null;
  onDateRangeChange: (
    dateRange: DateRangeValue,
    activePreset: LookAheadCuratedPresetId | null
  ) => void;
  onPresetApplied?: (preset: LookAheadCuratedPresetId | 'custom') => void;
  className?: string;
}

export function LookAheadDateRangeControl({
  dateRange,
  activePreset,
  onDateRangeChange,
  onPresetApplied,
  className,
}: LookAheadDateRangeControlProps) {
  const { hasPermission } = useAuth();
  const canUsePublishedRange = hasPermission(
    PERMISSIONS.REPORTS.PUBLISHED_LOOK_AHEAD_RANGE
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const anchor = useMemo(() => new Date(clockTick), [clockTick]);
  const pacificToday = useMemo(
    () => pacificCalendarDateFromInstant(anchor),
    [anchor]
  );
  const prevPacificTodayRef = useRef(pacificToday);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockTick(Date.now());
    }, PACIFIC_DATE_CHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  const applyPreset = useCallback(
    (preset: LookAheadCuratedPresetId) => {
      const range = lookAheadCuratedPresetRange(preset, anchor);
      onDateRangeChange(
        {
          startDate: range.start,
          endDate: range.end,
          noStartDate: false,
          noEndDate: false,
        },
        preset
      );
      onPresetApplied?.(preset);
    },
    [anchor, onDateRangeChange, onPresetApplied]
  );

  useEffect(() => {
    const prev = prevPacificTodayRef.current;
    prevPacificTodayRef.current = pacificToday ?? null;
    if (!pacificToday || !prev || prev === pacificToday) return;
    if (activePreset == null) return;
    applyPreset(activePreset);
  }, [activePreset, applyPreset, pacificToday]);

  const { startDate: rangeStartDate, endDate: rangeEndDate } = dateRange;

  const displayLabel = useMemo(() => {
    if (!rangeStartDate && !rangeEndDate) return 'Select dates';
    if (
      isCalendarDateString(rangeStartDate) &&
      isCalendarDateString(rangeEndDate)
    ) {
      return formatLookAheadBoundRange(rangeStartDate, rangeEndDate, anchor);
    }
    const options = { referenceInstant: anchor };
    const formatBound = (date: CalendarDateString) =>
      formatCalendarDateReleasePreview(date, options);
    if (isCalendarDateString(rangeStartDate)) {
      return formatBound(rangeStartDate);
    }
    if (isCalendarDateString(rangeEndDate)) {
      return formatBound(rangeEndDate);
    }
    return 'Select dates';
  }, [anchor, rangeEndDate, rangeStartDate]);

  const matchedPreset = useMemo(() => {
    if (!pacificToday) return null;
    return (
      activePreset ??
      lookAheadCuratedPresetFromRange(
        dateRange.startDate,
        dateRange.endDate,
        pacificToday
      )
    );
  }, [activePreset, dateRange.endDate, dateRange.startDate, pacificToday]);

  const presetOptions = useMemo(
    () =>
      LOOK_AHEAD_CURATED_PRESET_META.filter(
        (meta) => !meta.requiresPublishedRangePermission || canUsePublishedRange
      ),
    [canUsePublishedRange]
  );

  const presetMenuItems = useMemo(
    () =>
      presetOptions.map((meta) => {
        const { start, end } = lookAheadCuratedPresetRange(meta.id, anchor);
        return {
          meta,
          rangeLabel: formatLookAheadBoundRange(start, end, anchor),
        };
      }),
    [anchor, presetOptions]
  );

  return (
    <div
      className={cn(
        'inline-flex min-w-0 items-stretch rounded-md border border-slate-200 bg-white text-sm',
        className
      )}
    >
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="text-foreground hover:bg-accent/50 max-w-[min(100%,20rem)] min-w-0 truncate rounded-l-md px-3 py-1.5 text-left transition-colors"
            aria-label={`Date range: ${displayLabel}. Open calendar`}
          >
            <span className="font-semibold">{displayLabel}</span>
            {matchedPreset ? (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                {
                  LOOK_AHEAD_CURATED_PRESET_META.find(
                    (m) => m.id === matchedPreset
                  )?.label
                }
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <ScheduledDateRangeFields
            value={dateRange}
            onChange={(next) => {
              const preset =
                pacificToday != null
                  ? lookAheadCuratedPresetFromRange(
                      next.startDate,
                      next.endDate,
                      pacificToday
                    )
                  : null;
              onDateRangeChange(next, preset);
              onPresetApplied?.(preset ?? 'custom');
            }}
          />
        </PopoverContent>
      </Popover>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="border-border hover:bg-accent/50 flex items-center border-l px-2 py-1.5"
            aria-label="Choose date preset"
          >
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          {presetMenuItems.map(({ meta, rangeLabel }) => (
            <DropdownMenuItem
              key={meta.id}
              onSelect={() => applyPreset(meta.id)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{meta.label}</span>
                <span className="text-muted-foreground text-xs">
                  {rangeLabel}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
