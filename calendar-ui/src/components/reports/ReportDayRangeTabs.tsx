import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  pacificCalendarDateFromInstant,
  thirtySixtyNinetyDayDateRangeFromPacificDate,
  type CalendarDateString,
  type ThirtySixtyNinetyDayCount,
} from '@corpcal/shared/reports/thirty-sixty-ninety';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

const DAY_COUNTS = [30, 60, 90] as const;
const PACIFIC_DATE_CHECK_MS = 60_000;

function dayRangePreset(
  dayCount: ThirtySixtyNinetyDayCount,
  pacificToday: CalendarDateString
) {
  return thirtySixtyNinetyDayDateRangeFromPacificDate(dayCount, pacificToday);
}

function activeDayCountFromRange(
  startDate: string,
  endDate: string,
  pacificToday: CalendarDateString
): ThirtySixtyNinetyDayCount | null {
  if (!startDate || !endDate) return null;
  for (const count of DAY_COUNTS) {
    const preset = dayRangePreset(count, pacificToday);
    if (preset.start === startDate && preset.end === endDate) {
      return count;
    }
  }
  return null;
}

export interface ReportDayRangeTabsProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  /** Accessible label for the tab list. */
  ariaLabel?: string;
}

/**
 * Quick-pick day windows for 30/60/90, Planning, and Excel reports (Pacific month start).
 */
export function ReportDayRangeTabs({
  preferences,
  setPreferences,
  ariaLabel = 'Report day range',
}: ReportDayRangeTabsProps) {
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

  const applyDayCount = useCallback(
    (dayCount: ThirtySixtyNinetyDayCount) => {
      if (!pacificToday) return;
      const preset = dayRangePreset(dayCount, pacificToday);
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

    const matchedOnPreviousMonth = activeDayCountFromRange(
      dateRange.startDate,
      dateRange.endDate,
      prevPacificToday
    );
    if (matchedOnPreviousMonth != null) {
      applyDayCount(matchedOnPreviousMonth);
    }
  }, [applyDayCount, dateRange, pacificToday]);

  const activeCount = useMemo(() => {
    if (!pacificToday) return 60;
    return (
      activeDayCountFromRange(
        dateRange.startDate,
        dateRange.endDate,
        pacificToday
      ) ?? (isDateRangeActive(dateRange) ? null : 60)
    );
  }, [dateRange, pacificToday]);

  return (
    <Tabs
      value={activeCount == null ? '' : String(activeCount)}
      onValueChange={(value) => {
        const parsed = Number.parseInt(value, 10);
        if (parsed === 30 || parsed === 60 || parsed === 90) {
          applyDayCount(parsed);
        }
      }}
      className="w-auto"
    >
      <TabsList size="sm" aria-label={ariaLabel}>
        <TabsTrigger value="30">30 days</TabsTrigger>
        <TabsTrigger value="60">60 days</TabsTrigger>
        <TabsTrigger value="90">90 days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
