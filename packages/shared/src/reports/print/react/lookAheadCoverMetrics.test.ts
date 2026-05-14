import { describe, expect, it } from 'vitest';

import { REPORT_PRINT_COVER_CONTENT_WIDTH_PX } from '../../reportPrintDimensions';
import {
  formatLookAheadCoverLayoutLength,
  LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX,
  lookAheadCoverFooterTopBaselinePx,
  scaleLookAheadCoverLayoutPx,
} from './lookAheadCoverMetrics';

describe('lookAheadCoverMetrics', () => {
  it('baseline reference width matches live print cover column (update together)', () => {
    expect(REPORT_PRINT_COVER_CONTENT_WIDTH_PX).toBe(
      LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX
    );
  });

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

  it('footer top baseline matches contents geometry (golden; keep in sync with printStyles list + heading)', () => {
    expect(lookAheadCoverFooterTopBaselinePx(0)).toBe(968);
    expect(lookAheadCoverFooterTopBaselinePx(2)).toBe(1032);
  });
});
