import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '../api/errors';
import { useActivityLock } from './useActivityLock';

const {
  acquireLockMock,
  getLockStatusMock,
  heartbeatLockMock,
  releaseLockMock,
} = vi.hoisted(() => ({
  acquireLockMock: vi.fn(),
  getLockStatusMock: vi.fn(),
  heartbeatLockMock: vi.fn(),
  releaseLockMock: vi.fn(),
}));

vi.mock('../api/locksApi', () => ({
  LOCKED_STATUS: 423,
  acquireLock: acquireLockMock,
  getLockStatus: getLockStatusMock,
  heartbeatLock: heartbeatLockMock,
  releaseLock: releaseLockMock,
  releaseLockWithKeepalive: vi.fn(),
}));

const ownLockStatus = {
  locked: true,
  serverTime: '2026-10-08T18:00:00.000Z',
  isOwnLock: true,
  lockId: 7,
  lockedBy: {
    userId: 1,
    username: 'Editor',
    acquiredAt: '2026-10-08T18:00:00.000Z',
    expiresAt: '2026-10-08T19:00:00.000Z',
    idleExpiresAt: '2026-10-08T18:30:00.000Z',
  },
};

const acquiredLock = {
  id: 7,
  entityType: 'activity',
  entityId: 139,
  userId: 1,
  username: 'Editor',
  acquiredAt: '2026-10-08T18:00:00.000Z',
  expiresAt: '2026-10-08T19:00:00.000Z',
  idleExpiresAt: '2026-10-08T18:30:00.000Z',
  serverTime: '2026-10-08T18:00:00.000Z',
};

describe('useActivityLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLockStatusMock.mockResolvedValue({
      locked: false,
      serverTime: ownLockStatus.serverTime,
    });
    acquireLockMock.mockResolvedValue(acquiredLock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([-60, 60])(
    'restores an owned lock using server time with %i minutes of client clock skew',
    async (skewMinutes) => {
      const serverNow = Date.parse(ownLockStatus.serverTime);
      const clientNow = serverNow + skewMinutes * 60_000;
      const dateNowMock = vi.spyOn(Date, 'now').mockReturnValue(clientNow);
      getLockStatusMock.mockResolvedValue(ownLockStatus);
      const { result } = renderHook(() => useActivityLock(139, 1));

      await waitFor(() => expect(result.current.lockState).toBe('owned'));

      expect(result.current.getServerNowMs()).toBe(serverNow);
      expect(result.current.wasLockIdleExpired()).toBe(false);

      dateNowMock.mockReturnValue(clientNow + 30 * 60_000);

      expect(result.current.getServerNowMs()).toBe(
        Date.parse(ownLockStatus.lockedBy.idleExpiresAt)
      );
      expect(result.current.wasLockIdleExpired()).toBe(true);
      expect(acquireLockMock).not.toHaveBeenCalled();
      expect(heartbeatLockMock).not.toHaveBeenCalled();
    }
  );

  it.each(['refreshLockFromServer', 'ensureLockForSubmit'] as const)(
    'updates the server clock on every %s status refresh',
    async (refreshMethod) => {
      const clientNow = Date.parse(ownLockStatus.serverTime) + 60 * 60_000;
      vi.spyOn(Date, 'now').mockReturnValue(clientNow);
      getLockStatusMock.mockResolvedValue(ownLockStatus);
      const { result } = renderHook(() => useActivityLock(139, 1));
      await waitFor(() => expect(result.current.lockState).toBe('owned'));

      const serverTime = ownLockStatus.lockedBy.idleExpiresAt;
      getLockStatusMock.mockResolvedValue({ ...ownLockStatus, serverTime });
      await act(async () => {
        await result.current[refreshMethod]();
      });

      expect(result.current.getServerNowMs()).toBe(Date.parse(serverTime));
      expect(result.current.wasLockIdleExpired()).toBe(true);

      const unlockedServerTime = '2026-10-08T18:31:00.000Z';
      getLockStatusMock.mockResolvedValue({
        locked: false,
        serverTime: unlockedServerTime,
      });
      await act(async () => {
        await result.current.refreshLockFromServer();
      });

      expect(result.current.lockState).toBe('idle');
      expect(result.current.getServerNowMs()).toBe(
        Date.parse(unlockedServerTime)
      );
    }
  );

  it('uses status server time when recovering an owned lock after acquisition conflict', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      Date.parse(ownLockStatus.serverTime) + 60 * 60_000
    );
    acquireLockMock.mockRejectedValueOnce(
      new ApiError({
        type: 'about:blank',
        title: 'Locked',
        status: 423,
        detail: 'Activity is already locked',
        instance: '/locks',
        correlationId: 'test',
      })
    );
    const { result } = renderHook(() => useActivityLock(139, 1));
    await waitFor(() => expect(result.current.lockState).toBe('idle'));
    const serverTime = '2026-10-08T18:01:00.000Z';
    getLockStatusMock.mockResolvedValue({ ...ownLockStatus, serverTime });

    await act(async () => {
      expect(await result.current.acquire()).toEqual({ ok: true });
    });

    expect(result.current.lockState).toBe('owned');
    expect(result.current.getServerNowMs()).toBe(Date.parse(serverTime));
    expect(result.current.wasLockIdleExpired()).toBe(false);
  });

  it('reports ready when the server confirms the current user owns the lock', async () => {
    getLockStatusMock.mockResolvedValue(ownLockStatus);
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() => expect(result.current.lockState).toBe('owned'));

    await expect(result.current.ensureLockForSubmit()).resolves.toBe('ready');
    expect(acquireLockMock).not.toHaveBeenCalled();
  });

  it('reports another user without attempting acquisition', async () => {
    getLockStatusMock.mockResolvedValue({
      ...ownLockStatus,
      isOwnLock: false,
      lockedBy: { ...ownLockStatus.lockedBy, userId: 2, username: 'Other' },
    });
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() =>
      expect(result.current.lockState).toBe('locked-by-other')
    );

    await expect(result.current.ensureLockForSubmit()).resolves.toBe(
      'blocked-by-other'
    );
    expect(acquireLockMock).not.toHaveBeenCalled();
  });

  it('reacquires an idle lock before submission', async () => {
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() => expect(result.current.lockState).toBe('idle'));

    let ensureResult: string | undefined;
    await act(async () => {
      ensureResult = await result.current.ensureLockForSubmit();
    });

    expect(ensureResult).toBe('ready');
    expect(acquireLockMock).toHaveBeenCalledWith(139);
    expect(result.current.lockState).toBe('owned');
  });

  it('uses the fresh server time, not the original acquisition time, for clock sync', async () => {
    const now = Date.now();
    acquireLockMock.mockResolvedValueOnce({
      ...acquiredLock,
      acquiredAt: new Date(now - 60 * 60 * 1000).toISOString(),
      idleExpiresAt: new Date(now - 60 * 1000).toISOString(),
      serverTime: new Date(now).toISOString(),
    });
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() => expect(result.current.lockState).toBe('idle'));

    await act(async () => {
      await result.current.acquire();
    });

    expect(result.current.wasLockIdleExpired()).toBe(true);
  });

  it('returns acquire failure reason on the acquire result without waiting for render', async () => {
    acquireLockMock.mockRejectedValue(new NetworkError('Network unavailable'));
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() => expect(result.current.lockState).toBe('idle'));

    let acquireResult: Awaited<
      ReturnType<typeof result.current.acquire>
    > | null = null;
    await act(async () => {
      acquireResult = await result.current.acquire();
    });

    expect(acquireResult).toEqual({
      ok: false,
      reason: 'network',
      lockedByUsername: null,
    });
  });

  it('preserves a network failure from the acquisition request', async () => {
    acquireLockMock.mockRejectedValue(new NetworkError('Network unavailable'));
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() => expect(result.current.lockState).toBe('idle'));

    let ensureResult: string | undefined;
    await act(async () => {
      ensureResult = await result.current.ensureLockForSubmit();
    });

    expect(ensureResult).toBe('unavailable');
  });

  it('preserves lock contention details from a normalized API error', async () => {
    acquireLockMock.mockRejectedValue(
      new ApiError({
        type: 'about:blank',
        title: 'Locked',
        status: 423,
        detail: 'Activity is locked by another user',
        instance: '/locks',
        correlationId: 'test',
        reason: 'locked_by_other',
      })
    );
    getLockStatusMock
      .mockResolvedValueOnce({ locked: false })
      .mockResolvedValueOnce({ locked: false })
      .mockResolvedValueOnce({
        ...ownLockStatus,
        isOwnLock: false,
        lockedBy: {
          ...ownLockStatus.lockedBy,
          userId: 2,
          username: 'Other',
        },
      });
    const { result } = renderHook(() => useActivityLock(139, 1));

    await waitFor(() => expect(result.current.lockState).toBe('idle'));

    let ensureResult: string | undefined;
    await act(async () => {
      ensureResult = await result.current.ensureLockForSubmit();
    });

    expect(ensureResult).toBe('blocked-by-other');
    expect(result.current.lockedByUsername).toBe('Other');
  });

  it('notifies when heartbeat confirms the server lock is gone', async () => {
    const onServerLockGone = vi.fn();
    getLockStatusMock.mockResolvedValue(ownLockStatus);
    heartbeatLockMock.mockRejectedValue(
      new ApiError({
        type: 'about:blank',
        title: 'Not found',
        status: 404,
        detail: 'Lock not found',
        instance: '/locks/heartbeat/7',
        correlationId: 'test',
      })
    );
    const { result } = renderHook(() =>
      useActivityLock(139, 1, { onServerLockGone })
    );
    await waitFor(() => expect(result.current.lockState).toBe('owned'));

    await act(async () => {
      await result.current.sendHeartbeat();
    });

    expect(onServerLockGone).toHaveBeenCalledTimes(1);
    expect(result.current.lockState).toBe('idle');
  });
});
