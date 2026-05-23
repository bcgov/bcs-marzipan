import { describe, expect, it } from 'vitest';

import {
  REPORT_LETTER_CONTENT_WIDTH_PX,
  REPORT_PRINT_BODY_FONT_SIZE_PX,
  REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_BODY_TARGET_PRINT_PT,
  REPORT_PRINT_COVER_CONTENT_WIDTH_PX,
  REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_COVER_SHEET_WIDTH_PX,
  REPORT_PRINT_LAYOUT_WIDTH_PX,
  reportPdfTemplateCssPxForPrintPt,
} from './reportPrintDimensions';

describe('reportPrintDimensions', () => {
  it('targets ~10.5pt body on Letter at 16px body font', () => {
    const printCssPx =
      REPORT_PRINT_BODY_FONT_SIZE_PX *
      REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE;
    const printPt = (printCssPx * 72) / 96;
    expect(printPt).toBeCloseTo(REPORT_PRINT_BODY_TARGET_PRINT_PT, 1);
  });

  it('keeps cover sheet width independent of body layout width', () => {
    expect(REPORT_PRINT_COVER_SHEET_WIDTH_PX).toBeGreaterThan(
      REPORT_PRINT_LAYOUT_WIDTH_PX
    );
    expect(REPORT_PRINT_COVER_CONTENT_WIDTH_PX).toBe(
      REPORT_PRINT_COVER_SHEET_WIDTH_PX - 48
    );
  });

  it('uses distinct PDF scales for body vs cover', () => {
    expect(REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE).toBeCloseTo(
      REPORT_LETTER_CONTENT_WIDTH_PX / REPORT_PRINT_LAYOUT_WIDTH_PX,
      8
    );
    expect(REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE).toBeCloseTo(
      REPORT_LETTER_CONTENT_WIDTH_PX / REPORT_PRINT_COVER_SHEET_WIDTH_PX,
      8
    );
    expect(REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE).toBeGreaterThan(
      REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE
    );
  });

  it('maps print pt to template px inversely with layout scale', () => {
    const bodyPx = reportPdfTemplateCssPxForPrintPt(
      8.5,
      REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE
    );
    const coverPx = reportPdfTemplateCssPxForPrintPt(
      8.5,
      REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE
    );
    expect(coverPx).toBeGreaterThan(bodyPx);
    expect(bodyPx * REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE).toBeCloseTo(
      (8.5 * 96) / 72,
      0
    );
  });
});
