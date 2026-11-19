import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  formatCalendarDateReleasePreview,
  isCalendarDateString,
  type CalendarDateString,
  type DateRangeValue,
} from '@corpcal/shared';
import {
  pacificCalendarDateFromInstant,
  THIRTY_SIXTY_NINETY_TAB_DAY_COUNTS,
  thirtySixtyNinetyTabDateRangeFromPacificDate,
  type CalendarDateString as PacificCalendarDateString,
  type ThirtySixtyNinetyTabDayCount,
} from '@corpcal/shared/reports/thirty-sixty-ninety';
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
import { cn } from '@/lib/utils';

const PACIFIC_DATE_CHECK_MS = 60_000;

const PRESET_LABELS: Record<ThirtySixtyNinetyTabDayCount, string> = {
  30: '30 days',
  60: '60 days',
  90: '90 days',
};

function formatBoundDateRange(
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

function tabDayCountFromRange(
  startDate: string,
  endDate: string,
  pacificToday: PacificCalendarDateString
): ThirtySixtyNinetyTabDayCount | null {
  if (!startDate || !endDate) return null;
  for (const tabDayCount of THIRTY_SIXTY_NINETY_TAB_DAY_COUNTS) {
    const preset = thirtySixtyNinetyTabDateRangeFromPacificDate(
      tabDayCount,
      pacificToday
    );
    if (preset.start === startDate && preset.end === endDate) {
      return tabDayCount;
    }
  }
  return null;
}

export interface ActivityListReportDateRangeControlProps {
  dateRange: DateRangeValue;
  onDateRangeChange: (dateRange: DateRangeValue) => void;
  className?: string;
}

export function ActivityListReportDateRangeControl({
  dateRange,
  onDateRangeChange,
  className,
}: ActivityListReportDateRangeControlProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activePreset, setActivePreset] =
    useState<ThirtySixtyNinetyTabDayCount | null>(null);
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
    (tabDayCount: ThirtySixtyNinetyTabDayCount) => {
      if (!pacificToday) return;
      const preset = thirtySixtyNinetyTabDateRangeFromPacificDate(
        tabDayCount,
        pacificToday
      );
      onDateRangeChange({
        startDate: preset.start,
        endDate: preset.end,
        noStartDate: false,
        noEndDate: false,
      });
      setActivePreset(tabDayCount);
    },
    [onDateRangeChange, pacificToday]
  );

  useEffect(() => {
    const prev = prevPacificTodayRef.current;
    prevPacificTodayRef.current = pacificToday ?? null;
    if (!pacificToday || !prev || prev === pacificToday) return;
    if (prev.slice(0, 7) === pacificToday.slice(0, 7)) return;
    const matched =
      activePreset ??
      tabDayCountFromRange(dateRange.startDate, dateRange.endDate, prev);
    if (matched != null) {
      applyPreset(matched);
    }
  }, [
    activePreset,
    applyPreset,
    dateRange.endDate,
    dateRange.startDate,
    pacificToday,
  ]);

  const { startDate: rangeStartDate, endDate: rangeEndDate } = dateRange;

  const displayLabel = useMemo(() => {
    if (!rangeStartDate && !rangeEndDate) return 'Select dates';
    if (
      isCalendarDateString(rangeStartDate) &&
      isCalendarDateString(rangeEndDate)
    ) {
      return formatBoundDateRange(rangeStartDate, rangeEndDate, anchor);
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
      tabDayCountFromRange(rangeStartDate, rangeEndDate, pacificToday)
    );
  }, [activePreset, pacificToday, rangeEndDate, rangeStartDate]);

  const presetMenuItems = useMemo(() => {
    if (!pacificToday) return [];
    return THIRTY_SIXTY_NINETY_TAB_DAY_COUNTS.map((tabDayCount) => {
      const { start, end } = thirtySixtyNinetyTabDateRangeFromPacificDate(
        tabDayCount,
        pacificToday
      );
      return {
        tabDayCount,
        label: PRESET_LABELS[tabDayCount],
        rangeLabel: formatBoundDateRange(start, end, anchor),
      };
    });
  }, [anchor, pacificToday]);

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
                {PRESET_LABELS[matchedPreset]}
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
                  ? tabDayCountFromRange(
                      next.startDate,
                      next.endDate,
                      pacificToday
                    )
                  : null;
              setActivePreset(preset);
              onDateRangeChange(next);
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
          {presetMenuItems.map(({ tabDayCount, label, rangeLabel }) => (
            <DropdownMenuItem
              key={tabDayCount}
              onSelect={() => applyPreset(tabDayCount)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{label}</span>
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
