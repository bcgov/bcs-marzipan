import { describe, expect, it } from 'vitest';

import { normalizeActivityStatusLabel } from './constants';

describe('normalizeActivityStatusLabel', () => {
  it('normalizes display names and internal names consistently', () => {
    expect(normalizeActivityStatusLabel('New')).toBe('new');
    expect(normalizeActivityStatusLabel('Delete requested')).toBe(
      'delete_requested'
    );
    expect(normalizeActivityStatusLabel('  Reviewed  ')).toBe('reviewed');
    expect(normalizeActivityStatusLabel('delete_requested')).toBe(
      'delete_requested'
    );
  });
});
