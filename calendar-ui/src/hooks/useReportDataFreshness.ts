import { useMemo } from 'react';

import type { ReportDataResponse } from '@corpcal/shared/api/types';

export interface ReportDataFreshnessInput {
  activeReport: string;
  displayData: ReportDataResponse | undefined;
  isPlaceholderData: boolean;
  isLoading: boolean;
  hasData: boolean;
}

export interface ReportDataFreshnessResult {
  /** Loaded rows match the active tab and current fetch params. */
  isFresh: boolean;
  /** Placeholder rows are from a different report tab. */
  isWrongReport: boolean;
  /** Placeholder rows are from previous fetch params on the same tab. */
  isParamsMismatch: boolean;
  isPreviewLoading: boolean;
}

export function getReportDataFreshness(
  input: ReportDataFreshnessInput
): ReportDataFreshnessResult {
  const { activeReport, displayData, isPlaceholderData, isLoading, hasData } =
    input;

  const isWrongReport =
    !!displayData && !!activeReport && displayData.report.name !== activeReport;
  const isParamsMismatch = isPlaceholderData && !isWrongReport;
  const isFresh =
    !!displayData && !!activeReport && !isWrongReport && !isPlaceholderData;
  const isPreviewLoading = (isLoading && !hasData) || isWrongReport;

  return { isFresh, isWrongReport, isParamsMismatch, isPreviewLoading };
}

export function useReportDataFreshness(
  input: ReportDataFreshnessInput
): ReportDataFreshnessResult {
  const { activeReport, displayData, isPlaceholderData, isLoading, hasData } =
    input;

  return useMemo(
    () =>
      getReportDataFreshness({
        activeReport,
        displayData,
        isPlaceholderData,
        isLoading,
        hasData,
      }),
    [activeReport, displayData, isPlaceholderData, isLoading, hasData]
  );
}
