import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  defaultLookAheadDateRange,
  lookAheadDateRangeFromTomorrow,
} from '@corpcal/shared/reports/look-ahead';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';
import { buildDefaultPreferencesForReport } from '@/lib/report-preferences-defaults';

import { LookAheadDayRangeTabs } from './LookAheadDayRangeTabs';

const BEFORE_PACIFIC_MIDNIGHT = new Date('2026-05-29T06:59:00.000Z');

function preferencesWithDateRange(
  startDate: string,
  endDate: string
): ActivityTablePreferences {
  const defaults = buildDefaultPreferencesForReport('look-ahead', false);
  return {
    ...defaults,
    filterState: {
      ...defaults.filterState,
      dateRange: {
        startDate,
        endDate,
        noStartDate: false,
        noEndDate: false,
      },
    },
  };
}

describe('LookAheadDayRangeTabs', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances the today-based default at Pacific midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(BEFORE_PACIFIC_MIDNIGHT);
    const defaultRange = defaultLookAheadDateRange(BEFORE_PACIFIC_MIDNIGHT);
    const setPreferences = vi.fn();

    render(
      <LookAheadDayRangeTabs
        preferences={preferencesWithDateRange(
          defaultRange.start,
          defaultRange.end
        )}
        setPreferences={setPreferences}
      />
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(setPreferences).toHaveBeenCalledWith({
      filterState: expect.objectContaining({
        dateRange: {
          startDate: '2026-05-29',
          endDate: '2026-06-04',
          noStartDate: false,
          noEndDate: false,
        },
      }),
    });
  });

  it('continues to advance tomorrow-based quick-pick ranges', () => {
    vi.useFakeTimers();
    vi.setSystemTime(BEFORE_PACIFIC_MIDNIGHT);
    const quickPick = lookAheadDateRangeFromTomorrow(
      7,
      BEFORE_PACIFIC_MIDNIGHT
    );
    const setPreferences = vi.fn();

    render(
      <LookAheadDayRangeTabs
        preferences={preferencesWithDateRange(quickPick.start, quickPick.end)}
        setPreferences={setPreferences}
      />
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(setPreferences).toHaveBeenCalledWith({
      filterState: expect.objectContaining({
        dateRange: {
          startDate: '2026-05-30',
          endDate: '2026-06-05',
          noStartDate: false,
          noEndDate: false,
        },
      }),
    });
  });
});
