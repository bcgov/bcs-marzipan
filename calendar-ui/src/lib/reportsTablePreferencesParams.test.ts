import { describe, expect, it, vi } from 'vitest';

import { buildDefaultPreferencesForReport } from '@/lib/report-preferences-defaults';
import {
  createEmptyBundle,
  getInitialBundle,
  getPreferencesForReport,
  hasAnyKnownParam,
  preferencesToParams,
  REPORTS_TAB_STORAGE_KEY,
  setStoredReportTabName,
  URL_PARAM_REPORT,
  type ActivityTablePreferences,
} from '@/lib/reportsTablePreferencesParams';

describe('setStoredReportTabName', () => {
  it('writes the active report tab to sessionStorage', () => {
    const setItem = vi.fn();
    Object.defineProperty(window, 'sessionStorage', {
      value: { setItem },
      configurable: true,
    });

    setStoredReportTabName('custom');

    expect(setItem).toHaveBeenCalledWith(REPORTS_TAB_STORAGE_KEY, 'custom');
  });

  it('ignores sessionStorage write failures', () => {
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: () => {
          throw new Error('blocked');
        },
      },
      configurable: true,
    });

    expect(() => setStoredReportTabName('custom')).not.toThrow();
  });
});

describe('buildDefaultPreferencesForReport', () => {
  it('uses distinct date ranges for look-ahead vs thirty-sixty-ninety', () => {
    const lookAhead = buildDefaultPreferencesForReport('look-ahead', false);
    const thirty = buildDefaultPreferencesForReport(
      'thirty-sixty-ninety',
      false
    );

    expect(lookAhead.filterState.dateRange.startDate).not.toBe(
      thirty.filterState.dateRange.startDate
    );
    expect(lookAhead.filterState.dateRange.endDate).not.toBe(
      thirty.filterState.dateRange.endDate
    );
    expect(lookAhead.filterState.dateRange.startDate).not.toBe('');
    expect(thirty.filterState.dateRange.startDate).not.toBe('');
  });
});

describe('getPreferencesForReport', () => {
  it('returns stored prefs for one tab without affecting another', () => {
    const bundle = createEmptyBundle();
    const lookAheadPrefs = buildDefaultPreferencesForReport(
      'look-ahead',
      false
    );
    const thirtyPrefs: ActivityTablePreferences = {
      ...buildDefaultPreferencesForReport('thirty-sixty-ninety', false),
      searchKeyword: 'planning-only',
      filterState: {
        ...buildDefaultPreferencesForReport('thirty-sixty-ninety', false)
          .filterState,
        categoryNames: ['Media'],
      },
    };
    bundle.byReport['look-ahead'] = lookAheadPrefs;
    bundle.byReport['thirty-sixty-ninety'] = thirtyPrefs;

    expect(
      getPreferencesForReport(bundle, 'look-ahead', false).searchKeyword
    ).toBe('');
    expect(
      getPreferencesForReport(bundle, 'thirty-sixty-ninety', false)
        .searchKeyword
    ).toBe('planning-only');
    expect(
      getPreferencesForReport(bundle, 'thirty-sixty-ninety', false).filterState
        .categoryNames
    ).toEqual(['Media']);
  });

  it('falls back to report defaults when tab has no stored entry', () => {
    const bundle = createEmptyBundle();
    const defaults = buildDefaultPreferencesForReport('exec', false);
    const resolved = getPreferencesForReport(bundle, 'exec', false);

    expect(resolved.filterState.dateRange).toEqual(
      defaults.filterState.dateRange
    );
  });
});

describe('preferencesToParams', () => {
  it('includes report param when reportName is provided', () => {
    const prefs = buildDefaultPreferencesForReport('look-ahead', false);
    const params = preferencesToParams(prefs, 'look-ahead');

    expect(params[URL_PARAM_REPORT]).toBe('look-ahead');
    expect(params.dateFrom).toBe(prefs.filterState.dateRange.startDate);
  });

  it('round-trips through getInitialBundle', () => {
    const prefs = buildDefaultPreferencesForReport(
      'thirty-sixty-ninety',
      false
    );
    const params = preferencesToParams(prefs, 'thirty-sixty-ninety');
    const searchParams = new URLSearchParams(params);
    const bundle = getInitialBundle(searchParams, false);

    expect(hasAnyKnownParam(searchParams)).toBe(true);
    const resolved = getPreferencesForReport(
      bundle,
      'thirty-sixty-ninety',
      false
    );
    expect(resolved.filterState.dateRange).toEqual(prefs.filterState.dateRange);
    expect(resolved.searchKeyword).toBe(prefs.searchKeyword);
  });
});
