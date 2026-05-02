import { PrintRow } from './PrintRow';
import type { PrintReportVariant, PrintRowViewModel } from './rowViewModel';

const COLUMN_HEADERS = [
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

/**
 * Renders a single section's subsection heading + four-column table.
 * Column headers are identical across variants; row content differs via
 * {@link PrintRow}.
 *
 * When `sectionLegendColor` is provided, a 16x16 swatch is rendered to the
 * left of the section heading, color-matched to the same bucket on the look-
 * ahead PDF cover and the activity form/filter UI.
 */
export function PrintSectionTable({
  sectionName,
  rows,
  variant,
  sectionLegendColor,
}: {
  sectionName: string;
  rows: PrintRowViewModel[];
  variant: PrintReportVariant;
  sectionLegendColor?: string | null;
}) {
  const swatchColor = safeSwatchColor(sectionLegendColor);
  return (
    <div>
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
      <div className="corpcal-print-table-wrap">
        <table className="corpcal-print-table" role="grid">
          <thead>
            <tr>
              <th scope="col" className="corpcal-print-col-1">
                {COLUMN_HEADERS[0]}
              </th>
              <th scope="col" className="corpcal-print-col-2">
                {COLUMN_HEADERS[1]}
              </th>
              <th scope="col" className="corpcal-print-col-3">
                {COLUMN_HEADERS[2]}
              </th>
              <th scope="col" className="corpcal-print-col-4">
                {COLUMN_HEADERS[3]}
              </th>
              <th scope="col" className="corpcal-print-col-5">
                {COLUMN_HEADERS[4]}
              </th>
            </tr>
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
