import { createLogger } from '../lib/logger';
import api from './axios';

const logger = createLogger('LocksAPI');

export type LockInfo = {
  id: number;
  entityType: string;
  entityId: number;
  userId: number;
  username: string;
  acquiredAt: string;
  expiresAt: string;
};

export type LockStatusResponse = {
  locked: boolean;
  isOwnLock?: boolean;
  lockId?: number;
  lockedBy?: {
    userId: number;
    username: string;
    acquiredAt: string;
    expiresAt: string;
  };
};

export type AcquireLockResponse = LockInfo;

/** 423 Locked - activity is being edited by another user */
export const LOCKED_STATUS = 423;

/**
 * Try to acquire a lock on an activity. Returns lock info on success.
 * Throws with response.status === 423 when already locked by another user.
 */
export async function acquireLock(
  activityId: number,
  lockSessionId?: string
): Promise<AcquireLockResponse> {
  const res = await api.post<AcquireLockResponse>('/locks', {
    entityType: 'activity',
    entityId: activityId,
    lockSessionId,
  });
  return res.data;
}

export async function getLockStatus(
  activityId: number
): Promise<LockStatusResponse> {
  const res = await api.get<LockStatusResponse>(
    `/locks/activity/${activityId}`
  );
  return res.data;
}

export async function releaseLock(lockId: number): Promise<void> {
  try {
    await api.delete(`/locks/${lockId}`);
  } catch (error) {
    logger.warn('Release lock failed', error);
    throw error;
  }
}
