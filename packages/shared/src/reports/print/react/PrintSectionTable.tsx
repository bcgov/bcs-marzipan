import { PrintRow } from './PrintRow';
import type { PrintReportVariant, PrintRowViewModel } from './rowViewModel';

const COLUMN_HEADERS = [
  'Date & Time',
  'Lead',
  'Activity Details',
  'Release',
] as const;

/**
 * Renders a single section's subsection heading + four-column table.
 * Column headers are identical across variants; row content differs via
 * {@link PrintRow}.
 */
export function PrintSectionTable({
  sectionName,
  rows,
  variant,
}: {
  sectionName: string;
  rows: PrintRowViewModel[];
  variant: PrintReportVariant;
}) {
  return (
    <div>
      <div className="corpcal-print-section-heading">{sectionName}</div>
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
