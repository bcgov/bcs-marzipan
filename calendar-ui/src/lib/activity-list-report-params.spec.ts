import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';

import {
  isActivityListReportName,
  snapshotPreferencesForReportDialog,
} from './activity-list-report-params';

const baseListPrefs: ActivityTablePreferences = {
  sortKey: 'startDate',
  sortDirection: 'desc',
  showCompleted: false,
  showDeleted: false,
  pageSize: 10,
  searchKeyword: 'pitch',
  filterState: DEFAULT_ACTIVITY_FILTER_STATE,
};

describe('isActivityListReportName', () => {
  it('accepts list dialog report types', () => {
    expect(isActivityListReportName('planning')).toBe(true);
    expect(isActivityListReportName('custom')).toBe(true);
  });

  it('rejects look-ahead family', () => {
    expect(isActivityListReportName('look-ahead')).toBe(false);
    expect(isActivityListReportName('exec')).toBe(false);
  });
});

describe('snapshotPreferencesForReportDialog', () => {
  it('copies list search keyword', () => {
    const snapshot = snapshotPreferencesForReportDialog(
      baseListPrefs,
      'planning'
    );
    expect(snapshot.searchKeyword).toBe('pitch');
  });

  it('seeds report default dates when list has no date range', () => {
    const snapshot = snapshotPreferencesForReportDialog(
      baseListPrefs,
      'thirty-sixty-ninety'
    );
    expect(snapshot.filterState.dateRange.startDate).not.toBe('');
    expect(snapshot.filterState.dateRange.endDate).not.toBe('');
  });
});
