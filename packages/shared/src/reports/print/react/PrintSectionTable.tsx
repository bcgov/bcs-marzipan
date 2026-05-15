import { contrastingBlackOrWhiteForegroundHex } from '../../../utils/wcagContrast';
import { PrintRow } from './PrintRow';
import type { PrintReportVariant, PrintRowViewModel } from './rowViewModel';

export const PRINT_SECTION_COLUMN_HEADERS = [
  'Date & Time',
  'Lead',
  'Activity Details',
  'Release',
  'Activity',
] as const;

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function safeSwatchColor(color: string | null | undefined): string | null {
  if (!color) return null;
  return HEX_COLOR_REGEX.test(color) ? color : null;
}

function theadHeaderLinesFromFg(fg: '#ffffff' | '#000000'): {
  bottom: string;
  innerDivider: string;
} {
  return fg === '#ffffff'
    ? { bottom: 'rgba(255,255,255,0.33)', innerDivider: 'rgba(255,255,255,0.38)' }
    : { bottom: 'rgba(0,0,0,0.16)', innerDivider: 'rgba(0,0,0,0.14)' };
}

/**
 * Section title row (swatch + label) for print/PDF, shared by
 * {@link PrintSectionTable} and section-first layouts that render one heading
 * above multiple day tables.
 */
export function PrintSectionHeading({
  sectionName,
  sectionLegendColor,
}: {
  sectionName: string;
  sectionLegendColor?: string | null;
}) {
  const swatchColor = safeSwatchColor(sectionLegendColor);
  return (
    <div className="corpcal-print-section-heading">
      {swatchColor ? (
        <span
          aria-hidden="true"
          className="corpcal-print-section-swatch"
          style={{ backgroundColor: swatchColor }}
        />
      ) : null}
      <span>{sectionName}</span>
    </div>
  );
}

export interface PrintGroupedSectionDayBlock {
  dayKey: string;
  dayHeading: string;
  rows: PrintRowViewModel[];
}

function PrintSectionColGroup() {
  return (
    <colgroup>
      <col className="corpcal-print-col-1" />
      <col className="corpcal-print-col-2" />
      <col className="corpcal-print-col-3" />
      <col className="corpcal-print-col-4" />
      <col className="corpcal-print-col-5" />
    </colgroup>
  );
}

const SECTION_COLUMN_SPAN = PRINT_SECTION_COLUMN_HEADERS.length;

function PrintSectionColumnHeaderRow({
  sectionLegendColor,
  rowClassName,
}: {
  sectionLegendColor: string | null;
  /** Applied to the column-header `<tr>`; per-day vs flat-rollup thead use distinct classes for border/radius. */
  rowClassName?: string;
}) {
  const bgHex = safeSwatchColor(sectionLegendColor);
  const foreground = bgHex
    ? contrastingBlackOrWhiteForegroundHex(bgHex)
    : null;
  const lines = foreground ? theadHeaderLinesFromFg(foreground) : null;

  return (
    <tr className={rowClassName}>
      {PRINT_SECTION_COLUMN_HEADERS.map((label, i) => {
        const colClass = `corpcal-print-col-${i + 1}`;
        if (!bgHex || foreground === null || !lines) {
          return (
            <th key={label} scope="col" className={colClass}>
              {label}
            </th>
          );
        }
        return (
          <th
            key={label}
            scope="col"
            className={`${colClass} corpcal-print-section-thead-cell`}
            style={{
              backgroundColor: bgHex,
              color: foreground,
              borderBottomColor: lines.bottom,
              ...(i > 0 ? { borderLeftColor: lines.innerDivider } : {}),
            }}
          >
            {label}
          </th>
        );
      })}
    </tr>
  );
}

/**
 * One bordered grid per section. The section title lives in the first `thead` row so
 * it repeats at the top of each printed sheet.
 *
 * When `showPerDayPrintChrome` is true, `thead` contains only the section title;
 * each day's tbody opens with a date heading row and a column header band cloned
 * via `PrintSectionColumnHeaderRow`. When false, `thead` also includes a shared
 * column header row so labels repeat on every printed page with the section title.
 */
export function PrintGroupedSectionTable({
  sectionPrintLabel,
  sectionLegendColor,
  days,
  variant,
  showPerDayPrintChrome,
}: {
  sectionPrintLabel: string;
  /** When set on the section config, table header cells inherit the legend swatch. */
  sectionLegendColor: string | null;
  days: PrintGroupedSectionDayBlock[];
  variant: PrintReportVariant;
  /**
   * When true, render a per-day date row + a clone of the column header band
   * before each day's rows. When false, all days flow as continuous activity
   * rows in a single tbody.
   */
  showPerDayPrintChrome: boolean;
}) {
  return (
    <div className="corpcal-print-table-wrap corpcal-print-table-wrap--section-rollup">
      <table
        className="corpcal-print-table corpcal-print-section-rollup-table"
        role="grid"
      >
        <PrintSectionColGroup />
        <thead>
          <tr>
            <td
              colSpan={SECTION_COLUMN_SPAN}
              className="corpcal-print-section-heading-cell"
            >
              <PrintSectionHeading
                sectionName={sectionPrintLabel}
                sectionLegendColor={sectionLegendColor}
              />
            </td>
          </tr>
          {!showPerDayPrintChrome ? (
            <PrintSectionColumnHeaderRow
              rowClassName="corpcal-print-rollup-thead-column-header-row"
              sectionLegendColor={sectionLegendColor}
            />
          ) : null}
        </thead>
        {showPerDayPrintChrome ? (
          days.map((day) => (
            <tbody key={day.dayKey} className="corpcal-print-day-tbody">
              <tr className="corpcal-print-day-heading-row">
                <td
                  colSpan={SECTION_COLUMN_SPAN}
                  className="corpcal-print-day-heading-cell"
                >
                  <h3 className="corpcal-print-day-heading">
                    {day.dayHeading}
                  </h3>
                </td>
              </tr>
              <PrintSectionColumnHeaderRow
                rowClassName="corpcal-print-per-day-column-header-row"
                sectionLegendColor={sectionLegendColor}
              />
              {day.rows.map((row) => (
                <PrintRow key={row.activityId} row={row} variant={variant} />
              ))}
            </tbody>
          ))
        ) : (
          <tbody className="corpcal-print-day-tbody">
            {days.flatMap((day) =>
              day.rows.map((row) => (
                <PrintRow key={row.activityId} row={row} variant={variant} />
              ))
            )}
          </tbody>
        )}
      </table>
    </div>
  );
}

/**
 * Renders a single section's subsection heading + four-column table.
 * Column headers are identical across variants; row content differs via
 * {@link PrintRow}.
 *
 * When `sectionLegendColor` is provided, a 16x16 swatch is rendered to the
 * left of the section heading, color-matched to the same bucket on the look-
 * ahead PDF cover and the activity form/filter UI.
 *
 * When `showSectionHeading` is false, only the grid is rendered (callers that
 * place {@link PrintSectionHeading} separately). For multi-day sections use
 * {@link PrintGroupedSectionTable}.
 */
export function PrintSectionTable({
  sectionName,
  rows,
  variant,
  sectionLegendColor,
  showSectionHeading = true,
}: {
  sectionName: string;
  rows: PrintRowViewModel[];
  variant: PrintReportVariant;
  sectionLegendColor?: string | null;
  /** When false, omits the section heading; parent supplies it once per section. */
  showSectionHeading?: boolean;
}) {
  const resolvedLegend =
    sectionLegendColor === undefined ? null : sectionLegendColor;
  return (
    <div>
      {showSectionHeading ? (
        <PrintSectionHeading
          sectionName={sectionName}
          sectionLegendColor={sectionLegendColor}
        />
      ) : null}
      <div className="corpcal-print-table-wrap">
        <table className="corpcal-print-table" role="grid">
          <PrintSectionColGroup />
          <thead>
            <PrintSectionColumnHeaderRow
              sectionLegendColor={resolvedLegend}
            />
          </thead>
          <tbody>
            {rows.map((row) => (
              <PrintRow key={row.activityId} row={row} variant={variant} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
