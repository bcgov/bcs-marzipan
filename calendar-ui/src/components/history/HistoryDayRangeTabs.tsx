import { useCallback, useMemo } from 'react';

import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pacificInclusiveCalendarRangeEndingToday } from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

const EMPTY_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

const HISTORY_DAY_RANGE_PRESETS = [
  { key: 'today', label: 'Today', dayCount: 1 },
  { key: 'last7', label: 'Last 7 days', dayCount: 7 },
  { key: 'last30', label: 'Last 30 days', dayCount: 30 },
] as const;

type HistoryDayRangePresetKey =
  (typeof HISTORY_DAY_RANGE_PRESETS)[number]['key'];

function rangeForDayCount(dayCount: number, now = new Date()): DateRangeValue {
  const range = pacificInclusiveCalendarRangeEndingToday(dayCount, now);
  return {
    ...(range ?? { startDate: '', endDate: '' }),
    noStartDate: false,
    noEndDate: false,
  };
}

function activePresetFromRange(
  dateRange: DateRangeValue,
  now = new Date()
): HistoryDayRangePresetKey | null {
  if (!isDateRangeActive(dateRange)) return null;

  for (const preset of HISTORY_DAY_RANGE_PRESETS) {
    const candidate = pacificInclusiveCalendarRangeEndingToday(
      preset.dayCount,
      now
    );
    if (
      candidate &&
      dateRange.startDate === candidate.startDate &&
      dateRange.endDate === candidate.endDate
    ) {
      return preset.key;
    }
  }
  return null;
}

export interface HistoryDayRangeTabsProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  /** Accessible label for the tab list. */
  ariaLabel?: string;
}

/**
 * Quick-pick day windows for Global History (Pacific inclusive ranges ending today).
 * Matches report day-range tab styling; preset date math unchanged from legacy pills.
 */
export function HistoryDayRangeTabs({
  value,
  onChange,
  className,
  ariaLabel = 'History day range',
}: HistoryDayRangeTabsProps) {
  const activePreset = useMemo(() => activePresetFromRange(value), [value]);

  const applyPreset = useCallback(
    (key: HistoryDayRangePresetKey) => {
      const preset = HISTORY_DAY_RANGE_PRESETS.find((item) => item.key === key);
      if (!preset) return;
      onChange(rangeForDayCount(preset.dayCount));
    },
    [onChange]
  );

  const handleTabChange = useCallback(
    (next: string) => {
      if (next === 'today' || next === 'last7' || next === 'last30') {
        applyPreset(next);
      }
    },
    [applyPreset]
  );

  const handlePresetClick = useCallback(
    (key: HistoryDayRangePresetKey) => {
      if (activePreset === key) {
        onChange(EMPTY_DATE_RANGE);
      }
    },
    [activePreset, onChange]
  );

  return (
    <Tabs
      value={activePreset ?? ''}
      onValueChange={handleTabChange}
      className={cn('w-auto', className)}
    >
      <TabsList size="sm" aria-label={ariaLabel}>
        {HISTORY_DAY_RANGE_PRESETS.map(({ key, label }) => (
          <TabsTrigger
            key={key}
            value={key}
            onClick={() => handlePresetClick(key)}
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
