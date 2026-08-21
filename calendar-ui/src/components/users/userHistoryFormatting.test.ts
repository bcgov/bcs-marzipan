import { describe, expect, it } from 'vitest';

import { buildUserHistoryChangeMessage } from '@/components/users/userHistoryFormatting';

describe('buildUserHistoryChangeMessage activityIds', () => {
  const lookups = {
    roleNamesById: {},
    teamNamesById: {},
    activityTitlesById: { 10: 'Town hall', 11: 'Newsletter' },
  };

  it('lists activity titles when known', () => {
    const message = buildUserHistoryChangeMessage(
      { field: 'activityIds', oldValue: null, newValue: [10, 11] },
      lookups
    );
    expect(message).toContain('2 activities');
    expect(message).toContain('Town hall');
    expect(message).toContain('Newsletter');
  });

  it('falls back to numeric ids when titles are unknown', () => {
    const message = buildUserHistoryChangeMessage(
      { field: 'activityIds', oldValue: null, newValue: [42] },
      { roleNamesById: {}, teamNamesById: {} }
    );
    expect(message).toContain('#42');
  });
});
