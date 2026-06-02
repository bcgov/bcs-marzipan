import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { activityFilterStateToQueryParams } from '@corpcal/shared';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { shouldWarnLargeReportRange } from '@corpcal/shared/reports/reportDateRange';
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
import { useReportsSavedFilters } from '@/hooks/useReportsSavedFilters';
import { useReportsTablePreferences } from '@/hooks/useReportsTablePreferences';
import {
  loadCustomReportConfig,
  saveCustomReportConfig,
} from '@/lib/custom-report-config-storage';
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
  REPORTS_TAB_STORAGE_KEY,
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

function getExportConfig(reportType: string) {
  if (reportType === 'custom') {
    return { label: 'Export XLSX', format: 'xlsx' as const };
  }

  return { label: 'Export PDF', format: 'pdf' as const };
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
          searchKeyword: preferences.searchKeyword,
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

  const reportExportParams = useMemo(
    () => ({
      ...reportFetchParams,
      search: preferences.searchKeyword.trim() || undefined,
    }),
    [reportFetchParams, preferences.searchKeyword]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customReportFields, setCustomReportFields] = useState(() =>
    loadCustomReportConfig()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [previewSheetWidthMode, setPreviewSheetWidthMode] =
    useState<ReportPreviewSheetWidthMode>(readStoredPreviewSheetWidth);
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

  const { data, isLoading, isFetching, error } = useQuery({
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

  const displayActivityCount = useMemo(
    () => countReportActivities(displayData),
    [displayData]
  );

  const resolvedReportDateRange = useMemo(() => {
    if (!activeReport) return null;
    return resolveReportQueryDateRange(activeReport, preferences.filterState);
  }, [activeReport, preferences.filterState]);

  const showLargeRangeWarning = useMemo(() => {
    if (!resolvedReportDateRange) return false;
    if (data?.meta?.largeResultWarning != null) {
      return data.meta.largeResultWarning;
    }
    return shouldWarnLargeReportRange({
      spanDays: resolvedReportDateRange.spanDays,
    });
  }, [data?.meta?.largeResultWarning, resolvedReportDateRange]);

  const wasDateRangeClamped =
    data?.meta?.wasClamped ?? resolvedReportDateRange?.wasClamped ?? false;

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

  const handleTabChange = (reportName: string) => {
    setActiveReport(reportName);
    sessionStorage.setItem(REPORTS_TAB_STORAGE_KEY, reportName);
  };

  const runExport = async (format: ReportExportFormat) => {
    if (!activeReport) return;
    setIsExporting(true);
    try {
      await handleReportExport({
        reportType: activeReport,
        format,
        data: displayData,
        queryParams: reportExportParams,
        customReportFields:
          activeReport === 'custom' ? customReportFields : undefined,
      });
    } catch (err) {
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
              disabled={!displayData || isExporting || !activeReport}
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
            isFullscreenPrintPreview(activeReport) ? 'space-y-0' : 'space-y-4'
          )}
        >
          <div className="flex flex-col gap-4">
            <ReportFiltersBar
              reportName={activeReport}
              preferences={preferences}
              setPreferences={setReportPreferences}
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
              {isLoading && !data ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading report...</p>
                </div>
              ) : displayData ? (
                isFullscreenPrintPreview(report.name) ? (
                  <div className="flex min-h-0 flex-col">
                    <div className="border-border flex h-9 shrink-0 items-center justify-end gap-4 border-t">
                      <ReportLargeRangeWarning
                        showLargeRangeWarning={showLargeRangeWarning}
                        wasClamped={wasDateRangeClamped}
                      />
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
                    </div>
                    <TableScrollContainer
                      scrollHeight={REPORT_PRINT_PREVIEW_SCROLL_HEIGHT}
                      scrollAriaLabel="Report preview"
                      className={cn(
                        'report-html-container border-border',
                        isFetching && 'opacity-[0.98]'
                      )}
                    >
                      <div className="px-6 pt-0 pb-6">
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
                  </div>
                ) : (
                  <>
                    <ReportLargeRangeWarning
                      showLargeRangeWarning={showLargeRangeWarning}
                      wasClamped={wasDateRangeClamped}
                    />
                    {displayData.sections[0] ? (
                      <CustomReportPreviewSection
                        section={displayData.sections[0]}
                        config={customReportFields}
                        onFieldsChange={setCustomReportFields}
                        highlightedActivityIds={reportHighlightSet}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          No activities to display
                        </p>
                      </div>
                    )}
                  </>
                )
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
