import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { activityFilterStateToQueryParams } from '@corpcal/shared';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { reportPrintSheetLayoutWidthPx } from '@corpcal/shared/reports/reportPrintHtml';
import { fetchReportData } from '@/api/reportsApi';
import { PageHeader } from '@/components/layout';
import { CustomReportPreviewSection } from '@/components/reports/CustomReportPreviewSection';
import { EditReportModal } from '@/components/reports/EditReportModal';
import { LookAheadDayRangeTabs } from '@/components/reports/LookAheadDayRangeTabs';
import { PrintReportPreview } from '@/components/reports/PrintReportPreview';
import { ReportFiltersBar } from '@/components/reports/ReportFiltersBar';
import { ReportLargeRangeWarning } from '@/components/reports/ReportLargeRangeWarning';
import { ReportMonthRangeTabs } from '@/components/reports/ReportMonthRangeTabs';
import { ReportTableSummaryBar } from '@/components/reports/ReportTableSummaryBar';
import { StatusMessage } from '@/components/shared';
import { REPORT_PRINT_PREVIEW_SCROLL_HEIGHT } from '@/components/table/tableConstants';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLiveActivityRowHighlights } from '@/hooks/useLiveActivitySyncContext';
import { useActivityStatuses, useReports } from '@/hooks/useLookups';
import { useReportDataFreshness } from '@/hooks/useReportDataFreshness';
import { useReportsSavedFilters } from '@/hooks/useReportsSavedFilters';
import { useReportsTablePreferences } from '@/hooks/useReportsTablePreferences';
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
import {
  resolveReportQueryDateRange,
  stableSerializeReportQueryParams,
} from '@/lib/report-query-params';
import { filterReportDataBySearchKeyword } from '@/lib/report-search-filter';
import { reportQueryKeys } from '@/lib/reportQueryKeys';
import {
  getStoredReportTabName,
  setStoredReportTabName,
  URL_PARAM_REPORT,
} from '@/lib/reportsTablePreferencesParams';
import { cn } from '@/lib/utils';

/** Persists fullscreen print preview width (full viewport vs Letter content width). */
const REPORTS_PREVIEW_SHEET_WIDTH_KEY = 'reportsPreviewSheetWidth';

type ReportPreviewSheetWidthMode = 'full' | 'print';

function readStoredPreviewSheetWidth(): ReportPreviewSheetWidthMode {
  if (typeof sessionStorage === 'undefined') return 'full';
  try {
    const v = sessionStorage.getItem(REPORTS_PREVIEW_SHEET_WIDTH_KEY);
    if (v === 'full' || v === 'print') return v;
  } catch {
    /* private mode */
  }
  return 'full';
}

/**
 * Built-in report tabs that show the fullscreen print preview as primary content (not Custom).
 */
function isFullscreenPrintPreview(reportName: string): boolean {
  switch (reportName) {
    case 'look-ahead':
    case 'exec':
    case 'thirty-sixty-ninety':
    case 'planning':
      return true;
    default:
      return false;
  }
}

/** Report tabs that use the shared preview toolbar + fixed-height scroll container. */
function usesReportPreviewShell(reportName: string): boolean {
  return isFullscreenPrintPreview(reportName) || reportName === 'custom';
}

function getExportConfig(reportType: string) {
  if (reportType === 'custom') {
    return { label: 'Export XLSX', format: 'xlsx' as const };
  }

  return { label: 'Export PDF', format: 'pdf' as const };
}

/**
 * Empty state for report preview shell with centered message.
 * Used for loading, no-data, and error states.
 */
function ReportPreviewEmptyState({
  ref,
  message,
  className,
}: {
  ref: React.Ref<HTMLDivElement | null>;
  message: string;
  className?: string;
}) {
  return (
    <TableScrollContainer
      ref={ref}
      scrollHeight={REPORT_PRINT_PREVIEW_SCROLL_HEIGHT}
      scrollAriaLabel="Report preview"
      scrollClassName="flex flex-col"
      className={className}
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 pt-0 pb-6">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </TableScrollContainer>
  );
}

function reportUsesDayRangeTabs(reportName: string): boolean {
  return reportName === 'look-ahead' || reportName === 'exec';
}

function reportUsesMonthRangeTabs(reportName: string): boolean {
  return (
    reportName === 'thirty-sixty-ninety' ||
    reportName === 'planning' ||
    reportName === 'custom'
  );
}

export function ReportsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const [searchParams] = useSearchParams();
  const [activeReport, setActiveReport] = useState('');

  const { preferences, setPreferences } = useReportsTablePreferences(
    canSeeDeleted,
    activeReport
  );

  const savedFiltersState = useReportsSavedFilters({
    reportName: activeReport,
    preferences,
    setPreferences,
    canSeeDeleted,
  });

  const setReportPreferences = savedFiltersState.setPreferencesAndClearSaved;
  const { data: activityStatusesForFilter = [] } = useActivityStatuses();

  const statusArchiveIds = useMemo(() => {
    const completed = activityStatusesForFilter.find(
      (s) => s.name === 'completed'
    );
    const deleted = activityStatusesForFilter.find((s) => s.name === 'deleted');
    return {
      completedStatusId: completed?.id,
      deletedStatusId: deleted?.id,
    };
  }, [activityStatusesForFilter]);

  const reportFetchParams = useMemo(
    () =>
      activityFilterStateToQueryParams(
        {
          filterState: preferences.filterState,
          showCompleted: preferences.showCompleted,
          showDeleted: preferences.showDeleted,
        },
        statusArchiveIds,
        canSeeDeleted
      ),
    [
      preferences.filterState,
      preferences.showCompleted,
      preferences.showDeleted,
      statusArchiveIds,
      canSeeDeleted,
    ]
  );

  const reportFetchParamsKey = useMemo(
    () => stableSerializeReportQueryParams(reportFetchParams),
    [reportFetchParams]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customReportFields, setCustomReportFields] = useState(() =>
    loadCustomReportConfig()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [previewSheetWidthMode, setPreviewSheetWidthMode] =
    useState<ReportPreviewSheetWidthMode>(readStoredPreviewSheetWidth);
  const reportPreviewScrollRef = useRef<HTMLDivElement | null>(null);
  const reportLoadStartedAtRef = useRef<number | null>(null);
  const prevFilterStateSignatureRef = useRef<string>('');
  const lastSearchInteractionAtRef = useRef<number | null>(null);
  const lastNoResultsEventKeyRef = useRef<string>('');
  const lastResultsEventKeyRef = useRef<string>('');
  const [searchInteractionVersion, setSearchInteractionVersion] = useState(0);

  const initialTabAppliedRef = useRef(false);

  const { data: reports = [] } = useReports();

  useEffect(() => {
    if (initialTabAppliedRef.current || reports.length === 0) return;
    initialTabAppliedRef.current = true;

    const fromUrl = searchParams.get(URL_PARAM_REPORT)?.trim();
    const stored = getStoredReportTabName();
    const initialReport =
      (fromUrl && reports.find((r) => r.name === fromUrl)) ||
      (stored && reports.find((r) => r.name === stored)) ||
      reports[0];

    if (initialReport) {
      setActiveReport(initialReport.name);
    }
  }, [reports, searchParams]);

  const { data, isLoading, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: reportQueryKeys.data(activeReport, reportFetchParamsKey),
    queryFn: () =>
      activeReport
        ? fetchReportData(activeReport, reportFetchParams)
        : Promise.reject(new Error('No report selected')),
    enabled: !!activeReport,
    placeholderData: (previousData) => previousData,
  });

  const displayData = useMemo(
    () => filterReportDataBySearchKeyword(data, preferences.searchKeyword),
    [data, preferences.searchKeyword]
  );

  const { isFresh, isWrongReport, isPreviewLoading } = useReportDataFreshness({
    activeReport,
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
      activeReport
        ? analytics.countActiveReportFilterCriteria(
            preferences.filterState,
            activeReport
          )
        : 0,
    [activeReport, preferences.filterState]
  );

  const filterStateSignature = useMemo(
    () => JSON.stringify(preferences.filterState),
    [preferences.filterState]
  );

  const resolvedReportDateRange = useMemo(() => {
    if (!activeReport) return null;
    return resolveReportQueryDateRange(activeReport, preferences.filterState);
  }, [activeReport, preferences.filterState]);

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

  const previewSheetLayoutWidthPx = useMemo(
    () => reportPrintSheetLayoutWidthPx(activeReport),
    [activeReport]
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(
        REPORTS_PREVIEW_SHEET_WIDTH_KEY,
        previewSheetWidthMode
      );
    } catch {
      /* private mode */
    }
  }, [previewSheetWidthMode]);

  useEffect(() => {
    if (!activeReport) {
      prevFilterStateSignatureRef.current = '';
      reportLoadStartedAtRef.current = null;
      lastNoResultsEventKeyRef.current = '';
      lastResultsEventKeyRef.current = '';
      return;
    }
    reportLoadStartedAtRef.current = performance.now();
  }, [activeReport, reportFetchParamsKey]);

  useEffect(() => {
    if (!activeReport) return;

    const nextSignature = `${activeReport}|${filterStateSignature}`;
    const previousSignature = prevFilterStateSignatureRef.current;
    prevFilterStateSignatureRef.current = nextSignature;

    if (
      previousSignature === '' ||
      previousSignature === nextSignature ||
      !previousSignature.startsWith(`${activeReport}|`)
    ) {
      return;
    }

    const filterKeysUsed = analytics.getActiveReportFilterKeys(
      preferences.filterState,
      activeReport
    );

    if (filterKeysUsed.length === 0) {
      return;
    }

    analytics.trackReportFiltersApplied({
      report_name: activeReport,
      filter_keys_used: filterKeysUsed,
      active_filter_count: activeFilterCount,
      category_count: preferences.filterState.categoryNames.length,
      status_count: preferences.filterState.activityStatusIds.length,
      tag_count: preferences.filterState.tagIds.length,
      ministry_count: preferences.filterState.leadMinistryIds.length,
      org_count: preferences.filterState.leadOrgIds.length,
    });
  }, [
    activeFilterCount,
    activeReport,
    filterStateSignature,
    preferences.filterState,
  ]);

  useEffect(() => {
    if (!activeReport || !isFresh || isWrongReport || !displayData) {
      return;
    }

    const eventKey = JSON.stringify([
      activeReport,
      reportFetchParamsKey,
      preferences.searchKeyword.trim(),
      displayActivityCount,
      searchInteractionVersion,
    ]);

    if (eventKey === lastResultsEventKeyRef.current) {
      return;
    }

    const startedAt =
      lastSearchInteractionAtRef.current ?? reportLoadStartedAtRef.current;

    // Avoid firing "results loaded" events for purely client-side re-renders
    // (e.g. each keystroke) when no load/interaction was initiated.
    if (startedAt == null) return;

    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    const filterKeysUsed = analytics.getActiveReportFilterKeys(
      preferences.filterState,
      activeReport
    );

    analytics.trackReportSearchResultsLoaded({
      report_name: activeReport,
      results_count: displayActivityCount,
      latency_ms: latencyMs,
      search_present: preferences.searchKeyword.trim().length > 0,
      active_filter_count: activeFilterCount,
    });

    if (
      displayActivityCount === 0 &&
      eventKey !== lastNoResultsEventKeyRef.current
    ) {
      analytics.trackReportNoResultsShown({
        report_name: activeReport,
        active_filter_count: activeFilterCount,
        search_present: preferences.searchKeyword.trim().length > 0,
        date_range_active: filterKeysUsed.includes('dateRange'),
        filter_keys_used: filterKeysUsed,
      });
      lastNoResultsEventKeyRef.current = eventKey;
    }

    if (displayActivityCount > 0) {
      lastNoResultsEventKeyRef.current = '';
    }

    lastResultsEventKeyRef.current = eventKey;
    reportLoadStartedAtRef.current = null;
    lastSearchInteractionAtRef.current = null;
  }, [
    activeFilterCount,
    activeReport,
    displayActivityCount,
    displayData,
    isFresh,
    isWrongReport,
    preferences.filterState,
    preferences.searchKeyword,
    reportFetchParamsKey,
    searchInteractionVersion,
  ]);

  const markSearchInteraction = useCallback(() => {
    lastSearchInteractionAtRef.current = performance.now();
    setSearchInteractionVersion((current) => current + 1);
  }, []);

  const handleReportPreviewClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!activeReport) return;
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
        report_name: activeReport,
        item_type: 'activity',
        position_in_results: positionInResults > 0 ? positionInResults : 1,
        results_count: displayActivityCount,
        open_method: 'link',
        active_filter_count: activeFilterCount,
      });
    },
    [activeFilterCount, activeReport, displayActivityCount]
  );

  const handleCustomReportPaginationChange = useCallback(
    (change: {
      action: 'page_change' | 'page_size_change';
      page: number;
      pageSize: number;
      totalItems: number;
    }) => {
      if (!activeReport) return;
      analytics.trackReportPaginationChanged({
        report_name: activeReport,
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
    [activeFilterCount, activeReport, preferences.searchKeyword]
  );

  const handleTabChange = (reportName: string) => {
    setActiveReport(reportName);
    setStoredReportTabName(reportName);
    reportPreviewScrollRef.current?.scrollTo(0, 0);
  };

  const runExport = async (format: ReportExportFormat) => {
    if (!activeReport) return;
    const startedAt = performance.now();
    analytics.trackReportExportStarted({
      report_name: activeReport,
      export_type: format,
      rows_count: displayActivityCount,
      active_filter_count: activeFilterCount,
      search_present: preferences.searchKeyword.trim().length > 0,
    });
    setIsExporting(true);
    try {
      let exportData = displayData;
      if (activeReport === 'custom' && format === 'xlsx') {
        const freshData = await queryClient.fetchQuery({
          queryKey: reportQueryKeys.data(activeReport, reportFetchParamsKey),
          queryFn: () => fetchReportData(activeReport, reportFetchParams),
        });
        exportData = filterReportDataBySearchKeyword(
          freshData,
          preferences.searchKeyword
        );
      }

      await handleReportExport({
        reportType: activeReport,
        format,
        data: exportData,
        queryParams: {
          ...reportFetchParams,
          search: preferences.searchKeyword.trim() || undefined,
        },
        customReportFields:
          activeReport === 'custom' ? customReportFields : undefined,
      });
      analytics.trackReportExportCompleted({
        report_name: activeReport,
        export_type: format,
        status: 'success',
        duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
      });
    } catch (err) {
      analytics.trackReportExportCompleted({
        report_name: activeReport,
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

  const handleEditReportClick = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveCustomReportConfig = () => {
    saveCustomReportConfig(customReportFields);
    setIsEditModalOpen(false);
  };

  const exportConfig = getExportConfig(activeReport);

  const printPreviewRowTrailing =
    activeReport === 'custom' ? (
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        aria-expanded={isEditModalOpen}
        aria-haspopup="dialog"
        onClick={handleEditReportClick}
      >
        Customize
      </Button>
    ) : undefined;

  // Subtle fade (0.98 opacity) during background refetch to indicate activity
  // without visual jarring or layout shift.
  const reportPreviewScrollClassName = cn(
    'report-html-container border-border',
    isFetching && !isPreviewLoading && 'opacity-[0.98]'
  );

  if (error && activeReport) {
    return (
      <StatusMessage
        title="Error loading report"
        message={
          error instanceof Error ? error.message : 'Failed to load report data'
        }
        variant="error"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and export various activity reports"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              disabled={
                !displayData || !isFresh || isExporting || !activeReport
              }
              className="gap-2"
              onClick={() => void runExport(exportConfig.format)}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : exportConfig.label}
            </Button>
          </div>
        }
      />

      <Tabs value={activeReport} onValueChange={handleTabChange}>
        <div className="mb-0">
          <TabsList className="mb-0" variant="line" size="med">
            {reports.map((report) => {
              const display = (report.displayName ?? '').replace(
                /\bReport$/,
                'report'
              );
              return (
                <TabsTrigger key={report.id} value={report.name}>
                  {display}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div
          className={cn(
            'mt-0 min-w-0',
            usesReportPreviewShell(activeReport) ? 'space-y-0' : 'space-y-4'
          )}
        >
          <div className="flex flex-col gap-4">
            <ReportFiltersBar
              reportName={activeReport}
              preferences={preferences}
              setPreferences={setReportPreferences}
              onSearchSubmitted={markSearchInteraction}
              onSearchCleared={markSearchInteraction}
              savedFilters={savedFiltersState.savedFiltersHook}
              onApplySavedFilter={savedFiltersState.onApplySavedFilter}
              activeSavedFilterId={
                savedFiltersState.activeSavedFilter?.id ?? null
              }
              filterSummaryContext={savedFiltersState.filterSummaryContext}
              parseSavedFilterForDraft={
                savedFiltersState.parseSavedFilterForDraft
              }
              validFilterLookups={savedFiltersState.validFilterLookups}
              printPreviewRowLeading={
                reportUsesDayRangeTabs(activeReport) ? (
                  <LookAheadDayRangeTabs
                    preferences={preferences}
                    setPreferences={setReportPreferences}
                  />
                ) : reportUsesMonthRangeTabs(activeReport) ? (
                  <ReportMonthRangeTabs
                    preferences={preferences}
                    setPreferences={setReportPreferences}
                  />
                ) : undefined
              }
              printPreviewRowTrailing={printPreviewRowTrailing}
            />
            {activeReport ? (
              <ReportTableSummaryBar
                reportName={activeReport}
                preferences={preferences}
                setPreferences={setReportPreferences}
                canSeeDeleted={canSeeDeleted}
                activityCount={displayActivityCount}
                appliedSavedFilterName={
                  savedFiltersState.appliedSavedFilterName
                }
                onClearSavedFilter={savedFiltersState.handleClearPanelFilters}
              />
            ) : null}
          </div>

          {reports.map((report) => (
            <TabsContent
              key={report.id}
              value={report.name}
              className="mt-0 outline-none data-[state=inactive]:hidden"
            >
              {activeReport === report.name &&
              usesReportPreviewShell(report.name) ? (
                <div className="flex min-h-0 flex-col">
                  <div className="border-border flex h-9 shrink-0 items-center justify-end gap-4 border-t">
                    <ReportLargeRangeWarning
                      showLargeRangeWarning={showLargeRangeWarning}
                      wasClamped={wasDateRangeClamped}
                    />
                    {isFullscreenPrintPreview(report.name) ? (
                      <label className="text-foreground flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={previewSheetWidthMode === 'print'}
                          onCheckedChange={(checked) =>
                            setPreviewSheetWidthMode(checked ? 'print' : 'full')
                          }
                          aria-label="Print width"
                          className="border-input"
                        />
                        Print width
                      </label>
                    ) : null}
                  </div>
                  {isPreviewLoading ? (
                    <ReportPreviewEmptyState
                      ref={reportPreviewScrollRef}
                      message="Loading report..."
                      className={reportPreviewScrollClassName}
                    />
                  ) : report.name === 'custom' ? (
                    displayData?.sections[0] ? (
                      <CustomReportPreviewSection
                        section={displayData.sections[0]}
                        config={customReportFields}
                        onFieldsChange={setCustomReportFields}
                        onPaginationChange={handleCustomReportPaginationChange}
                        highlightedActivityIds={reportHighlightSet}
                        scrollContainerRef={reportPreviewScrollRef}
                      />
                    ) : (
                      <ReportPreviewEmptyState
                        ref={reportPreviewScrollRef}
                        message="No activities to display"
                        className={reportPreviewScrollClassName}
                      />
                    )
                  ) : displayData ? (
                    <TableScrollContainer
                      ref={reportPreviewScrollRef}
                      scrollHeight={REPORT_PRINT_PREVIEW_SCROLL_HEIGHT}
                      scrollAriaLabel="Report preview"
                      scrollClassName="flex flex-col"
                      className={reportPreviewScrollClassName}
                    >
                      <div
                        className="flex w-full flex-1 flex-col px-6 pt-0 pb-6"
                        onClickCapture={handleReportPreviewClickCapture}
                      >
                        <div
                          className={
                            previewSheetWidthMode === 'full'
                              ? 'report-print-preview-root min-w-0'
                              : 'report-print-preview-root'
                          }
                          style={
                            (previewSheetWidthMode === 'full'
                              ? {
                                  '--corpcal-print-root-max-width': 'none',
                                }
                              : {
                                  minWidth: previewSheetLayoutWidthPx,
                                }) as CSSProperties
                          }
                        >
                          <PrintReportPreview
                            reportTypeName={report.name}
                            data={displayData}
                            highlightActivityIds={reportHighlightSet}
                          />
                        </div>
                      </div>
                    </TableScrollContainer>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    Select filters and the report will load automatically
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <EditReportModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        fields={customReportFields}
        onFieldsChange={setCustomReportFields}
        onSave={handleSaveCustomReportConfig}
      />
    </>
  );
}
