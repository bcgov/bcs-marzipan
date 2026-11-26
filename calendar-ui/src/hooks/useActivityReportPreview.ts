import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import {
  fetchReportData,
  type ReportDataRequestParams,
} from '@/api/reportsApi';
import { useLiveActivityRowHighlights } from '@/hooks/useLiveActivitySyncContext';
import { useReportDataFreshness } from '@/hooks/useReportDataFreshness';
import {
  activityListReportFetchParamsKey,
  buildActivityListReportFetchParams,
  getReportExportConfig,
  type ActivityListReportStatusArchiveIds,
} from '@/lib/activity-list-report-params';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';
import analytics from '@/lib/analytics';
import {
  loadCustomReportConfig,
  saveCustomReportConfig,
} from '@/lib/custom-report-config-storage';
import { deriveReportRangeWarnings } from '@/lib/deriveReportRangeWarnings';
import { showErrorToast } from '@/lib/error-toast';
import { countReportActivities } from '@/lib/report-data-utils';
import {
  handleReportExport,
  type ReportExportFormat,
} from '@/lib/report-export';
import { mergeActivityTablePreferences } from '@/lib/report-preferences-defaults';
import { resolveReportQueryDateRange } from '@/lib/report-query-params';
import { filterReportDataBySearchKeyword } from '@/lib/report-search-filter';
import { reportQueryKeys } from '@/lib/reportQueryKeys';
import { cn } from '@/lib/utils';

export interface UseActivityReportPreviewOptions {
  reportName: string;
  preferences: ActivityTablePreferences;
  setPreferencesState: React.Dispatch<
    React.SetStateAction<ActivityTablePreferences>
  >;
  canViewDeleted: boolean;
  statusArchiveIds: ActivityListReportStatusArchiveIds;
  reportFetchParams?: ReportDataRequestParams;
  reportFetchParamsKey?: string;
  reportFetchEnabled?: boolean;
}

export function useActivityReportPreview({
  reportName,
  preferences,
  setPreferencesState,
  canViewDeleted,
  statusArchiveIds,
  reportFetchParams: reportFetchParamsProp,
  reportFetchParamsKey: reportFetchParamsKeyProp,
  reportFetchEnabled = true,
}: UseActivityReportPreviewOptions) {
  const queryClient = useQueryClient();

  const setPreferences = useCallback(
    (partial: Partial<ActivityTablePreferences>) => {
      setPreferencesState((prev) =>
        mergeActivityTablePreferences(prev, partial)
      );
    },
    [setPreferencesState]
  );

  const reportFetchParams = useMemo(() => {
    if (reportFetchParamsProp != null) {
      return reportFetchParamsProp;
    }
    return buildActivityListReportFetchParams(
      preferences,
      statusArchiveIds,
      canViewDeleted
    );
  }, [reportFetchParamsProp, preferences, statusArchiveIds, canViewDeleted]);

  const reportFetchParamsKey = useMemo(
    () =>
      reportFetchParamsKeyProp ??
      activityListReportFetchParamsKey(reportFetchParams),
    [reportFetchParamsKeyProp, reportFetchParams]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customReportFields, setCustomReportFields] = useState(() =>
    loadCustomReportConfig()
  );
  const [isExporting, setIsExporting] = useState(false);
  const reportPreviewScrollRef = useRef<HTMLDivElement | null>(null);
  const reportLoadStartedAtRef = useRef<number | null>(null);
  const lastResultsEventKeyRef = useRef<string>('');

  const { data, isLoading, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: reportQueryKeys.data(reportName, reportFetchParamsKey),
    queryFn: () => fetchReportData(reportName, reportFetchParams),
    enabled: !!reportName && reportFetchEnabled,
    placeholderData: (previousData) => previousData,
  });

  const displayData = useMemo(
    () => filterReportDataBySearchKeyword(data, preferences.searchKeyword),
    [data, preferences.searchKeyword]
  );

  const { isFresh, isWrongReport, isPreviewLoading } = useReportDataFreshness({
    activeReport: reportName,
    displayData,
    isPlaceholderData,
    isLoading,
    hasData: !!data,
  });

  const displayActivityCount = useMemo(
    () => (isWrongReport ? 0 : countReportActivities(displayData)),
    [displayData, isWrongReport]
  );

  const activeFilterCount = useMemo(
    () =>
      analytics.countActiveReportFilterCriteria(
        preferences.filterState,
        reportName
      ),
    [reportName, preferences.filterState]
  );

  const resolvedReportDateRange = useMemo(
    () => resolveReportQueryDateRange(reportName, preferences.filterState),
    [reportName, preferences.filterState]
  );

  const { showLargeRangeWarning, wasDateRangeClamped } = useMemo(
    () =>
      deriveReportRangeWarnings({
        resolvedReportDateRange,
        dataMeta: data?.meta,
        isPlaceholderData,
      }),
    [resolvedReportDateRange, data?.meta, isPlaceholderData]
  );

  const reportHighlightSet = useLiveActivityRowHighlights(isFetching);

  useEffect(() => {
    reportLoadStartedAtRef.current = performance.now();
  }, [reportName, reportFetchParamsKey]);

  useEffect(() => {
    if (!isFresh || isWrongReport || !displayData) return;

    const eventKey = JSON.stringify([
      reportName,
      reportFetchParamsKey,
      preferences.searchKeyword.trim(),
      displayActivityCount,
    ]);

    if (eventKey === lastResultsEventKeyRef.current) return;

    const startedAt = reportLoadStartedAtRef.current;
    if (startedAt == null) return;

    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));

    // entry_point: 'activity_list' — optional Snowplow context for a follow-up schema change
    analytics.trackReportSearchResultsLoaded({
      report_name: reportName,
      results_count: displayActivityCount,
      latency_ms: latencyMs,
      search_present: preferences.searchKeyword.trim().length > 0,
      active_filter_count: activeFilterCount,
    });

    lastResultsEventKeyRef.current = eventKey;
    reportLoadStartedAtRef.current = null;
  }, [
    activeFilterCount,
    reportName,
    displayActivityCount,
    displayData,
    isFresh,
    isWrongReport,
    preferences.searchKeyword,
    reportFetchParamsKey,
  ]);

  const handleReportPreviewClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href*="/activity/"]');
      if (!(link instanceof HTMLAnchorElement)) return;

      const links = Array.from(
        event.currentTarget.querySelectorAll<HTMLAnchorElement>(
          'a[href*="/activity/"]'
        )
      );
      const positionInResults =
        links.findIndex((candidate) => candidate === link) + 1;

      analytics.trackReportResultOpened({
        report_name: reportName,
        item_type: 'activity',
        position_in_results: positionInResults > 0 ? positionInResults : 1,
        results_count: displayActivityCount,
        open_method: 'link',
        active_filter_count: activeFilterCount,
      });
    },
    [activeFilterCount, reportName, displayActivityCount]
  );

  const handleCustomReportPaginationChange = useCallback(
    (change: {
      action: 'page_change' | 'page_size_change';
      page: number;
      pageSize: number;
      totalItems: number;
    }) => {
      analytics.trackReportPaginationChanged({
        report_name: reportName,
        action: change.action,
        page_number: change.page,
        page_size: change.pageSize,
        total_pages: Math.max(
          1,
          Math.ceil(change.totalItems / change.pageSize)
        ),
        active_filter_count: activeFilterCount,
        search_present: preferences.searchKeyword.trim().length > 0,
      });
    },
    [activeFilterCount, reportName, preferences.searchKeyword]
  );

  const runExport = async (format: ReportExportFormat) => {
    const startedAt = performance.now();
    analytics.trackReportExportStarted({
      report_name: reportName,
      export_type: format,
      rows_count: displayActivityCount,
      active_filter_count: activeFilterCount,
      search_present: preferences.searchKeyword.trim().length > 0,
    });
    setIsExporting(true);
    try {
      let exportData = displayData;
      if (reportName === 'custom' && format === 'xlsx') {
        const freshData = await queryClient.fetchQuery({
          queryKey: reportQueryKeys.data(reportName, reportFetchParamsKey),
          queryFn: () => fetchReportData(reportName, reportFetchParams),
        });
        exportData = filterReportDataBySearchKeyword(
          freshData,
          preferences.searchKeyword
        );
      }

      await handleReportExport({
        reportType: reportName,
        format,
        data: exportData,
        queryParams: {
          ...reportFetchParams,
          search: preferences.searchKeyword.trim() || undefined,
        },
        customReportFields:
          reportName === 'custom' ? customReportFields : undefined,
      });
      analytics.trackReportExportCompleted({
        report_name: reportName,
        export_type: format,
        status: 'success',
        duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
      });
    } catch (err) {
      analytics.trackReportExportCompleted({
        report_name: reportName,
        export_type: format,
        status: 'failure',
        duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
        error_category: err instanceof Error ? err.name : 'unknown',
      });
      const label =
        format === 'pdf' ? 'PDF' : format === 'csv' ? 'CSV' : 'spreadsheet';
      showErrorToast(err, `Failed to export ${label}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveCustomReportConfig = () => {
    saveCustomReportConfig(customReportFields);
    setIsEditModalOpen(false);
  };

  const exportConfig = getReportExportConfig(reportName);

  const reportPreviewScrollClassName = cn(
    'report-html-container border-border min-h-0 flex-1',
    isFetching && !isPreviewLoading && 'opacity-[0.98]'
  );

  const printPreviewRootStyle = {
    '--corpcal-print-root-max-width': 'none',
  } as CSSProperties;

  return {
    preferences,
    setPreferences,
    displayData,
    displayActivityCount,
    activeFilterCount,
    isExporting,
    isPreviewLoading,
    isFresh,
    error,
    exportConfig,
    runExport,
    resolvedReportDateRange,
    showLargeRangeWarning,
    wasDateRangeClamped,
    reportPreviewScrollRef,
    reportPreviewScrollClassName,
    reportHighlightSet,
    handleReportPreviewClickCapture,
    handleCustomReportPaginationChange,
    customReportFields,
    setCustomReportFields,
    isEditModalOpen,
    setIsEditModalOpen,
    handleSaveCustomReportConfig,
    printPreviewRootStyle,
  };
}
