import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DateRangeValue } from '@corpcal/shared';
import {
  defaultThirtySixtyNinetyDateRange,
  pacificCalendarDateFromInstant,
  thirtySixtyNinetyDateRangeFromPacificDate,
  type CalendarDateString,
} from '@corpcal/shared/reports/thirty-sixty-ninety';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

const MONTH_COUNTS = [1, 3, 6] as const;
const PACIFIC_DATE_CHECK_MS = 60_000;

export type ReportMonthCount = (typeof MONTH_COUNTS)[number];

function monthRangePreset(
  monthCount: ReportMonthCount,
  pacificToday: CalendarDateString
) {
  return thirtySixtyNinetyDateRangeFromPacificDate(monthCount, pacificToday);
}

function activeMonthCountFromRange(
  startDate: string,
  endDate: string,
  pacificToday: CalendarDateString
): ReportMonthCount | null {
  if (!startDate || !endDate) return null;
  for (const count of MONTH_COUNTS) {
    const preset = monthRangePreset(count, pacificToday);
    if (preset.start === startDate && preset.end === endDate) {
      return count;
    }
  }
  return null;
}

export interface ReportMonthRangeTabsProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  /** Accessible label for the tab list. */
  ariaLabel?: string;
}

/**
 * Quick-pick month windows for reports that anchor to the current Pacific month.
 */
export function ReportMonthRangeTabs({
  preferences,
  setPreferences,
  ariaLabel = 'Report month range',
}: ReportMonthRangeTabsProps) {
  const [clockTick, setClockTick] = useState(() => Date.now());
  const dateRange = preferences.filterState.dateRange;
  const pacificToday = useMemo(
    () => pacificCalendarDateFromInstant(new Date(clockTick)),
    [clockTick]
  );
  const prevPacificTodayRef = useRef(pacificToday);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockTick(Date.now());
    }, PACIFIC_DATE_CHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  const applyMonthCount = useCallback(
    (monthCount: ReportMonthCount) => {
      if (!pacificToday) return;
      const preset = monthRangePreset(monthCount, pacificToday);
      setPreferences({
        filterState: {
          ...preferences.filterState,
          dateRange: {
            startDate: preset.start,
            endDate: preset.end,
            noStartDate: false,
            noEndDate: false,
          },
        },
      });
    },
    [preferences.filterState, pacificToday, setPreferences]
  );

  useEffect(() => {
    const prevPacificToday = prevPacificTodayRef.current;
    prevPacificTodayRef.current = pacificToday;
    if (!pacificToday || !prevPacificToday) return;
    if (prevPacificToday.slice(0, 7) === pacificToday.slice(0, 7)) return;
    if (!isDateRangeActive(dateRange)) return;

    const matchedOnPreviousMonth = activeMonthCountFromRange(
      dateRange.startDate,
      dateRange.endDate,
      prevPacificToday
    );
    if (matchedOnPreviousMonth != null) {
      applyMonthCount(matchedOnPreviousMonth);
    }
  }, [applyMonthCount, dateRange, pacificToday]);

  const activeCount = useMemo(() => {
    if (!pacificToday) return 3;
    return (
      activeMonthCountFromRange(
        dateRange.startDate,
        dateRange.endDate,
        pacificToday
      ) ?? (isDateRangeActive(dateRange) ? null : 3)
    );
  }, [dateRange, pacificToday]);

  return (
    <Tabs
      value={activeCount == null ? '' : String(activeCount)}
      onValueChange={(value) => {
        const parsed = Number.parseInt(value, 10);
        if (parsed === 1 || parsed === 3 || parsed === 6) {
          applyMonthCount(parsed);
        }
      }}
      className="w-auto"
    >
      <TabsList size="sm" aria-label={ariaLabel}>
        <TabsTrigger value="1">1 month</TabsTrigger>
        <TabsTrigger value="3">3 months</TabsTrigger>
        <TabsTrigger value="6">6 months</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function buildDefaultReportMonthFilterDateRange(): DateRangeValue {
  const preset = defaultThirtySixtyNinetyDateRange(3);
  return {
    startDate: preset.start,
    endDate: preset.end,
    noStartDate: false,
    noEndDate: false,
  };
}
