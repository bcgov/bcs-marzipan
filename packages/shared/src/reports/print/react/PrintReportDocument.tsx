import type { ReportDataResponse } from '../../../api/report-data';
import type { ReportDateRange } from '../../normalizeReportActivityDateRange';
import {
  effectiveReportFieldsIncludeEventLead,
  getEffectiveReportFields,
} from '../../reportTypeConfig';
import {
  collectPrintReportSections,
  printReportHasAnyActivities,
  type PrintReportSortedSection,
} from '../collectPrintReportSections';
import { buildPrintGroupedDayBlocks } from '../buildPrintGroupedDayBlocks';
import {
  VARIANT_TO_FIRST_PAGE_TITLE,
  VARIANT_TO_TEMPLATE_SLUG,
} from '../preview/printPreviewVariantMeta';
import { PrintGroupedSectionTable } from './PrintSectionTable';
import { CORPCAL_PRINT_ROOT_CLASS } from './printStyles';
import type { PrintReportVariant } from './rowViewModel';
import type { TranslationLanguageLabelResolver } from './translationLanguageDisplayLabels';

/**
 * Top-level print document. Drives the shell (header, banner, contents)
 * and walks sections in report order, then days within each section, delegating
 * row rendering to {@link PrintGroupedSectionTable} / {@link PrintRow}.
 */
export function PrintReportDocument({
  data,
  variant,
  activityBaseUrl,
  highlightActivityIds,
  resolveTranslationLanguageLabel,
}: {
  data: ReportDataResponse;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  /** In-app preview: flash rows briefly after remote activity updates. */
  highlightActivityIds?: ReadonlySet<number>;
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}) {
  const sections = collectPrintReportSections(data);
  const hasSections = sections.length > 0;
  const hasAny = printReportHasAnyActivities(sections);
  const effectiveFields = getEffectiveReportFields(data.report);
  const showEventLead = effectiveReportFieldsIncludeEventLead(effectiveFields);
  const firstPageTitle = hasAny
    ? VARIANT_TO_FIRST_PAGE_TITLE[variant]
    : undefined;

  return (
    <div
      className={CORPCAL_PRINT_ROOT_CLASS}
      data-report-template={VARIANT_TO_TEMPLATE_SLUG[variant]}
    >
      <div className="corpcal-print-body">
        {firstPageTitle ? (
          <PrintPdfFirstPageTitle title={firstPageTitle} />
        ) : null}
        {!hasSections ? (
          <div className="corpcal-print-empty">
            No activities in the selected range.
          </div>
        ) : (
          sections.map((section) => (
            <SectionGroup
              key={section.id}
              section={section}
              variant={variant}
              activityBaseUrl={activityBaseUrl}
              showEventLead={showEventLead}
              highlightActivityIds={highlightActivityIds}
              resolvedDateRange={data.meta?.resolvedDateRange}
              resolveTranslationLanguageLabel={resolveTranslationLanguageLabel}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PrintPdfFirstPageTitle({ title }: { title: string }) {
  return (
    <div className="corpcal-print-pdf-first-page-title" aria-hidden="true">
      {title}
    </div>
  );
}

function SectionGroup({
  section,
  variant,
  activityBaseUrl,
  showEventLead,
  highlightActivityIds,
  resolvedDateRange,
  resolveTranslationLanguageLabel,
}: {
  section: PrintReportSortedSection;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  showEventLead: boolean;
  highlightActivityIds?: ReadonlySet<number>;
  resolvedDateRange?: ReportDateRange;
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}) {
  const dayBlocks = buildPrintGroupedDayBlocks({
    activitiesByKey: section.activitiesByKey,
    resolvedDateRange,
    showPerDayPrintChrome: section.showPerDayPrintChrome,
    variant,
    activityBaseUrl,
    resolveTranslationLanguageLabel,
  });

  return (
    <section className="corpcal-print-section-block">
      <PrintGroupedSectionTable
        sectionPrintLabel={section.printHeadingLabel}
        sectionLegendColor={section.legendColor}
        days={dayBlocks}
        variant={variant}
        showPerDayPrintChrome={section.showPerDayPrintChrome}
        showEventLead={showEventLead}
        omitReleaseColumn={section.omitReleaseColumn}
        highlightActivityIds={highlightActivityIds}
      />
    </section>
  );
}
