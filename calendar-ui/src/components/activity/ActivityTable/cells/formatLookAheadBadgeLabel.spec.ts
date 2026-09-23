import { describe, expect, it } from 'vitest';

import type { LookAheadSectionRow } from '@corpcal/shared/reports/look-ahead';

import { formatLookAheadBadgeLabel } from './formatLookAheadBadgeLabel';

const sectionRows: LookAheadSectionRow[] = [
  {
    sectionId: 'events-section',
    order: 1,
    lookAheadKey: 'events',
    uiLabel: 'Events',
    reportLegendLabel: 'Events',
    legendColor: '#ff0000',
    printPerDayColumnHeaderRepeat: null,
    printOmitReleaseColumn: null,
  },
];

describe('formatLookAheadBadgeLabel', () => {
  it('returns null when status is missing or none', () => {
    expect(formatLookAheadBadgeLabel(null, 'events', sectionRows)).toBeNull();
    expect(formatLookAheadBadgeLabel('none', 'events', sectionRows)).toBeNull();
  });

  it('formats section and status as LA Events (New)', () => {
    expect(formatLookAheadBadgeLabel('new', 'events', sectionRows)).toBe(
      'LA Events (New)'
    );
  });

  it('falls back to LA status when section is absent', () => {
    expect(formatLookAheadBadgeLabel('changed', null, sectionRows)).toBe(
      'LA Changed'
    );
  });

  it('falls back to raw section key when config row is missing', () => {
    expect(formatLookAheadBadgeLabel('new', 'legacy-key', sectionRows)).toBe(
      'LA legacy-key (New)'
    );
  });
});
