import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { pacificCalendarDateFromInstant } from '@corpcal/shared/datetime';
import {
  lookAheadDateRangeFromTomorrow,
  type LookAheadDayCount,
} from '@corpcal/shared/reports/look-ahead';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

const DAY_COUNTS = [1, 7, 14] as const;
const PACIFIC_DATE_CHECK_MS = 60_000;

function dayRangePreset(dayCount: LookAheadDayCount, anchor: Date) {
  return lookAheadDateRangeFromTomorrow(dayCount, anchor);
}

function activeDayCountFromRange(
  startDate: string,
  endDate: string,
  anchor: Date
): LookAheadDayCount | null {
  if (!startDate || !endDate) return null;
  for (const count of DAY_COUNTS) {
    const preset = dayRangePreset(count, anchor);
    if (preset.start === startDate && preset.end === endDate) {
      return count;
    }
  }
  return null;
}

export interface LookAheadDayRangeTabsProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
}

/**
 * Quick-pick day windows for Look Ahead and Exec reports (starting tomorrow, Pacific).
 */
export function LookAheadDayRangeTabs({
  preferences,
  setPreferences,
}: LookAheadDayRangeTabsProps) {
  const [clockTick, setClockTick] = useState(() => Date.now());
  const anchor = useMemo(() => new Date(clockTick), [clockTick]);
  const dateRange = preferences.filterState.dateRange;
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

  const applyDayCount = useCallback(
    (dayCount: LookAheadDayCount) => {
      const preset = dayRangePreset(dayCount, anchor);
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
    [anchor, preferences.filterState, setPreferences]
  );

  useEffect(() => {
    const prevPacificToday = prevPacificTodayRef.current;
    prevPacificTodayRef.current = pacificToday;
    if (!pacificToday || !prevPacificToday) return;
    if (prevPacificToday === pacificToday) return;
    if (!isDateRangeActive(dateRange)) return;

    const matchedOnPreviousDay = activeDayCountFromRange(
      dateRange.startDate,
      dateRange.endDate,
      new Date(clockTick - PACIFIC_DATE_CHECK_MS)
    );
    if (matchedOnPreviousDay != null) {
      applyDayCount(matchedOnPreviousDay);
    }
  }, [applyDayCount, clockTick, dateRange, pacificToday]);

  const activeCount = useMemo(() => {
    return (
      activeDayCountFromRange(dateRange.startDate, dateRange.endDate, anchor) ??
      (isDateRangeActive(dateRange) ? null : 7)
    );
  }, [anchor, dateRange]);

  return (
    <Tabs
      value={activeCount == null ? '' : String(activeCount)}
      onValueChange={(value) => {
        const parsed = Number.parseInt(value, 10);
        if (parsed === 1 || parsed === 7 || parsed === 14) {
          applyDayCount(parsed);
        }
      }}
      className="w-auto"
    >
      <TabsList size="sm" aria-label="Look Ahead day range">
        <TabsTrigger value="1">1 day</TabsTrigger>
        <TabsTrigger value="7">7 days</TabsTrigger>
        <TabsTrigger value="14">14 days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
