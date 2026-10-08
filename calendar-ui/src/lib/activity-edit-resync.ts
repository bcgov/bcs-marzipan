import type { ActivityResponse } from '@corpcal/shared/schemas';

import { getActivityConcurrencyToken } from './activity-concurrency-token';

export type ServerLockState =
  | 'idle'
  | 'owned'
  | 'locked-by-other'
  | 'unavailable';

export type ActivityEditResyncAction =
  | 'continue-owned'
  | 'reacquire'
  | 'blocked-by-other'
  | 'server-changed'
  | 'retry';

type ResolveActivityEditResyncActionInput = {
  editSessionToken: string | null;
  latestActivity: ActivityResponse;
  serverLockState: ServerLockState;
};

/**
 * Determines the safe next step after edit-lock connectivity is restored.
 * Server changes always win over lock state so stale form data is never
 * submitted merely because this user still owns (or can reacquire) the lock.
 */
export function resolveActivityEditResyncAction({
  editSessionToken,
  latestActivity,
  serverLockState,
}: ResolveActivityEditResyncActionInput): ActivityEditResyncAction {
  if (getActivityConcurrencyToken(latestActivity) !== editSessionToken) {
    return 'server-changed';
  }

  if (serverLockState === 'unavailable') {
    return 'retry';
  }
  if (serverLockState === 'owned') {
    return 'continue-owned';
  }
  if (serverLockState === 'locked-by-other') {
    return 'blocked-by-other';
  }
  if (serverLockState === 'idle') {
    return 'reacquire';
  }

  return 'retry';
}
