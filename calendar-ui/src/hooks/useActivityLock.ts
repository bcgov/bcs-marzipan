import type { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';

import {
  acquireLock,
  LOCKED_STATUS,
  releaseLock,
  type LockInfo,
} from '../api/locksApi';

type UseActivityLockResult = {
  lock: LockInfo | null;
  isOwnLock: boolean;
  lockedByOther: boolean;
  lockedByUsername: string | null;
  isLoading: boolean;
  error: string | null;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
};

/**
 * Hook to acquire, hold, and release an activity edit lock.
 * On mount (or when activityId changes), call acquire(); if 423, form is read-only.
 * Release on unmount, cancel, or save.
 */
export function useActivityLock(
  activityId: number | null
): UseActivityLockResult {
  const [lock, setLock] = useState<LockInfo | null>(null);
  const [lockedByOther, setLockedByOther] = useState(false);
  const [lockedByUsername, setLockedByUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acquire = useCallback(async (): Promise<boolean> => {
    if (activityId == null) return false;
    setIsLoading(true);
    setError(null);
    setLockedByOther(false);
    setLockedByUsername(null);
    setLock(null);
    try {
      const acquired = await acquireLock(activityId);
      setLock(acquired);
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ lockedBy?: { username: string } }>;
      if (axiosError.response?.status === LOCKED_STATUS) {
        setLockedByOther(true);
        const data = axiosError.response?.data as
          | { lockedBy?: { username: string } }
          | undefined;
        setLockedByUsername(data?.lockedBy?.username ?? null);
        return false;
      }
      setError(
        axiosError instanceof Error
          ? axiosError.message
          : 'Failed to acquire lock'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  const release = useCallback(async (): Promise<void> => {
    if (lock?.id == null) return;
    try {
      await releaseLock(lock.id);
    } finally {
      setLock(null);
    }
  }, [lock?.id]);

  useEffect(() => {
    if (activityId == null) {
      setIsLoading(false);
      return;
    }
    void acquire();
  }, [activityId]); // eslint-disable-line react-hooks/exhaustive-deps -- acquire on activityId change only

  useEffect(() => {
    return () => {
      if (lock?.id != null) {
        void releaseLock(lock.id);
      }
    };
  }, [lock?.id]);

  const isOwnLock = lock != null && !lockedByOther;

  return {
    lock,
    isOwnLock,
    lockedByOther,
    lockedByUsername,
    isLoading,
    error,
    acquire,
    release,
  };
}
