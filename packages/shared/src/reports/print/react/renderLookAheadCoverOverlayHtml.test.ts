import { describe, expect, it } from 'vitest';

import { REPORT_PRINT_LAYOUT_WIDTH_PX } from '../../reportPrintDimensions';
import { LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX } from './lookAheadCoverLayout';
import { renderLookAheadCoverOverlayHtml } from './renderLookAheadCoverOverlayHtml';

describe('renderLookAheadCoverOverlayHtml', () => {
  it('scales left offset for 52px Figma coordinate onto layout width', () => {
    const html = renderLookAheadCoverOverlayHtml({
      dateRangeLine: 'Thursday April 30, 2026 to Saturday May 30, 2026',
      contactPhone: '555-555-3498',
      contactEmail: 'gcpe@example.com',
    });
    const scale =
      REPORT_PRINT_LAYOUT_WIDTH_PX / LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX;
    const expectedLeft = 52 * scale;
    expect(html).toContain(`left:${expectedLeft}px`);
    expect(html).toContain('Thursday April 30, 2026');
    expect(html).toContain('555-555-3498');
    expect(html).toContain('Contents:');
    expect(html).toContain('CORPORATE');
  });
});
