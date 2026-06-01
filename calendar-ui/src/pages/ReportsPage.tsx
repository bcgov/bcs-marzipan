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
import { fetchReportData, type ReportSectionData } from '@/api/reportsApi';
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
    <div className="flex flex-col overflow-hidden">
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

      <div className="flex h-[calc(100dvh-11rem)] min-h-0 min-w-0 flex-col overflow-hidden">
        <Tabs
          value={activeReport}
          onValueChange={handleTabChange}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="mb-0 shrink-0">
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
              'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
              isFullscreenPrintPreview(activeReport) ? 'gap-0' : 'gap-4'
            )}
          >
            <div className="flex shrink-0 flex-col gap-4">
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
              />
              <ReportTableSummaryBar
                preferences={preferences}
                setPreferences={setPreferences}
                canSeeDeleted={canSeeDeleted}
                activityCount={data?.meta?.activityCount ?? 0}
              />
            </div>

            {reports.map((report) => (
              <TabsContent
                key={report.id}
                value={report.name}
                className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
              >
                {isLoading && !data ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading report...</p>
                  </div>
                ) : data ? (
                  isFullscreenPrintPreview(report.name) ? (
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                      <div className="border-border flex h-9 shrink-0 items-center justify-end gap-4 border-t">
                        <ReportLargeRangeWarning
                          showLargeRangeWarning={showLargeRangeWarning}
                          wasClamped={wasDateRangeClamped}
                        />
                        <label className="text-foreground flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={previewSheetWidthMode === 'print'}
                            onCheckedChange={(checked) =>
                              setPreviewSheetWidthMode(
                                checked ? 'print' : 'full'
                              )
                            }
                            aria-label="Print preview"
                            className="border-input"
                          />
                          Print preview
                        </label>
                      </div>
                      <div
                        className={cn(
                          'report-html-container flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white transition-opacity duration-150',
                          isFetching && 'opacity-[0.98]'
                        )}
                      >
                        <div
                          className="min-h-0 min-w-0 flex-1 overflow-auto px-6 pt-0 pb-6"
                          aria-label="Report preview"
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
                              data={data}
                              highlightActivityIds={reportHighlightSet}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                      <Tabs
                        defaultValue={data.sections[0]?.id ?? 'section-1'}
                        className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
                      >
                        <div className="mb-4 flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-3">
                          <TabsList className="mb-0 min-w-0 shrink">
                            {data.sections.map((section: ReportSectionData) => (
                              <TabsTrigger key={section.id} value={section.id}>
                                {section.name} ({section.activities.length})
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            aria-expanded={isEditModalOpen}
                            aria-haspopup="dialog"
                            onClick={handleEditReportClick}
                          >
                            Edit Report
                          </Button>
                        </div>
                        {data.sections.map((section: ReportSectionData) => (
                          <TabsContent
                            key={section.id}
                            value={section.id}
                            className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
                          >
                            <CustomReportPreviewSection
                              section={section}
                              config={customReportFields}
                              onFieldsChange={setCustomReportFields}
                              highlightedActivityIds={reportHighlightSet}
                            />
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )
                ) : (
                  <div className="flex min-h-0 flex-1 items-center justify-center py-12">
                    <p className="text-muted-foreground">
                      Select filters and the report will load automatically
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      <EditReportModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        fields={customReportFields}
        onFieldsChange={setCustomReportFields}
        onSave={handleSaveCustomReportConfig}
      />
    </div>
  );
}
