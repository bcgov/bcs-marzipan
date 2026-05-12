import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { REPORT_PRINT_LAYOUT_WIDTH_PX } from '@corpcal/shared/reports/reportPrintHtml';
import { getReportTypeConfigByReportName } from '@corpcal/shared/reports/reportTypeConfig';
import { fetchReportData, type ReportSectionData } from '@/api/reportsApi';
import { PageHeader } from '@/components/layout';
import { CustomReportPreviewSection } from '@/components/reports/CustomReportPreviewSection';
import { EditReportModal } from '@/components/reports/EditReportModal';
import { PrintReportPreview } from '@/components/reports/PrintReportPreview';
import { ReportFiltersBar } from '@/components/reports/ReportFiltersBar';
import { ReportSection } from '@/components/reports/ReportSection';
import { StatusMessage } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
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
  stableSerializeReportQueryParams,
} from '@/lib/report-from-activity-filters';

const REPORTS_TAB_STORAGE_KEY = 'reportsTab';
/** Persists fullscreen print preview width (full viewport vs Letter content width). */
const REPORTS_PREVIEW_SHEET_WIDTH_KEY = 'reportsPreviewSheetWidth';

type ReportPreviewSheetWidthMode = 'full' | 'print';

function readStoredPreviewSheetWidth(): ReportPreviewSheetWidthMode {
  if (typeof sessionStorage === 'undefined') return 'print';
  try {
    const v = sessionStorage.getItem(REPORTS_PREVIEW_SHEET_WIDTH_KEY);
    if (v === 'full' || v === 'print') return v;
  } catch {
    /* private mode */
  }
  return 'print';
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

export function ReportsPage() {
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const { preferences, setPreferences } =
    useReportsTablePreferences(canSeeDeleted);
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

  const [activeReport, setActiveReport] = useState<string>('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customReportFields, setCustomReportFields] = useState(() =>
    loadCustomReportConfig()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [previewSheetWidthMode, setPreviewSheetWidthMode] =
    useState<ReportPreviewSheetWidthMode>(readStoredPreviewSheetWidth);
  const initialTabAppliedRef = useRef(false);
  const defaultsAppliedForReportRef = useRef<string | null>(null);

  const { data: reports = [] } = useReports();

  useEffect(() => {
    if (initialTabAppliedRef.current || reports.length === 0) return;
    initialTabAppliedRef.current = true;

    const stored = sessionStorage.getItem(REPORTS_TAB_STORAGE_KEY);
    const initialReport =
      (stored && reports.find((r) => r.name === stored)) || reports[0];

    if (initialReport) {
      setActiveReport(initialReport.name);
    }
  }, [reports]);

  // Apply config-based date defaults once per report tab when scheduled range is still empty.
  useEffect(() => {
    if (!activeReport) return;
    if (defaultsAppliedForReportRef.current === activeReport) {
      return;
    }

    const defaults = getReportTypeConfigByReportName(activeReport)?.defaults;
    const dr = preferences.filterState.dateRange;
    const empty =
      dr.startDate === '' &&
      dr.endDate === '' &&
      !dr.noStartDate &&
      !dr.noEndDate;

    if (defaults && empty && (defaults.startDate || defaults.endDate)) {
      setPreferences({
        filterState: {
          ...preferences.filterState,
          dateRange: {
            startDate: defaults.startDate ?? '',
            endDate: defaults.endDate ?? '',
            noStartDate: false,
            noEndDate: false,
          },
        },
      });
    }
    defaultsAppliedForReportRef.current = activeReport;
  }, [activeReport, preferences.filterState, setPreferences]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['report-data', activeReport, reportQueryParamsKey],
    queryFn: () =>
      activeReport
        ? fetchReportData(activeReport, reportQueryParams)
        : Promise.reject(new Error('No report selected')),
    enabled: !!activeReport,
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Reports] reportQueryParams', reportQueryParams);
    }
  }, [reportQueryParams]);

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
    defaultsAppliedForReportRef.current = null;
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
              variant="outline"
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

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
              <ReportFiltersBar
                preferences={preferences}
                setPreferences={setPreferences}
              />
            </div>

            {reports.map((report) => (
              <TabsContent
                key={report.id}
                value={report.name}
                className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
              >
                {isLoading ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading report...</p>
                  </div>
                ) : data ? (
                  isFullscreenPrintPreview(report.name) ? (
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                      <div className="report-html-container border-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t bg-white">
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b px-6 py-2">
                          <span className="text-muted-foreground text-sm">
                            Preview width
                          </span>
                          <div
                            className="bg-muted/50 flex rounded-md border p-0.5"
                            role="group"
                            aria-label="Preview width"
                          >
                            <Button
                              type="button"
                              variant={
                                previewSheetWidthMode === 'full'
                                  ? 'secondary'
                                  : 'ghost'
                              }
                              size="sm"
                              className="rounded-sm"
                              aria-pressed={previewSheetWidthMode === 'full'}
                              onClick={() => setPreviewSheetWidthMode('full')}
                            >
                              Full width
                            </Button>
                            <Button
                              type="button"
                              variant={
                                previewSheetWidthMode === 'print'
                                  ? 'secondary'
                                  : 'ghost'
                              }
                              size="sm"
                              className="rounded-sm"
                              aria-pressed={previewSheetWidthMode === 'print'}
                              onClick={() => setPreviewSheetWidthMode('print')}
                            >
                              PDF width
                            </Button>
                          </div>
                        </div>
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
                                    minWidth: REPORT_PRINT_LAYOUT_WIDTH_PX,
                                  }) as CSSProperties
                            }
                          >
                            <PrintReportPreview
                              reportTypeName={report.name}
                              data={data}
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
                          {report.name === 'custom' ? (
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
                          ) : null}
                        </div>
                        {data.sections.map((section: ReportSectionData) => (
                          <TabsContent
                            key={section.id}
                            value={section.id}
                            className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
                          >
                            {report.name === 'custom' ? (
                              <CustomReportPreviewSection
                                section={section}
                                config={customReportFields}
                                onFieldsChange={setCustomReportFields}
                              />
                            ) : (
                              <ReportSection section={section} />
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                      {report.name !== 'custom' ? (
                        <div
                          className="report-html-container border-border max-h-[60vh] min-h-0 w-full min-w-0 shrink-0 overflow-auto border-t bg-white px-6 pt-0 pb-6"
                          aria-label="Print layout preview"
                        >
                          <div
                            className="report-print-preview-root"
                            style={{
                              minWidth: REPORT_PRINT_LAYOUT_WIDTH_PX,
                            }}
                          >
                            <PrintReportPreview
                              reportTypeName={report.name}
                              data={data}
                            />
                          </div>
                        </div>
                      ) : null}
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
