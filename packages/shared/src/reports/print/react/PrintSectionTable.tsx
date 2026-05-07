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

function PrintSectionColumnHeaderRow({
  sectionLegendColor,
}: {
  sectionLegendColor: string | null;
}) {
  const bgHex = safeSwatchColor(sectionLegendColor);
  const foreground = bgHex
    ? contrastingBlackOrWhiteForegroundHex(bgHex)
    : null;
  const lines = foreground ? theadHeaderLinesFromFg(foreground) : null;

  return (
    <tr>
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
 * Renders the section title outside the bordered grid, then one table per
 * calendar day with the day label above the column header row.
 */
export function PrintGroupedSectionTable({
  sectionPrintLabel,
  sectionLegendColor,
  days,
  variant,
}: {
  sectionPrintLabel: string;
  /** When set on the section config, table header cells inherit the legend swatch. */
  sectionLegendColor: string | null;
  days: PrintGroupedSectionDayBlock[];
  variant: PrintReportVariant;
}) {
  return (
    <>
      <PrintSectionHeading
        sectionName={sectionPrintLabel}
        sectionLegendColor={sectionLegendColor}
      />
      {days.map((day) => (
        <div key={day.dayKey} className="corpcal-print-day">
          <h3 className="corpcal-print-day-heading">{day.dayHeading}</h3>
          <div className="corpcal-print-table-wrap">
            <table className="corpcal-print-table" role="grid">
              <PrintSectionColGroup />
              <thead>
                <PrintSectionColumnHeaderRow
                  sectionLegendColor={sectionLegendColor}
                />
              </thead>
              <tbody>
                {day.rows.map((row) => (
                  <PrintRow key={row.activityId} row={row} variant={variant} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
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
