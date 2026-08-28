import { describe, expect, it } from 'vitest';

import { pacificHistoryRecencyBucket } from './datetime-utils';

describe('pacificHistoryRecencyBucket', () => {
  const now = new Date('2026-08-27T19:00:00.000Z');

  it.each([
    ['Today', '2026-08-27T08:00:00.000Z'],
    ['Yesterday', '2026-08-27T06:59:59.000Z'],
    ['This week', '2026-08-25T12:00:00.000Z'],
    ['This week', '2026-08-20T08:00:00.000Z'],
    ['Earlier', '2026-08-20T06:59:59.000Z'],
  ] as const)('returns %s for %s', (expected, timestamp) => {
    expect(pacificHistoryRecencyBucket(new Date(timestamp), now)).toBe(
      expected
    );
  });

  it('puts invalid timestamps in Earlier', () => {
    expect(pacificHistoryRecencyBucket(new Date('invalid'), now)).toBe(
      'Earlier'
    );
  });
});
