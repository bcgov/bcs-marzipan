import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

import {
  fetchReportData,
  type ReportDataRequestParams,
} from '@/api/reportsApi';
import { StatusMessage } from '@/components/shared';
import { getReportTemplateHtml } from '@/lib/report-export';
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

  if (isLoading || isFetching) {
    return (
      <div className="bg-muted/40 min-h-screen py-6">
        <div className="bg-background text-muted-foreground mx-auto max-w-[1200px] px-4 py-12 text-center text-sm shadow-md">
          Loading print preview…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-[1200px] bg-white px-4 py-6 shadow-md print:max-w-none print:shadow-none">
        <div
          className="report-print-preview-root min-w-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
