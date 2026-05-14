import { useMemo, type ReactNode } from 'react';

import type { ReportDataResponse } from '@corpcal/shared/api/types';
import {
  CUSTOM_REPORT_PRINT_STYLES,
  isReactRenderableReportType,
  PRINT_STYLES,
  PrintCustomReportDocument,
  PrintPdfFooterHintLine,
  PrintPlanningDocument,
  PrintReportDocument,
  rollupPrintVariantForReportType,
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
 * Returns `null` when `reportTypeName` is not a supported print report type.
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
  let document: ReactNode;
  if (reportTypeName === 'planning') {
    document = <PrintPlanningDocument />;
  } else if (reportTypeName === 'custom') {
    document = <PrintCustomReportDocument data={data} />;
  } else {
    document = (
      <PrintReportDocument
        data={data}
        variant={rollupPrintVariantForReportType(reportTypeName)}
        activityBaseUrl={activityBaseUrl}
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
      {/* Preview-only wrapper: scopes sticky stacking rules in PRINT_STYLES so
          the same stylesheet, when injected into the Puppeteer-rendered PDF
          (which has no shell), leaves print output unaffected. */}
      <div className="corpcal-print-preview-shell">
        <PrintPdfFooterHintLine />
        {document}
      </div>
    </>
  );
}
