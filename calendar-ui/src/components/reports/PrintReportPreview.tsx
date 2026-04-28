import { useMemo, type ReactNode } from 'react';

import type { ReportDataResponse } from '@corpcal/shared/api/types';
import {
  CUSTOM_REPORT_PRINT_STYLES,
  isReactRenderableReportType,
  PRINT_STYLES,
  PrintCustomReportDocument,
  PrintPlanningDocument,
  PrintReportDocument,
  type ReactRenderableReportType,
} from '@corpcal/shared/reports/reportPrintHtml';

/**
 * Resolves the public application base URL used when building absolute
 * `href`s in the print preview. Falls back to the current origin so local
 * development works without extra env config.
 */
function resolveActivityBaseUrl(): string {
  const envBase = import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim();
  if (envBase && envBase.length > 0) return envBase.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
}

/**
 * In-app preview of a print-formatted report. Mounts the same React
 * components the calendar-service renders to a static string for PDF export
 * so WYSIWYG parity is preserved.
 *
 * Returns `null` for report types that are not yet part of the React print
 * pipeline so callers can fall back to their existing rendering path.
 */
export function PrintReportPreview({
  reportTypeName,
  data,
}: {
  reportTypeName: string;
  data: ReportDataResponse;
}) {
  const activityBaseUrl = useMemo(() => resolveActivityBaseUrl(), []);

  if (!isReactRenderableReportType(reportTypeName)) {
    return null;
  }

  return (
    <PrintReportPreviewRoot
      reportTypeName={reportTypeName}
      data={data}
      activityBaseUrl={activityBaseUrl}
    />
  );
}

function PrintReportPreviewRoot({
  reportTypeName,
  data,
  activityBaseUrl,
}: {
  reportTypeName: ReactRenderableReportType;
  data: ReportDataResponse;
  activityBaseUrl: string;
}) {
  // Inlined once per preview mount — classname-scoped so rules never leak.
  const generatedAt = new Date();

  let document: ReactNode;
  if (reportTypeName === 'planning') {
    document = <PrintPlanningDocument />;
  } else if (reportTypeName === 'custom') {
    document = <PrintCustomReportDocument data={data} />;
  } else {
    document = (
      <PrintReportDocument
        data={data}
        variant={
          reportTypeName === 'exec' || reportTypeName === 'exec-look-ahead'
            ? 'exec'
            : 'lookAhead'
        }
        activityBaseUrl={activityBaseUrl}
        generatedAt={generatedAt}
      />
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `${PRINT_STYLES}${CUSTOM_REPORT_PRINT_STYLES}`,
        }}
      />
      {document}
    </>
  );
}
