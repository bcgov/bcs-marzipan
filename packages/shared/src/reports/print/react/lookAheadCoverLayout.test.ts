import { describe, expect, it } from 'vitest';

import { REPORT_PRINT_LAYOUT_WIDTH_PX } from '../../reportPrintDimensions';
import {
  LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX,
  lookAheadCoverLayoutPx,
  lookAheadCoverLayoutScale,
} from './lookAheadCoverLayout';

describe('lookAheadCoverLayout', () => {
  it('scales from 612px Figma width to print layout width', () => {
    const s = lookAheadCoverLayoutScale();
    expect(s).toBe(
      REPORT_PRINT_LAYOUT_WIDTH_PX / LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX
    );
    expect(lookAheadCoverLayoutPx(612)).toBeCloseTo(
      REPORT_PRINT_LAYOUT_WIDTH_PX,
      5
    );
    expect(lookAheadCoverLayoutPx(349)).toBeCloseTo(349 * s, 8);
  });
});
