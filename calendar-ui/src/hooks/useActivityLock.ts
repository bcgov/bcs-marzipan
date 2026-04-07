import type { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  acquireLock,
  getLockStatus,
  heartbeatLock,
  LOCKED_STATUS,
  releaseLock,
  releaseLockWithKeepalive,
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
  /** Re-fetch lock from server (e.g. after WebSocket lock transfer). */
  refreshLockFromServer: () => Promise<void>;
  /** Extend idle deadline (throttled server-side). */
  sendHeartbeat: () => Promise<void>;
  /** Update lock idle expiry from heartbeat response without full acquire. */
  mergeLockIdleExpiry: (idleExpiresAt: string) => void;
  /** Server released the lock (idle expiry, handoff, etc.); clear local hold. */
  applyExternalLockReleased: () => void;
  /** Update lock state from an external source (e.g. WebSocket). */
  setLockedByOther: (username: string | null) => void;
  clearLockedByOther: () => void;
};

function buildLockInfoFromStatus(
  activityId: number,
  userId: number,
  status: Awaited<ReturnType<typeof getLockStatus>>
): LockInfo | null {
  if (
    !status.locked ||
    !status.isOwnLock ||
    status.lockId == null ||
    !status.lockedBy
  ) {
    return null;
  }
  return {
    id: status.lockId,
    entityType: 'activity',
    entityId: activityId,
    userId,
    username: status.lockedBy.username,
    acquiredAt: status.lockedBy.acquiredAt,
    expiresAt: status.lockedBy.expiresAt,
    idleExpiresAt: status.lockedBy.idleExpiresAt,
  };
}

/**
 * Manages an activity edit lock with lazy acquisition.
 * On mount, checks lock status (does not acquire). Call `acquire()` on first
 * user edit intent. Concurrent acquire() calls share one in-flight request.
 * Releases on unmount if owned.
 */
export function useActivityLock(
  activityId: number,
  currentUserId: number | undefined
): UseActivityLockResult {
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
        } else if (
          status.locked &&
          status.isOwnLock &&
          currentUserId != null &&
          status.lockId != null &&
          status.lockedBy
        ) {
          const info = buildLockInfoFromStatus(
            activityId,
            currentUserId,
            status
          );
          if (info) {
            lockRef.current = info;
            setLock(info);
            setLockState('owned');
          } else {
            setLockState('idle');
          }
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
  }, [activityId, currentUserId]);

  const mergeLockIdleExpiry = useCallback((idleExpiresAt: string) => {
    const cur = lockRef.current;
    if (!cur) return;
    const next = { ...cur, idleExpiresAt };
    lockRef.current = next;
    setLock(next);
  }, []);

  const refreshLockFromServer = useCallback(async () => {
    if (currentUserId == null) return;
    try {
      const status = await getLockStatus(activityId);
      const info = buildLockInfoFromStatus(activityId, currentUserId, status);
      if (info) {
        lockRef.current = info;
        setLock(info);
        setLockState('owned');
        setLockedByUsername(null);
      }
    } catch {
      /* ignore */
    }
  }, [activityId, currentUserId]);

  const sendHeartbeat = useCallback(async () => {
    const currentLock = lockRef.current;
    if (currentLock == null) return;
    try {
      const res = await heartbeatLock(currentLock.id);
      mergeLockIdleExpiry(res.idleExpiresAt);
    } catch {
      /* ignore */
    }
  }, [mergeLockIdleExpiry]);

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
    const onPageHide = (ev: PageTransitionEvent): void => {
      if (ev.persisted) return;
      const held = lockRef.current;
      if (held == null) return;
      releaseLockWithKeepalive(held.id);
    };
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      const currentLock = lockRef.current;
      if (currentLock != null) {
        releaseLockWithKeepalive(currentLock.id);
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

  const applyExternalLockReleased = useCallback(() => {
    if (!lockRef.current) return;
    lockRef.current = null;
    setLock(null);
    setLockState('idle');
  }, []);

  return {
    lock,
    lockState,
    lockedByUsername,
    acquire,
    release,
    refreshLockFromServer,
    sendHeartbeat,
    mergeLockIdleExpiry,
    applyExternalLockReleased,
    setLockedByOther,
    clearLockedByOther,
  };
}
