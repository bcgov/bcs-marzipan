import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import {
  buildReportBaselineDateFilterPatch,
  buildReportClearFilterState,
  hasReportClearableFiltersActive,
  isReportBaselineDateRange,
} from '@/lib/report-filter-state';
import { buildDefaultPreferencesForReport } from '@/lib/report-preferences-defaults';

describe('buildReportClearFilterState', () => {
  it('preserves baseline date and clears other criteria for look-ahead', () => {
    const baseline = buildDefaultPreferencesForReport('look-ahead', false);
    const cleared = buildReportClearFilterState('look-ahead');

    expect(cleared.dateRange).toEqual(baseline.filterState.dateRange);
    expect(cleared.dateRange.startDate).not.toBe('');
    expect(cleared.categoryIds).toEqual([]);
    expect(cleared.activityStatusIds).toEqual([]);
    expect(cleared.tagIds).toEqual([]);
  });

  it('uses month baseline for thirty-sixty-ninety', () => {
    const baseline = buildDefaultPreferencesForReport(
      'thirty-sixty-ninety',
      false
    );
    const cleared = buildReportClearFilterState('thirty-sixty-ninety');

    expect(cleared.dateRange).toEqual(baseline.filterState.dateRange);
    expect(cleared.dateRange.startDate).not.toBe('');
  });
});

describe('isReportBaselineDateRange', () => {
  it('returns true for the current report default window', () => {
    const baseline = buildReportClearFilterState('exec').dateRange;
    expect(isReportBaselineDateRange(baseline, 'exec')).toBe(true);
  });

  it('returns false for empty dates', () => {
    expect(
      isReportBaselineDateRange(DEFAULT_ACTIVITY_FILTER_STATE.dateRange, 'exec')
    ).toBe(false);
  });
});

describe('hasReportClearableFiltersActive', () => {
  it('returns false when only baseline date is set', () => {
    const filterState = buildReportClearFilterState('look-ahead');
    expect(hasReportClearableFiltersActive(filterState, 'look-ahead', '')).toBe(
      false
    );
  });

  it('returns true when category filters are applied', () => {
    const filterState = {
      ...buildReportClearFilterState('look-ahead'),
      categoryIds: [1],
    };
    expect(hasReportClearableFiltersActive(filterState, 'look-ahead', '')).toBe(
      true
    );
  });

  it('returns true when search keyword is set and includeSearchKeyword is true', () => {
    const filterState = buildReportClearFilterState('planning');
    expect(
      hasReportClearableFiltersActive(
        filterState,
        'planning',
        'quarterly',
        undefined,
        {
          includeSearchKeyword: true,
        }
      )
    ).toBe(true);
    expect(
      hasReportClearableFiltersActive(filterState, 'planning', 'quarterly')
    ).toBe(false);
  });

  it('returns true when date deviates from baseline', () => {
    const filterState = {
      ...buildReportClearFilterState('look-ahead'),
      dateRange: {
        startDate: '2020-01-01',
        endDate: '2020-01-31',
        noStartDate: false,
        noEndDate: false,
      },
    };
    expect(hasReportClearableFiltersActive(filterState, 'look-ahead', '')).toBe(
      true
    );
  });
});

describe('buildReportBaselineDateFilterPatch', () => {
  it('resets confirmed filters and restores baseline dates', () => {
    const patch = buildReportBaselineDateFilterPatch('custom');
    const baseline = buildReportClearFilterState('custom').dateRange;

    expect(patch.dateRange).toEqual(baseline);
    expect(patch.dateConfirmedFilter).toBe('any');
    expect(patch.timeConfirmedFilter).toBe('any');
  });
});
