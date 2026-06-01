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
import {
  tableContainer,
  tableScrollWrapper,
} from '@/components/table/tableConstants';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLiveActivityRowHighlights } from '@/hooks/useLiveActivitySyncContext';
import { useActivityStatuses, useReports } from '@/hooks/useLookups';
import { useReportsTablePreferences } from '@/hooks/useReportsTablePreferences';
import {
  loadCustomReportConfig,
  saveCustomReportConfig,
} from '@/lib/custom-report-config-storage';
import { showErrorToast } from '@/lib/error-toast';
import {
  handleReportExport,
  type ReportExportFormat,
} from '@/lib/report-export';
import {
  buildReportDataRequestParamsFromActivityPreferences,
  resolveReportQueryDateRange,
  stableSerializeReportQueryParams,
} from '@/lib/report-from-activity-filters';
import { reportQueryKeys } from '@/lib/reportQueryKeys';
import {
  getStoredReportTabName,
  REPORTS_TAB_STORAGE_KEY,
  URL_PARAM_REPORT,
} from '@/lib/reportsTablePreferencesParams';
import { cn } from '@/lib/utils';

/** Persists fullscreen print preview width (full viewport vs Letter content width). */
const REPORTS_PREVIEW_SHEET_WIDTH_KEY = 'reportsPreviewSheetWidth';

/**
 * Max height for the print preview panel so report content scrolls inside the bordered
 * container. Reserves space for app header, PageContainer py-8, page header, tabs,
 * filters, summary bar, preview toolbar, and bottom gutter.
 */
const REPORT_PRINT_PREVIEW_MAX_HEIGHT =
  'calc(100dvh - var(--header-height, 3.5rem) - 21rem)';

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

  const reportQueryParams = useMemo(
    () =>
      buildReportDataRequestParamsFromActivityPreferences(
        preferences,
        statusArchiveIds,
        canSeeDeleted
      ),
    [preferences, statusArchiveIds, canSeeDeleted]
  );

  const reportQueryParamsKey = useMemo(
    () => stableSerializeReportQueryParams(reportQueryParams),
    [reportQueryParams]
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
    queryKey: reportQueryKeys.data(activeReport, reportQueryParamsKey),
    queryFn: () =>
      activeReport
        ? fetchReportData(activeReport, reportQueryParams)
        : Promise.reject(new Error('No report selected')),
    enabled: !!activeReport,
  });

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
        data,
        queryParams: reportQueryParams,
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
              disabled={!data || isExporting || !activeReport}
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
            {reports.map((report) => (
              <TabsTrigger key={report.id} value={report.name}>
                {report.displayName}
              </TabsTrigger>
            ))}
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
              preferences={preferences}
              setPreferences={setPreferences}
              printPreviewRowLeading={
                reportUsesDayRangeTabs(activeReport) ? (
                  <LookAheadDayRangeTabs
                    preferences={preferences}
                    setPreferences={setPreferences}
                  />
                ) : reportUsesMonthRangeTabs(activeReport) ? (
                  <ReportMonthRangeTabs
                    preferences={preferences}
                    setPreferences={setPreferences}
                  />
                ) : undefined
              }
              printPreviewRowTrailing={printPreviewRowTrailing}
            />
            {activeReport !== 'custom' ? (
              <ReportTableSummaryBar
                preferences={preferences}
                setPreferences={setPreferences}
                canSeeDeleted={canSeeDeleted}
                activityCount={data?.meta?.activityCount ?? 0}
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
              ) : data ? (
                isFullscreenPrintPreview(report.name) ? (
                  <div
                    className="flex min-h-0 flex-col"
                    style={{ maxHeight: REPORT_PRINT_PREVIEW_MAX_HEIGHT }}
                  >
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
                    <div
                      className={cn(
                        'report-html-container min-h-0 flex-1',
                        tableContainer,
                        'border-border',
                        isFetching && 'opacity-[0.98]'
                      )}
                    >
                      <div
                        className={tableScrollWrapper}
                        aria-label="Report preview"
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
                              data={data}
                              highlightActivityIds={reportHighlightSet}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {data.sections[0] ? (
                      <div className="space-y-4">
                        <ReportTableSummaryBar
                          preferences={preferences}
                          setPreferences={setPreferences}
                          canSeeDeleted={canSeeDeleted}
                          activityCount={data.meta?.activityCount ?? 0}
                        />
                        <CustomReportPreviewSection
                          section={data.sections[0]}
                          config={customReportFields}
                          onFieldsChange={setCustomReportFields}
                          highlightedActivityIds={reportHighlightSet}
                        />
                      </div>
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
