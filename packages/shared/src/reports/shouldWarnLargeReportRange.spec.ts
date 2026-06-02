import { describe, expect, it } from 'vitest';

import { shouldWarnLargeReportRange } from './shouldWarnLargeReportRange';

describe('shouldWarnLargeReportRange', () => {
  it('warns when span exceeds 365 days', () => {
    expect(shouldWarnLargeReportRange({ spanDays: 366 })).toBe(true);
  });

  it('does not warn at exactly 365 days', () => {
    expect(shouldWarnLargeReportRange({ spanDays: 365 })).toBe(false);
  });

  it('does not warn for short spans', () => {
    expect(shouldWarnLargeReportRange({ spanDays: 14 })).toBe(false);
  });
});
