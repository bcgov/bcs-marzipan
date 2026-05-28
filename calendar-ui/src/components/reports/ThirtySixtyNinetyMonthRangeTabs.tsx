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

export type ThirtySixtyNinetyMonthCount = (typeof MONTH_COUNTS)[number];

function monthRangePreset(
  monthCount: ThirtySixtyNinetyMonthCount,
  pacificToday: CalendarDateString
) {
  return thirtySixtyNinetyDateRangeFromPacificDate(monthCount, pacificToday);
}

function activeMonthCountFromRange(
  startDate: string,
  endDate: string,
  pacificToday: CalendarDateString
): ThirtySixtyNinetyMonthCount | null {
  if (!startDate || !endDate) return null;
  for (const count of MONTH_COUNTS) {
    const preset = monthRangePreset(count, pacificToday);
    if (preset.start === startDate && preset.end === endDate) {
      return count;
    }
  }
  return null;
}

export interface ThirtySixtyNinetyMonthRangeTabsProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
}

/**
 * Quick-pick month windows for the 30/60/90 report beneath the shared filters.
 * Presets anchor to the first day of the current Pacific calendar month.
 */
export function ThirtySixtyNinetyMonthRangeTabs({
  preferences,
  setPreferences,
}: ThirtySixtyNinetyMonthRangeTabsProps) {
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
    (monthCount: ThirtySixtyNinetyMonthCount) => {
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
      <TabsList size="sm" aria-label="30/60/90 month range">
        <TabsTrigger value="1">1 month</TabsTrigger>
        <TabsTrigger value="3">3 months</TabsTrigger>
        <TabsTrigger value="6">6 months</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function buildDefaultThirtySixtyNinetyFilterDateRange(): DateRangeValue {
  const preset = defaultThirtySixtyNinetyDateRange(3);
  return {
    startDate: preset.start,
    endDate: preset.end,
    noStartDate: false,
    noEndDate: false,
  };
}
