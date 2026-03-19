import type { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  acquireLock,
  getLockStatus,
  LOCKED_STATUS,
  releaseLock,
  type LockInfo,
} from '../api/locksApi';

export type LockState =
  | 'idle'
  | 'checking'
  | 'acquiring'
  | 'owned'
  | 'locked-by-other';

type UseActivityLockResult = {
  lock: LockInfo | null;
  lockState: LockState;
  lockedByUsername: string | null;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  /** Update lock state from an external source (e.g. WebSocket). */
  setLockedByOther: (username: string | null) => void;
  clearLockedByOther: () => void;
};

/**
 * Manages an activity edit lock with lazy acquisition.
 * On mount, checks lock status (does not acquire). Call `acquire()` on first
 * user edit intent. Concurrent acquire() calls share one in-flight request.
 * Releases on unmount if owned.
 */
export function useActivityLock(activityId: number): UseActivityLockResult {
  const [lock, setLock] = useState<LockInfo | null>(null);
  const [lockState, setLockState] = useState<LockState>('checking');
  const [lockedByUsername, setLockedByUsername] = useState<string | null>(null);
  const lockRef = useRef<LockInfo | null>(null);
  const acquireInFlightRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLockState('checking');
    setLock(null);
    setLockedByUsername(null);
    lockRef.current = null;

    getLockStatus(activityId)
      .then((status) => {
        if (cancelled) return;
        if (status.locked && !status.isOwnLock && status.lockedBy) {
          setLockState('locked-by-other');
          setLockedByUsername(status.lockedBy.username);
        } else {
          setLockState('idle');
        }
      })
      .catch(() => {
        if (!cancelled) setLockState('idle');
      });

    return () => {
      cancelled = true;
    };
  }, [activityId]);

  const acquire = useCallback(async (): Promise<boolean> => {
    if (lockRef.current) return true;
    const existing = acquireInFlightRef.current;
    if (existing) {
      return existing;
    }

    const promise = (async (): Promise<boolean> => {
      setLockState('acquiring');
      try {
        const acquired = await acquireLock(activityId);
        lockRef.current = acquired;
        setLock(acquired);
        setLockState('owned');
        setLockedByUsername(null);
        return true;
      } catch (err) {
        const axiosError = err as AxiosError<{
          lockedBy?: { username: string };
        }>;
        if (axiosError.response?.status === LOCKED_STATUS) {
          const data = axiosError.response?.data as
            | { lockedBy?: { userId?: number; username: string } }
            | undefined;
          setLockedByUsername(data?.lockedBy?.username ?? null);
          setLockState('locked-by-other');
          return false;
        }
        setLockState('idle');
        return false;
      } finally {
        acquireInFlightRef.current = null;
      }
    })();

    acquireInFlightRef.current = promise;
    return promise;
  }, [activityId]);

  const release = useCallback(async (): Promise<void> => {
    const currentLock = lockRef.current;
    if (currentLock == null) return;
    lockRef.current = null;
    setLock(null);
    setLockState('idle');
    try {
      await releaseLock(currentLock.id);
    } catch {
      // Best-effort release; server TTL handles cleanup
    }
  }, []);

  useEffect(() => {
    return () => {
      const currentLock = lockRef.current;
      if (currentLock != null) {
        void releaseLock(currentLock.id);
        lockRef.current = null;
      }
    };
  }, [activityId]);

  const setLockedByOther = useCallback((username: string | null) => {
    if (lockRef.current) return;
    setLockState('locked-by-other');
    setLockedByUsername(username);
  }, []);

  const clearLockedByOther = useCallback(() => {
    setLockState((prev) => (prev === 'locked-by-other' ? 'idle' : prev));
    setLockedByUsername(null);
  }, []);

  return {
    lock,
    lockState,
    lockedByUsername,
    acquire,
    release,
    setLockedByOther,
    clearLockedByOther,
  };
}
