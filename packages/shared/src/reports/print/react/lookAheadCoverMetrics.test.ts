import { describe, expect, it } from 'vitest';

import { REPORT_PRINT_COVER_CONTENT_WIDTH_PX } from '../../reportPrintDimensions';
import {
  formatLookAheadCoverLayoutLength,
  LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX,
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
});
