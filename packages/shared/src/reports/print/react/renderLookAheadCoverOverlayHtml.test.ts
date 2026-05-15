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
      sectionRows: [
        {
          label: 'Events, speeches and releases (inside government)',
          legendColor: '#2C7DA0',
        },
        { label: 'Issues and reports', legendColor: '#C1121F' },
      ],
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

  it('renders section rows with swatch color and label', () => {
    const html = renderLookAheadCoverOverlayHtml({
      dateRangeLine: '',
      contactPhone: '',
      contactEmail: '',
      sectionRows: [
        { label: 'Events', legendColor: '#2C7DA0' },
        { label: 'Issues and reports', legendColor: null },
      ],
    });
    expect(html).toContain('Events');
    expect(html).toContain('Issues and reports');
    expect(html).toContain('background:#2C7DA0');
    expect(html).toContain('corpcal-print-cover-contents-swatch');
  });

  it('escapes html in section labels', () => {
    const html = renderLookAheadCoverOverlayHtml({
      dateRangeLine: '',
      contactPhone: '',
      contactEmail: '',
      sectionRows: [{ label: '<script>x</script>', legendColor: null }],
    });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('drops swatch color when not a valid hex', () => {
    const html = renderLookAheadCoverOverlayHtml({
      dateRangeLine: '',
      contactPhone: '',
      contactEmail: '',
      sectionRows: [{ label: 'Events', legendColor: 'red; }<script>' }],
    });
    expect(html).not.toContain('background:red');
    expect(html).not.toContain('<script>');
  });

  it('falls back to date-empty copy when no date range provided', () => {
    const html = renderLookAheadCoverOverlayHtml({
      dateRangeLine: '   ',
      contactPhone: '',
      contactEmail: '',
      sectionRows: [],
    });
    expect(html).toContain('No activities in the selected range.');
  });
});
