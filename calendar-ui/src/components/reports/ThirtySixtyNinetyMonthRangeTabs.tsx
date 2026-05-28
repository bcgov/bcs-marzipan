import { useCallback, useMemo } from 'react';

import type { DateRangeValue } from '@corpcal/shared';
import { defaultThirtySixtyNinetyDateRange } from '@corpcal/shared/reports/thirty-sixty-ninety';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

const MONTH_COUNTS = [1, 3, 6] as const;

export type ThirtySixtyNinetyMonthCount = (typeof MONTH_COUNTS)[number];

function monthRangePreset(monthCount: ThirtySixtyNinetyMonthCount) {
  return defaultThirtySixtyNinetyDateRange(monthCount);
}

function activeMonthCountFromRange(
  startDate: string,
  endDate: string
): ThirtySixtyNinetyMonthCount | null {
  if (!startDate || !endDate) return null;
  for (const count of MONTH_COUNTS) {
    const preset = monthRangePreset(count);
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
  const dateRange = preferences.filterState.dateRange;
  const activeCount = useMemo(
    () =>
      activeMonthCountFromRange(dateRange.startDate, dateRange.endDate) ??
      (isDateRangeActive(dateRange) ? null : 3),
    [
      dateRange.endDate,
      dateRange.startDate,
      dateRange.noEndDate,
      dateRange.noStartDate,
    ]
  );

  const applyMonthCount = useCallback(
    (monthCount: ThirtySixtyNinetyMonthCount) => {
      const preset = monthRangePreset(monthCount);
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
    [preferences.filterState, setPreferences]
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
