import { describe, expect, it } from 'vitest';

import {
  formatActivityDisplayIdForUi,
  formatActivityDisplayIdNumericSegmentForUi,
  normalizeActivityStatusLabel,
} from './constants';

describe('formatActivityDisplayIdForUi', () => {
  it('shows the last six digits of the numeric segment', () => {
    expect(formatActivityDisplayIdNumericSegmentForUi('1222222')).toBe(
      '222222'
    );
    expect(formatActivityDisplayIdForUi('HLTH-1222222')).toBe('HLTH-222222');
    expect(formatActivityDisplayIdForUi('TEAM-000001')).toBe('TEAM-000001');
  });
});

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
