import { describe, expect, it } from 'vitest';

import {
  formatActivityNumericIdPadded,
  resolveActivityToastDisplayId,
} from './activity-toast-options';

describe('formatActivityNumericIdPadded', () => {
  it('pads ids shorter than 6 digits with leading zeros', () => {
    expect(formatActivityNumericIdPadded(1)).toBe('000001');
    expect(formatActivityNumericIdPadded(42)).toBe('000042');
    expect(formatActivityNumericIdPadded(999999)).toBe('999999');
  });

  it('does not change ids that are already 6 or more digits', () => {
    expect(formatActivityNumericIdPadded(1_000_000)).toBe('1000000');
  });
});

describe('resolveActivityToastDisplayId', () => {
  it('returns displayId from the API when present', () => {
    expect(resolveActivityToastDisplayId('MIN-000001', 1)).toBe('MIN-000001');
  });

  it('falls back to CAL-{paddedId} when displayId is missing', () => {
    expect(resolveActivityToastDisplayId(undefined, 7)).toBe('CAL-000007');
    expect(resolveActivityToastDisplayId(null, 7)).toBe('CAL-000007');
  });
});
