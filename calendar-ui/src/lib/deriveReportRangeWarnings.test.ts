import { describe, expect, it } from 'vitest';

import type { ReportDataMeta } from '@corpcal/shared/api/types';
import { toCalendarDateString } from '@corpcal/shared/datetime';
import { normalizeReportActivityDateRange } from '@corpcal/shared/reports/normalizeReportActivityDateRange';

import { deriveReportRangeWarnings } from './deriveReportRangeWarnings';

const smallRange = normalizeReportActivityDateRange({
  startDateFrom: '2024-01-01',
  startDateTo: '2024-03-31',
});

const largeRange = normalizeReportActivityDateRange({
  startDateFrom: '2023-01-01',
  startDateTo: '2025-12-31',
});

const settledMeta = {
  resolvedDateRange: {
    start: toCalendarDateString('2024-01-01'),
    end: toCalendarDateString('2024-03-31'),
  },
  wasClamped: false,
  inferredBound: null,
  activityCount: 1,
  largeResultWarning: false,
} satisfies ReportDataMeta;

describe('deriveReportRangeWarnings', () => {
  it('uses current filter state while placeholder data is shown', () => {
    expect(
      deriveReportRangeWarnings({
        resolvedReportDateRange: largeRange,
        dataMeta: settledMeta,
        isPlaceholderData: true,
      })
    ).toEqual({
      showLargeRangeWarning: true,
      wasDateRangeClamped: true,
    });
  });

  it('uses settled fetch meta when data matches current params', () => {
    expect(
      deriveReportRangeWarnings({
        resolvedReportDateRange: smallRange,
        dataMeta: {
          ...settledMeta,
          largeResultWarning: true,
          wasClamped: true,
        },
        isPlaceholderData: false,
      })
    ).toEqual({
      showLargeRangeWarning: true,
      wasDateRangeClamped: true,
    });
  });

  it('falls back to resolved range when settled meta omits warning flags', () => {
    expect(
      deriveReportRangeWarnings({
        resolvedReportDateRange: largeRange,
        dataMeta: undefined,
        isPlaceholderData: false,
      })
    ).toEqual({
      showLargeRangeWarning: true,
      wasDateRangeClamped: true,
    });
  });
});
