import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMockActivityListItem } from '@corpcal/shared/test-utils/activity-list-item.fixture';

import {
  __resetLiveActivitySyncForTests,
  applyActivityListEditLockFromSocket,
  parseActivityLockChangedPayload,
} from './liveActivitySync';

describe('parseActivityLockChangedPayload', () => {
  it('parses lock acquired payloads', () => {
    expect(
      parseActivityLockChangedPayload({
        activityId: 10,
        locked: true,
        lockedBy: { userId: 2, username: 'editor' },
      })
    ).toEqual({
      activityId: 10,
      locked: true,
      lockedBy: { userId: 2, username: 'editor' },
    });
  });

  it('parses lock released payloads', () => {
    expect(
      parseActivityLockChangedPayload({
        activityId: 10,
        locked: false,
      })
    ).toEqual({
      activityId: 10,
      locked: false,
    });
  });

  it('returns null for invalid payloads', () => {
    expect(parseActivityLockChangedPayload(null)).toBeNull();
    expect(parseActivityLockChangedPayload({ activityId: 1 })).toBeNull();
    expect(
      parseActivityLockChangedPayload({
        activityId: 1,
        locked: true,
      })
    ).toBeNull();
  });
});

describe('applyActivityListEditLockFromSocket', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    __resetLiveActivitySyncForTests();
  });

  afterEach(() => {
    __resetLiveActivitySyncForTests();
  });

  it('updates editLock on matching cached list rows', () => {
    const listKey = ['activities', 'list', {}] as const;
    queryClient.setQueryData(listKey, [
      createMockActivityListItem({ id: 10, editLock: null }),
      createMockActivityListItem({ id: 11, editLock: null }),
    ]);

    const updated = applyActivityListEditLockFromSocket(queryClient, {
      activityId: 10,
      locked: true,
      lockedBy: { userId: 5, username: 'alex' },
    });

    expect(updated).toBe(true);
    const cached =
      queryClient.getQueryData<ReturnType<typeof createMockActivityListItem>[]>(
        listKey
      );
    expect(cached?.[0]?.editLock).toEqual({ userId: 5, username: 'alex' });
    expect(cached?.[1]?.editLock).toBeNull();
  });

  it('clears editLock when lock is released', () => {
    const listKey = ['activities', 'list', {}] as const;
    queryClient.setQueryData(listKey, [
      createMockActivityListItem({
        id: 10,
        editLock: { userId: 5, username: 'alex' },
      }),
    ]);

    applyActivityListEditLockFromSocket(queryClient, {
      activityId: 10,
      locked: false,
    });

    expect(
      queryClient.getQueryData<ReturnType<typeof createMockActivityListItem>[]>(
        listKey
      )?.[0]?.editLock
    ).toBeNull();
  });

  it('updates list queries with normalized filter params in the key', () => {
    const listKey = [
      'activities',
      'list',
      { includeCompleted: false },
    ] as const;
    queryClient.setQueryData(listKey, [
      createMockActivityListItem({ id: 1, editLock: null }),
    ]);

    const updated = applyActivityListEditLockFromSocket(queryClient, {
      activityId: 1,
      locked: true,
      lockedBy: { userId: 2, username: 'Editor' },
    });

    expect(updated).toBe(true);
    expect(
      queryClient.getQueryData<ReturnType<typeof createMockActivityListItem>[]>(
        listKey
      )?.[0]?.editLock
    ).toEqual({ userId: 2, username: 'Editor' });
  });

  it('returns false when the activity is not in cache', () => {
    const updated = applyActivityListEditLockFromSocket(queryClient, {
      activityId: 99,
      locked: true,
      lockedBy: { userId: 1, username: 'a' },
    });
    expect(updated).toBe(false);
  });
});
