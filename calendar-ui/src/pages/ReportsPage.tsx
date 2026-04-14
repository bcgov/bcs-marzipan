import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { getReportTypeConfigByReportName } from '@corpcal/shared/reports/reportTypeConfig';
import {
  downloadReportCsv,
  fetchReportData,
  fetchReportsList,
  type ReportSectionData,
} from '@/api/reportsApi';
import { PageHeader } from '@/components/layout';
import { ReportActivityFiltersBar } from '@/components/reports/ReportActivityFiltersBar';
import { ReportSection } from '@/components/reports/ReportSection';
import { StatusMessage } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivityTablePreferences } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStatuses } from '@/hooks/useLookups';
import { showErrorToast } from '@/lib/error-toast';
import { buildReportDataRequestParamsFromActivityPreferences } from '@/lib/report-from-activity-filters';
import { exportReportToPdf } from '@/lib/report-pdf-export';
import { cn } from '@/lib/utils';

const REPORTS_TAB_STORAGE_KEY = 'reportsTab';

export function ReportsPage() {
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const { preferences, setPreferences } =
    useActivityTablePreferences(canSeeDeleted);
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

  const [activeReport, setActiveReport] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const initialTabAppliedRef = useRef(false);
  const defaultsAppliedForReportRef = useRef<string | null>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReportsList,
  });

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
    queryKey: ['report-data', activeReport, reportQueryParams],
    queryFn: () =>
      activeReport
        ? fetchReportData(activeReport, reportQueryParams)
        : Promise.reject(new Error('No report selected')),
    enabled: !!activeReport,
  });

  const handleTabChange = (reportName: string) => {
    setActiveReport(reportName);
    defaultsAppliedForReportRef.current = null;
    sessionStorage.setItem(REPORTS_TAB_STORAGE_KEY, reportName);
  };

  const handleExportCsv = async () => {
    if (!activeReport) return;
    setIsExporting(true);
    try {
      await downloadReportCsv(activeReport, reportQueryParams);
    } catch (err) {
      showErrorToast(err, 'Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (!data) return;
    setIsExporting(true);
    try {
      exportReportToPdf(data);
    } catch (err) {
      showErrorToast(err, 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={!data || isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <button
                type="button"
                onClick={() => void handleExportCsv()}
                disabled={isExporting}
                className={cn(
                  'hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm',
                  isExporting && 'cursor-not-allowed opacity-50'
                )}
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </button>
              <button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={isExporting}
                className={cn(
                  'hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm',
                  isExporting && 'cursor-not-allowed opacity-50'
                )}
              >
                {isExporting ? 'Exporting...' : 'Export as PDF'}
              </button>
            </PopoverContent>
          </Popover>
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
              <ReportActivityFiltersBar
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
                  <Tabs
                    defaultValue={data.sections[0]?.id ?? 'section-1'}
                    className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
                  >
                    <TabsList className="mb-4 shrink-0">
                      {data.sections.map((section: ReportSectionData) => (
                        <TabsTrigger key={section.id} value={section.id}>
                          {section.name} ({section.activities.length})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {data.sections.map((section: ReportSectionData) => (
                      <TabsContent
                        key={section.id}
                        value={section.id}
                        className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
                      >
                        <ReportSection section={section} />
                      </TabsContent>
                    ))}
                  </Tabs>
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
    </div>
  );
}
