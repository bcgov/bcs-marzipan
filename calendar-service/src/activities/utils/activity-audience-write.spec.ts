import { describe, expect, it } from 'vitest';

import { buildActivityTimestampUpdate } from './activity-audience-write';

describe('buildActivityTimestampUpdate', () => {
  const userId = 7;
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('bumps operational and public timestamps for public audience', () => {
    expect(buildActivityTimestampUpdate('public', userId, now)).toEqual({
      lastUpdatedBy: userId,
      lastUpdatedDateTime: now,
      publicLastUpdatedBy: userId,
      publicLastUpdatedDateTime: now,
    });
  });

  it('bumps only operational timestamps for internal audience', () => {
    expect(buildActivityTimestampUpdate('internal', userId, now)).toEqual({
      lastUpdatedBy: userId,
      lastUpdatedDateTime: now,
    });
  });

  it('bumps only operational timestamps for private audience', () => {
    expect(buildActivityTimestampUpdate('private', userId, now)).toEqual({
      lastUpdatedBy: userId,
      lastUpdatedDateTime: now,
    });
  });
});
