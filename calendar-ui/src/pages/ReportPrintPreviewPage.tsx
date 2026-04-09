import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';

import {
  fetchReportData,
  type ReportDataRequestParams,
} from '@/api/reportsApi';
import { StatusMessage } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { showErrorToast } from '@/lib/error-toast';
import {
  getReportTemplateHtml,
  handleReportExport,
  type ReportExportFormat,
} from '@/lib/report-export';
import { REPORT_PRINT_PREVIEW_STORAGE_KEY } from '@/lib/report-print-preview';

const DEFAULT_PARAMS: ReportDataRequestParams = {
  page: 1,
  limit: 500,
};

function readSnapshotParams(reportType: string): ReportDataRequestParams {
  try {
    const raw = sessionStorage.getItem(REPORT_PRINT_PREVIEW_STORAGE_KEY);
    if (!raw) return DEFAULT_PARAMS;
    const parsed = JSON.parse(raw) as {
      type?: string;
      params?: ReportDataRequestParams;
    };
    if (parsed.type === reportType && parsed.params) {
      return { ...DEFAULT_PARAMS, ...parsed.params };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PARAMS;
}

export function ReportPrintPreviewPage() {
  const [searchParams] = useSearchParams();
  const reportType = (searchParams.get('type') ?? '').trim();
  const [isExporting, setIsExporting] = useState(false);

  const requestParams = useMemo(
    () => readSnapshotParams(reportType),
    [reportType]
  );

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['report-print-preview', reportType, requestParams],
    queryFn: () => fetchReportData(reportType, requestParams),
    enabled: reportType.length > 0,
  });

  const html = useMemo(() => {
    if (!data || !reportType) return '';
    return getReportTemplateHtml(reportType, data);
  }, [data, reportType]);

  const runExport = async (format: ReportExportFormat) => {
    if (!reportType) return;
    setIsExporting(true);
    try {
      await handleReportExport({
        reportType,
        format,
        data,
        queryParams: requestParams,
      });
    } catch (err) {
      const label =
        format === 'pdf' ? 'PDF' : format === 'csv' ? 'CSV' : 'spreadsheet';
      showErrorToast(err, `Failed to export ${label}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportControlsDisabled =
    !data || isLoading || isFetching || isExporting;

  if (!reportType) {
    return (
      <div className="bg-muted/40 min-h-screen py-6">
        <div className="bg-background text-muted-foreground mx-auto max-w-[1200px] px-4 py-8 shadow-md">
          <p className="text-sm">
            Missing report type. Open Print Preview from the Reports page.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <StatusMessage
        title="Could not load report"
        message={
          error instanceof Error
            ? error.message
            : 'Failed to load print preview'
        }
        variant="error"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-[1200px] bg-white px-4 py-6 shadow-md print:max-w-none print:shadow-none">
        <div
          className="mb-4 flex flex-col items-end gap-2 print:hidden"
          aria-busy={isExporting}
        >
          {isExporting ? (
            <span className="text-muted-foreground text-sm">
              Export in progress…
            </span>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportControlsDisabled}
              onClick={() => void runExport('pdf')}
            >
              Export PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportControlsDisabled}
              onClick={() => void runExport('csv')}
            >
              Export CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportControlsDisabled}
              onClick={() => void runExport('xlsx')}
            >
              Export XLSX
            </Button>
          </div>
        </div>

        {isLoading || isFetching ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Loading print preview…
          </div>
        ) : (
          <div
            className="report-print-preview-root min-w-0"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
