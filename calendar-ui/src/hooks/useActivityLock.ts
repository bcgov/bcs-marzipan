import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, createApiError, NetworkError } from '../api/errors';
import {
  acquireLock,
  getLockStatus,
  heartbeatLock,
  LOCKED_STATUS,
  releaseLock,
  releaseLockWithKeepalive,
  type LockInfo,
} from '../api/locksApi';
import {
  getRecurringEditLockoutDetailFallback,
  isRecurringEditLockoutError,
} from '../lib/recurring-edit-lockout-error';
import { releaseLockWithRetry as releaseLockApiWithRetry } from '../lib/release-lock-with-retry';

export type LockState =
  | 'idle'
  | 'checking'
  | 'acquiring'
  | 'owned'
  | 'locked-by-other';

type SettledLockState = Extract<
  LockState,
  'idle' | 'owned' | 'locked-by-other'
>;

export type LockRefreshResult = SettledLockState | 'unavailable';

export type EnsureLockForSubmitResult =
  | 'ready'
  | 'blocked-by-other'
  | 'time-lockout'
  | 'lock-required'
  | 'unavailable'
  | 'unauthorized'
  | 'server-error';

type LockAcquireResult = EnsureLockForSubmitResult;

export type LockAcquireFailureReason =
  | 'locked-by-other'
  | 'time-lockout'
  | 'other'
  | null;

type UseActivityLockResult = {
  lock: LockInfo | null;
  lockState: LockState;
  lockedByUsername: string | null;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  /** Best-effort release with short retries before clearing local hold. */
  releaseWithRetry: () => Promise<void>;
  /** Re-fetch lock from server (e.g. after WebSocket lock transfer). */
  refreshLockFromServer: () => Promise<LockRefreshResult>;
  /** Verify server lock before PATCH; clears stale local hold and re-acquires if needed. */
  ensureLockForSubmit: () => Promise<EnsureLockForSubmitResult>;
  /** Extend idle deadline (throttled server-side). */
  sendHeartbeat: () => Promise<void>;
  /** Update lock idle expiry from heartbeat response without full acquire. */
  mergeLockIdleExpiry: (idleExpiresAt: string) => void;
  /** Server released the lock (idle expiry, handoff, etc.); clear local hold. */
  applyExternalLockReleased: () => void;
  /** Update lock state from an external source (e.g. WebSocket). */
  setLockedByOther: (username: string | null) => void;
  clearLockedByOther: () => void;
  acquireFailureReason: LockAcquireFailureReason;
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

function clearHeldLockOptimistically(
  lockRef: { current: LockInfo | null },
  setLock: (lock: LockInfo | null) => void,
  setLockState: (state: LockState) => void
): number | null {
  const currentLock = lockRef.current;
  if (currentLock == null) return null;
  const lockId = currentLock.id;
  lockRef.current = null;
  setLock(null);
  setLockState('idle');
  return lockId;
}

function classifyLockRequestFailure(
  error: unknown
): Exclude<
  EnsureLockForSubmitResult,
  'ready' | 'blocked-by-other' | 'time-lockout'
> {
  const apiError = createApiError(error);
  if (apiError instanceof NetworkError) {
    return 'unavailable';
  }
  if (apiError.status === 401 || apiError.status === 403) {
    return 'unauthorized';
  }
  if (apiError.status >= 500) {
    return 'server-error';
  }
  return 'lock-required';
}

/**
 * Manages an activity edit lock with lazy acquisition.
 * On mount, checks lock status (does not acquire). Call `acquire()` on first
 * user edit intent. Concurrent acquire() calls share one in-flight request.
 * Releases on unmount if owned.
 */
type UseActivityLockOptions = {
  /** Heartbeat 404/410 — server row gone while client still thought it held the lock. */
  onServerLockGone?: () => void;
};

export function useActivityLock(
  activityId: number,
  currentUserId: number | undefined,
  options: UseActivityLockOptions = {}
): UseActivityLockResult {
  const onServerLockGoneRef = useRef(options.onServerLockGone);
  onServerLockGoneRef.current = options.onServerLockGone;
  const [lock, setLock] = useState<LockInfo | null>(null);
  const [lockState, setLockState] = useState<LockState>('checking');
  const [lockedByUsername, setLockedByUsername] = useState<string | null>(null);
  const [acquireFailureReason, setAcquireFailureReason] =
    useState<LockAcquireFailureReason>(null);
  const lockRef = useRef<LockInfo | null>(null);
  const acquireInFlightRef = useRef<Promise<LockAcquireResult> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLockState('checking');
    setLock(null);
    setLockedByUsername(null);
    setAcquireFailureReason(null);
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

  const applyServerLockStatus = useCallback(
    (status: Awaited<ReturnType<typeof getLockStatus>>): SettledLockState => {
      const info =
        currentUserId != null
          ? buildLockInfoFromStatus(activityId, currentUserId, status)
          : null;
      if (info) {
        lockRef.current = info;
        setLock(info);
        setLockState('owned');
        setLockedByUsername(null);
        return 'owned';
      }
      lockRef.current = null;
      setLock(null);
      if (status.locked && !status.isOwnLock && status.lockedBy) {
        setLockState('locked-by-other');
        setLockedByUsername(status.lockedBy.username);
        return 'locked-by-other';
      }
      setLockState('idle');
      setLockedByUsername(null);
      return 'idle';
    },
    [activityId, currentUserId]
  );

  const refreshLockFromServer =
    useCallback(async (): Promise<LockRefreshResult> => {
      if (currentUserId == null) return 'idle';
      try {
        const status = await getLockStatus(activityId);
        return applyServerLockStatus(status);
      } catch {
        return 'unavailable';
      }
    }, [activityId, currentUserId, applyServerLockStatus]);

  const sendHeartbeat = useCallback(async () => {
    const currentLock = lockRef.current;
    if (currentLock == null) return;
    try {
      const res = await heartbeatLock(currentLock.id);
      mergeLockIdleExpiry(res.idleExpiresAt);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 410 || status === 404) {
        onServerLockGoneRef.current?.();
        lockRef.current = null;
        setLock(null);
        setLockState('idle');
        setLockedByUsername(null);
        return;
      }
    }
  }, [mergeLockIdleExpiry]);

  const acquireDetailed = useCallback(async (): Promise<LockAcquireResult> => {
    if (lockRef.current) return 'ready';
    const existing = acquireInFlightRef.current;
    if (existing) {
      return existing;
    }

    const promise = (async (): Promise<LockAcquireResult> => {
      setLockState('acquiring');
      setAcquireFailureReason(null);
      try {
        const acquired = await acquireLock(activityId);
        lockRef.current = acquired;
        setLock(acquired);
        setLockState('owned');
        setLockedByUsername(null);
        setAcquireFailureReason(null);
        return 'ready';
      } catch (err) {
        const apiError = createApiError(err);
        const status =
          apiError instanceof ApiError ? apiError.status : undefined;
        const detail =
          apiError instanceof ApiError ? apiError.detail : undefined;
        const reason =
          apiError instanceof ApiError ? apiError.reason : undefined;

        if (reason === 'locked_by_other' || status === LOCKED_STATUS) {
          try {
            const statusRes = await getLockStatus(activityId);
            if (statusRes.locked && !statusRes.isOwnLock) {
              setLockedByUsername(statusRes.lockedBy?.username ?? null);
              setLockState('locked-by-other');
              setAcquireFailureReason('locked-by-other');
              return 'blocked-by-other';
            } else if (
              statusRes.locked &&
              statusRes.isOwnLock &&
              currentUserId != null
            ) {
              const info = buildLockInfoFromStatus(
                activityId,
                currentUserId,
                statusRes
              );
              if (info) {
                lockRef.current = info;
                setLock(info);
                setLockState('owned');
                setLockedByUsername(null);
                setAcquireFailureReason(null);
                return 'ready';
              }
              setLockedByUsername(null);
              setLockState('idle');
              setAcquireFailureReason(null);
              return 'lock-required';
            } else {
              setLockedByUsername(null);
              setLockState('idle');
              setAcquireFailureReason(null);
              return 'lock-required';
            }
          } catch {
            setLockedByUsername(null);
            setLockState('locked-by-other');
            setAcquireFailureReason('locked-by-other');
            return 'blocked-by-other';
          }
        }

        if (
          isRecurringEditLockoutError(err) ||
          reason === 'time_lockout' ||
          (status === 403 && getRecurringEditLockoutDetailFallback(detail))
        ) {
          setLockedByUsername(null);
          setLockState('idle');
          setAcquireFailureReason('time-lockout');
          return 'time-lockout';
        }

        setLockState('idle');
        setAcquireFailureReason('other');
        return classifyLockRequestFailure(err);
      } finally {
        acquireInFlightRef.current = null;
      }
    })();

    acquireInFlightRef.current = promise;
    return promise;
  }, [activityId, currentUserId]);

  const acquire = useCallback(
    async (): Promise<boolean> => (await acquireDetailed()) === 'ready',
    [acquireDetailed]
  );

  const ensureLockForSubmit =
    useCallback(async (): Promise<EnsureLockForSubmitResult> => {
      if (currentUserId == null) return 'lock-required';
      try {
        const status = await getLockStatus(activityId);
        const next = applyServerLockStatus(status);
        if (next === 'owned') return 'ready';
        if (next === 'locked-by-other') return 'blocked-by-other';
        return acquireDetailed();
      } catch (err) {
        if (isRecurringEditLockoutError(err)) {
          return 'time-lockout';
        }
        return classifyLockRequestFailure(err);
      }
    }, [activityId, currentUserId, applyServerLockStatus, acquireDetailed]);

  const release = useCallback(async (): Promise<void> => {
    const lockId = clearHeldLockOptimistically(lockRef, setLock, setLockState);
    if (lockId == null) return;
    try {
      await releaseLock(lockId);
    } catch {
      // Best-effort release; server TTL handles cleanup
    }
  }, []);

  const releaseWithRetry = useCallback(async (): Promise<void> => {
    const lockId = clearHeldLockOptimistically(lockRef, setLock, setLockState);
    if (lockId == null) return;
    await releaseLockApiWithRetry(releaseLock, lockId);
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
    releaseWithRetry,
    refreshLockFromServer,
    ensureLockForSubmit,
    sendHeartbeat,
    mergeLockIdleExpiry,
    applyExternalLockReleased,
    setLockedByOther,
    clearLockedByOther,
    acquireFailureReason,
  };
}
