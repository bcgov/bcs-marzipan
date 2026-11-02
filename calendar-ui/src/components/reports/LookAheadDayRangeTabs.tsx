import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_LOOK_AHEAD_QUICK_PICK,
  lookAheadQuickPickFromRange,
  lookAheadQuickPickRange,
  pacificCalendarDateFromInstant,
  type LookAheadQuickPick,
} from '@corpcal/shared/reports/look-ahead';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

const PACIFIC_DATE_CHECK_MS = 60_000;

function quickPickTabValue(pick: LookAheadQuickPick): string {
  return pick === 'today' ? 'today' : String(pick);
}

function parseQuickPickTabValue(value: string): LookAheadQuickPick | null {
  if (value === 'today') return 'today';
  const parsed = Number.parseInt(value, 10);
  if (parsed === 7 || parsed === 14) return parsed;
  return null;
}

export interface LookAheadDayRangeTabsProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
}

/**
 * Quick-pick day windows for Look Ahead and Exec: Today, +7 days, +14 days
 * (Pacific; forward picks exclude today).
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

  const applyQuickPick = useCallback(
    (pick: LookAheadQuickPick) => {
      const preset = lookAheadQuickPickRange(pick, anchor);
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

    const matchedOnPreviousDay = lookAheadQuickPickFromRange(
      dateRange.startDate,
      dateRange.endDate,
      prevPacificToday
    );
    if (matchedOnPreviousDay != null) {
      applyQuickPick(matchedOnPreviousDay);
    }
  }, [applyQuickPick, dateRange, pacificToday]);

  const activeQuickPick = useMemo(() => {
    if (!pacificToday) return DEFAULT_LOOK_AHEAD_QUICK_PICK;
    return (
      lookAheadQuickPickFromRange(
        dateRange.startDate,
        dateRange.endDate,
        pacificToday
      ) ?? (isDateRangeActive(dateRange) ? null : DEFAULT_LOOK_AHEAD_QUICK_PICK)
    );
  }, [dateRange, pacificToday]);

  return (
    <Tabs
      value={activeQuickPick == null ? '' : quickPickTabValue(activeQuickPick)}
      onValueChange={(value) => {
        const pick = parseQuickPickTabValue(value);
        if (pick != null) {
          applyQuickPick(pick);
        }
      }}
      className="w-auto"
    >
      <TabsList size="sm" aria-label="Look Ahead day range">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="7">+7 days</TabsTrigger>
        <TabsTrigger value="14">+14 days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
