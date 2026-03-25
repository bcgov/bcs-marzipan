import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  downloadReportCsv,
  fetchReportData,
  fetchReportsList,
  type ReportSectionData,
} from '@/api/reportsApi';
import { PageHeader } from '@/components/layout';
import { ReportSection } from '@/components/reports/ReportSection';
import { StatusMessage } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showErrorToast } from '@/lib/error-toast';
import { exportReportToPdf } from '@/lib/report-pdf-export';
import { cn } from '@/lib/utils';

const REPORTS_TAB_STORAGE_KEY = 'reportsTab';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const initialTabAppliedRef = useRef(false);

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReportsList,
  });

  // Initialize with first report or stored value
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['report-data', activeReport, startDate, endDate],
    queryFn: () =>
      activeReport
        ? fetchReportData(activeReport, {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          })
        : Promise.reject(new Error('No report selected')),
    enabled: !!activeReport,
  });

  const handleTabChange = (reportName: string) => {
    setActiveReport(reportName);
    sessionStorage.setItem(REPORTS_TAB_STORAGE_KEY, reportName);
  };

  const handleExportCsv = async () => {
    if (!activeReport) return;
    setIsExporting(true);
    try {
      await downloadReportCsv(activeReport, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (error) {
      showErrorToast(error, 'Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (!data) return;
    setIsExporting(true);
    try {
      exportReportToPdf(data);
    } catch (error) {
      showErrorToast(error, 'Failed to export PDF. Please try again.');
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
    <>
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

      {/* Report Tabs - matches Activity List View pattern */}
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

        {/* Filters Section - matches Activity List View pattern */}
        {/* <div className="mt-6 mb-6 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Filters</h3> */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-sm">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date" className="text-sm">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {/* </div> */}

        {/* Report Content */}
        {reports.map((report) => (
          <TabsContent key={report.id} value={report.name} className="mt-0">
            <div className="min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading report...</p>
                </div>
              ) : data ? (
                <div className="space-y-4">
                  <Tabs
                    defaultValue={data.sections[0]?.id ?? 'section-1'}
                    className="w-full"
                  >
                    <TabsList className="mb-4">
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
                        className="mt-0 outline-none"
                      >
                        <ReportSection section={section} />
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    Select filters and the report will load automatically
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
