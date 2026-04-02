import { describe, expect, it } from 'vitest';

import type { GlobalActivityHistoryEntry } from '@corpcal/shared/api/types';

import {
  formatActorUsername,
  getActorInitials,
  isEntryInDateRange,
  matchesSearch,
  truncateChangeLogValue,
} from '../GlobalHistory';

describe('GlobalHistory helpers', () => {
  it('truncateChangeLogValue keeps short strings', () => {
    const short = 'Short text';
    expect(truncateChangeLogValue(short)).toBe(short);
  });

  it('truncateChangeLogValue trims whitespace and truncates long strings', () => {
    const long = 'a'.repeat(200) + '   \n\n';
    const out = truncateChangeLogValue(long);
    expect(out.length).toBeLessThan(130);
    expect(out.endsWith('...')).toBe(true);
  });

  it('formatActorUsername returns null for empty', () => {
    expect(formatActorUsername('')).toBeNull();
    expect(formatActorUsername(undefined)).toBeNull();
  });

  it('formatActorUsername formats names correctly', () => {
    expect(formatActorUsername('DOMAIN\\jsmith')).toBe('Jsmith');
    expect(formatActorUsername('john.doe@example.com')).toBe('John Doe');
    expect(formatActorUsername('plainuser')).toBe('plainuser');
  });

  it('getActorInitials produces initials', () => {
    const entry = {
      actor: { displayName: 'Alice Bob' },
    } as unknown as GlobalActivityHistoryEntry;
    expect(getActorInitials(entry)).toBe('AB');
  });

  it('isEntryInDateRange handles inactive range', () => {
    const entry = {
      timestamp: new Date().toISOString(),
    } as unknown as GlobalActivityHistoryEntry;
    expect(
      isEntryInDateRange(entry, {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      })
    ).toBe(true);
  });

  it('matchesSearch matches on various fields', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      actor: { displayName: 'Alice Tester', username: 'alice' },
      actionType: 'UPDATE',
      activity: {
        displayId: 'ACT-1',
        title: 'My Activity',
        categories: ['cat1'],
      },
      notes: 'Some notes',
    } as unknown as GlobalActivityHistoryEntry;

    expect(matchesSearch(entry, '')).toBe(true);
    expect(matchesSearch(entry, 'alice')).toBe(true);
    expect(matchesSearch(entry, 'ACT-1')).toBe(true);
    expect(matchesSearch(entry, 'my activity')).toBe(true);
    expect(matchesSearch(entry, 'cat1')).toBe(true);
    expect(matchesSearch(entry, 'nomatch')).toBe(false);
  });
});
