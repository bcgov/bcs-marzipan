import { describe, expect, it } from 'vitest';

import { formatMinistrySelectionLabel } from './ministry-tab-label';

describe('formatMinistrySelectionLabel', () => {
  it('returns the fallback when nothing is selected', () => {
    expect(formatMinistrySelectionLabel([])).toBe('Ministry');
  });

  it('returns the single label', () => {
    expect(formatMinistrySelectionLabel(['CITZ'])).toBe('CITZ');
  });

  it('appends the count of additional ministries', () => {
    expect(formatMinistrySelectionLabel(['CITZ', 'AG', 'HLTH'])).toBe(
      'CITZ + 2'
    );
  });
});
