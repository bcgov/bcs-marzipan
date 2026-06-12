import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '@corpcal/shared/api/types';

import { getReportDataFreshness } from './useReportDataFreshness';

const customReportData: ReportDataResponse = {
  report: {
    id: 1,
    name: 'custom',
    displayName: 'Custom',
    sortOrder: 0,
    isActive: true,
    visibility: 'global',
    config: null,
    description: null,
  },
  sections: [],
};

describe('getReportDataFreshness', () => {
  it('marks settled same-tab data as fresh', () => {
    expect(
      getReportDataFreshness({
        activeReport: 'custom',
        displayData: customReportData,
        isPlaceholderData: false,
        isLoading: false,
        hasData: true,
      })
    ).toEqual({
      isFresh: true,
      isWrongReport: false,
      isParamsMismatch: false,
      isPreviewLoading: false,
    });
  });

  it('marks placeholder data on the same tab as a params mismatch', () => {
    expect(
      getReportDataFreshness({
        activeReport: 'custom',
        displayData: customReportData,
        isPlaceholderData: true,
        isLoading: false,
        hasData: true,
      })
    ).toEqual({
      isFresh: false,
      isWrongReport: false,
      isParamsMismatch: true,
      isPreviewLoading: false,
    });
  });

  it('marks placeholder data from another tab as wrong report', () => {
    const lookAheadData: ReportDataResponse = {
      ...customReportData,
      report: {
        ...customReportData.report,
        id: 2,
        name: 'look-ahead',
        displayName: 'Look Ahead',
      },
    };

    expect(
      getReportDataFreshness({
        activeReport: 'custom',
        displayData: lookAheadData,
        isPlaceholderData: true,
        isLoading: false,
        hasData: true,
      })
    ).toEqual({
      isFresh: false,
      isWrongReport: true,
      isParamsMismatch: false,
      isPreviewLoading: true,
    });
  });

  it('shows preview loading on first load without data', () => {
    expect(
      getReportDataFreshness({
        activeReport: 'custom',
        displayData: undefined,
        isPlaceholderData: false,
        isLoading: true,
        hasData: false,
      })
    ).toEqual({
      isFresh: false,
      isWrongReport: false,
      isParamsMismatch: false,
      isPreviewLoading: true,
    });
  });
});
