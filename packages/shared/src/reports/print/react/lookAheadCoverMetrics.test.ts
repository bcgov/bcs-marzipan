import { describe, expect, it } from 'vitest';

import {
  LOOK_AHEAD_COVER_CONTENTS_PRINT_PT,
  LOOK_AHEAD_COVER_FOOTER_PRINT_PT,
  REPORT_PRINT_COVER_CONTENT_WIDTH_PX,
  REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE,
  reportPdfTemplateCssPxForPrintPt,
} from '../../reportPrintDimensions';
import {
  formatLookAheadCoverLayoutLength,
  LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT,
  LOOK_AHEAD_COVER_CONTENTS_TEXT_BLOCK_HEIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX,
  LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_DATE_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX,
  scaleLookAheadCoverLayoutPx,
} from './lookAheadCoverMetrics';

describe('lookAheadCoverMetrics', () => {
  it('maps a full-column baseline distance to the current cover column width', () => {
    expect(
      scaleLookAheadCoverLayoutPx(LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX)
    ).toBe(REPORT_PRINT_COVER_CONTENT_WIDTH_PX);
  });

  it('scales proportionally with the cover column width', () => {
    const v100 = scaleLookAheadCoverLayoutPx(100);
    expect(v100).toBeCloseTo(
      (100 * REPORT_PRINT_COVER_CONTENT_WIDTH_PX) /
        LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX,
      8
    );
  });

  it('formats CSS lengths as whole pixels', () => {
    expect(formatLookAheadCoverLayoutLength(10)).toBe('10px');
    expect(formatLookAheadCoverLayoutLength(22)).toBe('22px');
  });

  it('targets 12pt footer and 14pt contents on Letter PDF', () => {
    expect(LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX).toBe(
      reportPdfTemplateCssPxForPrintPt(
        LOOK_AHEAD_COVER_FOOTER_PRINT_PT,
        REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE
      )
    );
    expect(LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX).toBe(
      reportPdfTemplateCssPxForPrintPt(
        LOOK_AHEAD_COVER_CONTENTS_PRINT_PT,
        REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE
      )
    );
    expect(LOOK_AHEAD_COVER_TYPO_DATE_FONT_BASELINE_PX).toBe(
      LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX
    );
  });

  it('derives contents text block height from contents font line-height', () => {
    expect(LOOK_AHEAD_COVER_CONTENTS_TEXT_BLOCK_HEIGHT_BASELINE_PX).toBe(
      Math.round(
        LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX *
          LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT
      )
    );
  });
});
