import PDFDocument from 'pdfkit';

import type { ReportExportTable } from '@corpcal/shared/reports/reportExportFormat';

/**
 * Optional layout for PDF; defaults are generic (no fixed branding or grid).
 */
export interface ReportPdfRenderOptions {
  margin?: number;
  titleFontSize?: number;
  bodyFontSize?: number;
  /** Optional lines between title and table (e.g. date range). */
  preambleLines?: string[];
  /**
   * Column width fractions (must sum to 1). Length should match `table.columns.length`.
   * If omitted, columns are equally wide.
   */
  columnWidthFractions?: number[];
}

function normalizeFractions(n: number, fractions?: number[]): number[] {
  if (!fractions?.length || fractions.length !== n) {
    return Array(n).fill(1 / n);
  }
  const sum = fractions.reduce((a, b) => a + b, 0);
  if (sum <= 0) return Array(n).fill(1 / n);
  return fractions.map((f) => f / sum);
}

/**
 * Renders a {@link ReportExportTable} to a PDF buffer using a simple flow layout.
 * No hardcoded report-specific graphics; callers can extend via {@link ReportPdfRenderOptions}.
 */
export function renderReportTableToPdfBuffer(
  table: ReportExportTable,
  meta: { title: string },
  options?: ReportPdfRenderOptions
): Promise<Buffer> {
  const margin = options?.margin ?? 48;
  const titleSize = options?.titleFontSize ?? 14;
  const bodySize = options?.bodyFontSize ?? 8;
  const fracs = normalizeFractions(
    table.columns.length,
    options?.columnWidthFractions
  );

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      margin,
      size: 'LETTER',
      autoFirstPage: true,
    });

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(titleSize).text(meta.title, {
      align: 'left',
    });
    doc.moveDown(0.75);

    for (const line of options?.preambleLines ?? []) {
      if (line.trim() === '') continue;
      doc
        .font('Helvetica')
        .fontSize(bodySize + 1)
        .text(line);
      doc.moveDown(0.35);
    }

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidths = fracs.map((f) => f * contentWidth);
    const lineHeight = bodySize + 4;

    const drawHeaderRow = () => {
      const startY = doc.y;
      let x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(bodySize);
      let maxHeaderH = lineHeight;
      table.columns.forEach((label, i) => {
        const h = doc.heightOfString(String(label), { width: colWidths[i] });
        if (h > maxHeaderH) maxHeaderH = h;
        doc.text(String(label), x, startY, {
          width: colWidths[i],
          align: 'left',
        });
        x += colWidths[i];
      });
      doc.y = startY + maxHeaderH + 4;
    };

    const rowBottomLimit = () => doc.page.height - doc.page.margins.bottom;

    const measureRowHeight = (cells: string[]): number => {
      doc.font('Helvetica').fontSize(bodySize);
      let maxH = lineHeight;
      cells.forEach((cell, i) => {
        const h = doc.heightOfString(cell ?? '', { width: colWidths[i] });
        if (h > maxH) maxH = h;
      });
      return maxH + 4;
    };

    const drawDataRow = (cells: string[]) => {
      const needed = measureRowHeight(cells);
      if (doc.y + needed > rowBottomLimit()) {
        doc.addPage();
        drawHeaderRow();
      }

      const startY = doc.y;
      let x = doc.page.margins.left;
      doc.font('Helvetica').fontSize(bodySize);
      cells.forEach((cell, i) => {
        doc.text(cell ?? '', x, startY, {
          width: colWidths[i],
          align: 'left',
        });
        x += colWidths[i];
      });
      const rowH = measureRowHeight(cells);
      doc.y = startY + rowH;
    };

    drawHeaderRow();

    for (const row of table.rows) {
      drawDataRow(row);
    }

    doc.end();
  });
}
