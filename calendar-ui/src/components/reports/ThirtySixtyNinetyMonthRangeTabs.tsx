import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DateRangeValue } from '@corpcal/shared';
import {
  CORP_PACIFIC_OFFSET_MS,
  pacificCalendarDateFromInstant,
  type CalendarDateString,
} from '@corpcal/shared/datetime';
import { defaultThirtySixtyNinetyDateRange } from '@corpcal/shared/reports/thirty-sixty-ninety';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

const MONTH_COUNTS = [1, 3, 6] as const;
const PACIFIC_DATE_CHECK_MS = 60_000;

export type ThirtySixtyNinetyMonthCount = (typeof MONTH_COUNTS)[number];

function anchorInstantForPacificCalendarDate(date: CalendarDateString): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const offsetHours = CORP_PACIFIC_OFFSET_MS / (60 * 60 * 1000);
  return new Date(Date.UTC(y, m - 1, d, 12 + offsetHours, 0, 0, 0));
}

function monthRangePreset(
  monthCount: ThirtySixtyNinetyMonthCount,
  anchor: Date
) {
  return defaultThirtySixtyNinetyDateRange(monthCount, anchor);
}

function activeMonthCountFromRange(
  startDate: string,
  endDate: string,
  anchor: Date
): ThirtySixtyNinetyMonthCount | null {
  if (!startDate || !endDate) return null;
  for (const count of MONTH_COUNTS) {
    const preset = monthRangePreset(count, anchor);
    if (preset.start === startDate && preset.end === endDate) {
      return count;
    }
  }
  return null;
}

function rangeMatchesPresetForAnchor(
  startDate: string,
  endDate: string,
  anchor: Date
): ThirtySixtyNinetyMonthCount | null {
  return activeMonthCountFromRange(startDate, endDate, anchor);
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
  const presetAnchor = useMemo(
    () =>
      pacificToday
        ? anchorInstantForPacificCalendarDate(pacificToday)
        : new Date(clockTick),
    [clockTick, pacificToday]
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
      const preset = monthRangePreset(monthCount, presetAnchor);
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
    [preferences.filterState, presetAnchor, setPreferences]
  );

  useEffect(() => {
    const prevPacificToday = prevPacificTodayRef.current;
    prevPacificTodayRef.current = pacificToday;
    if (!pacificToday || !prevPacificToday) return;
    if (prevPacificToday.slice(0, 7) === pacificToday.slice(0, 7)) return;
    if (!isDateRangeActive(dateRange)) return;

    const matchedOnPreviousMonth = rangeMatchesPresetForAnchor(
      dateRange.startDate,
      dateRange.endDate,
      anchorInstantForPacificCalendarDate(prevPacificToday)
    );
    if (matchedOnPreviousMonth != null) {
      applyMonthCount(matchedOnPreviousMonth);
    }
  }, [
    applyMonthCount,
    dateRange.endDate,
    dateRange.noEndDate,
    dateRange.noStartDate,
    dateRange.startDate,
    pacificToday,
  ]);

  const activeCount = useMemo(
    () =>
      activeMonthCountFromRange(
        dateRange.startDate,
        dateRange.endDate,
        presetAnchor
      ) ?? (isDateRangeActive(dateRange) ? null : 3),
    [dateRange, presetAnchor]
  );

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
