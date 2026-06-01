import { useMemo, type ComponentProps, type ReactNode } from 'react';

import {
  buildTranslationLanguageLabelResolver,
  CUSTOM_REPORT_PRINT_STYLES,
  isReactRenderableReportType,
  PRINT_STYLES,
  PrintCustomReportDocument,
  PrintPdfFooterHintLine,
  PrintReportDocument,
  rollupPrintVariantForReportType,
  type ReactRenderableReportType,
} from '@corpcal/shared/reports/reportPrintHtml';
import { trimTrailingSlashes } from '@corpcal/shared/utils';
import type { ReportDataResponse } from '@/api/reportsApi';
import { useTranslationLanguages } from '@/hooks/useLookups';

/** Print components resolve from shared src; API types resolve from shared dist. */
type PrintReportDocumentData = ComponentProps<
  typeof PrintReportDocument
>['data'];

/**
 * Resolves the public application base URL used when building absolute
 * `href`s in the print preview. Falls back to the current origin so local
 * development works without extra env config.
 */
function resolveActivityBaseUrl(): string {
  const envBase = import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim();
  if (envBase && envBase.length > 0) return trimTrailingSlashes(envBase);
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
  highlightActivityIds,
}: {
  reportTypeName: string;
  data: ReportDataResponse;
  /** In-app: flash preview rows briefly after remote activity updates. */
  highlightActivityIds?: ReadonlySet<number>;
}) {
  const activityBaseUrl = useMemo(() => resolveActivityBaseUrl(), []);
  const { data: translationLanguages = [] } = useTranslationLanguages();
  const resolveTranslationLanguageLabel = useMemo(
    () => buildTranslationLanguageLabelResolver(translationLanguages),
    [translationLanguages]
  );

  if (!isReactRenderableReportType(reportTypeName)) {
    return null;
  }

  return (
    <PrintReportPreviewRoot
      reportTypeName={reportTypeName}
      data={data}
      activityBaseUrl={activityBaseUrl}
      highlightActivityIds={highlightActivityIds}
      resolveTranslationLanguageLabel={resolveTranslationLanguageLabel}
    />
  );
}

function PrintReportPreviewRoot({
  reportTypeName,
  data,
  activityBaseUrl,
  highlightActivityIds,
  resolveTranslationLanguageLabel,
}: {
  reportTypeName: ReactRenderableReportType;
  data: ReportDataResponse;
  activityBaseUrl: string;
  highlightActivityIds?: ReadonlySet<number>;
  resolveTranslationLanguageLabel?: ReturnType<
    typeof buildTranslationLanguageLabelResolver
  >;
}) {
  const printData = data as PrintReportDocumentData;
  let document: ReactNode;
  if (reportTypeName === 'custom') {
    document = (
      <PrintCustomReportDocument
        data={printData}
        highlightActivityIds={highlightActivityIds}
      />
    );
  } else {
    document = (
      <PrintReportDocument
        data={printData}
        variant={rollupPrintVariantForReportType(reportTypeName)}
        activityBaseUrl={activityBaseUrl}
        highlightActivityIds={highlightActivityIds}
        resolveTranslationLanguageLabel={resolveTranslationLanguageLabel}
      />
    );
  }

  const showFooterChangedHint =
    reportTypeName !== 'thirty-sixty-ninety' && reportTypeName !== 'planning';

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
        {showFooterChangedHint ? <PrintPdfFooterHintLine /> : null}
        {document}
      </div>
    </>
  );
}
