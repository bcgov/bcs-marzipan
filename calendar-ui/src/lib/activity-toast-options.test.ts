import { describe, expect, it } from 'vitest';

import { formatActivityDisplayIdNumericSegment } from '@corpcal/shared';

import { resolveActivityToastDisplayId } from './activity-toast-options';

describe('formatActivityDisplayIdNumericSegment', () => {
  it('pads ids shorter than 6 digits with leading zeros', () => {
    expect(formatActivityDisplayIdNumericSegment(1)).toBe('000001');
    expect(formatActivityDisplayIdNumericSegment(42)).toBe('000042');
    expect(formatActivityDisplayIdNumericSegment(999999)).toBe('999999');
  });

  it('does not truncate ids that are already 6 or more digits', () => {
    expect(formatActivityDisplayIdNumericSegment(1_000_000)).toBe('1000000');
  });
});

describe('resolveActivityToastDisplayId', () => {
  it('returns displayId from the API when present', () => {
    expect(resolveActivityToastDisplayId('MIN-000001', 1)).toBe('MIN-000001');
  });

  it('falls back to TEAM displayId shape when displayId is missing', () => {
    expect(resolveActivityToastDisplayId(undefined, 7)).toBe('TEAM-000007');
    expect(resolveActivityToastDisplayId(null, 7)).toBe('TEAM-000007');
  });

  it('uses full id in fallback when numeric id exceeds six digits', () => {
    expect(resolveActivityToastDisplayId(undefined, 1_000_123)).toBe(
      'TEAM-1000123'
    );
  });
});
