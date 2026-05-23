import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetLiveActivitySyncForTests,
  LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS,
  registerRemoteHighlightQueue,
  scheduleLiveActivityRefresh,
} from './liveActivitySync';

describe('liveActivitySync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetLiveActivitySyncForTests();
  });

  afterEach(() => {
    __resetLiveActivitySyncForTests();
    vi.useRealTimers();
  });

  it('debounces invalidate calls', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    scheduleLiveActivityRefresh(queryClient, {
      source: 'remote',
      activityId: 1,
    });
    scheduleLiveActivityRefresh(queryClient, {
      source: 'remote',
      activityId: 2,
    });

    vi.advanceTimersByTime(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS / 2);
    expect(invalidateSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS / 2 + 1);
    expect(
      invalidateSpy.mock.calls.filter(
        (c) => c[0]?.queryKey?.[0] === 'report-data'
      ).length
    ).toBeGreaterThan(0);
    expect(
      invalidateSpy.mock.calls.some((c) => c[0]?.queryKey?.[0] === 'activities')
    ).toBe(true);
  });

  it('queues highlight ids only for remote events with numeric activityId', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queued: number[] = [];
    registerRemoteHighlightQueue({
      queueRemoteHighlight: (id) => queued.push(id),
    });

    scheduleLiveActivityRefresh(queryClient, {
      source: 'local',
      activityId: 7,
    });
    vi.advanceTimersByTime(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS + 1);
    expect(queued).toEqual([]);
  });

  it('local refresh invalidates reports only by default', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    scheduleLiveActivityRefresh(queryClient, {
      source: 'local',
      activityId: 7,
    });
    vi.advanceTimersByTime(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS + 1);

    expect(
      invalidateSpy.mock.calls.some(
        (c) => c[0]?.queryKey?.[0] === 'report-data'
      )
    ).toBe(true);
    expect(
      invalidateSpy.mock.calls.some((c) => c[0]?.queryKey?.[0] === 'activities')
    ).toBe(false);

    invalidateSpy.mockRestore();
  });

  it('local refresh can invalidate activities when requested', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    scheduleLiveActivityRefresh(queryClient, {
      source: 'local',
      invalidateActivities: true,
    });
    vi.advanceTimersByTime(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS + 1);

    expect(
      invalidateSpy.mock.calls.some((c) => c[0]?.queryKey?.[0] === 'activities')
    ).toBe(true);

    invalidateSpy.mockRestore();
  });

  it('forwards remote highlight ids to the registered queue without consuming', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queued: number[] = [];
    registerRemoteHighlightQueue({
      queueRemoteHighlight: (id) => queued.push(id),
    });

    scheduleLiveActivityRefresh(queryClient, {
      source: 'remote',
      activityId: 15,
    });
    scheduleLiveActivityRefresh(queryClient, {
      source: 'remote',
      activityId: 16,
    });
    vi.advanceTimersByTime(LIVE_ACTIVITY_REFRESH_DEBOUNCE_MS + 1);

    expect([...queued].sort((a, b) => a - b)).toEqual([15, 16]);
    expect(queued).toHaveLength(2);
  });
});
