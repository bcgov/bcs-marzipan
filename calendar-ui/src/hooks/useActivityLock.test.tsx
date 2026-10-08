import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
};

describe('useActivityLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLockStatusMock.mockResolvedValue({ locked: false });
    acquireLockMock.mockResolvedValue(acquiredLock);
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
