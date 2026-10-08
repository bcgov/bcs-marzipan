import type { ActivitySocketConnectionDisplay } from '../hooks/activity-socket-connection-display';
import type { ActivityEditResyncAction } from './activity-edit-resync';

export type ActivityEditRecoveryState =
  | Exclude<
      ActivityEditResyncAction,
      'continue-owned' | 'reacquire' | 'blocked-by-other'
    >
  | 'lock-required'
  | 'time-lockout'
  | 'unauthorized'
  | 'server-error'
  | 'unavailable'
  | 'resyncing'
  | null;

export const ACTIVITY_CONFIRM_OFFLINE_BLOCKED_MESSAGE =
  'You are offline. Reconnect before saving.';

export const ACTIVITY_CONFIRM_RECONNECTING_BLOCKED_MESSAGE =
  'Reconnecting to the server. You cannot save until the connection is restored.';

export const ACTIVITY_CONFIRM_SERVER_CHANGED_BLOCKED_MESSAGE =
  'This activity changed on the server. Discard and reload the latest version before saving.';

export const ACTIVITY_CONFIRM_RESYNCING_BLOCKED_MESSAGE =
  'Restoring your edit lock. Wait before saving.';

export const ACTIVITY_CONFIRM_LOCK_VERIFY_BLOCKED_MESSAGE =
  'The edit lock could not be verified. Retry after the connection is restored.';

export function isActivityConfirmConnectionBlockedMessage(
  message: string | null | undefined
): boolean {
  if (message == null || message.length === 0) {
    return false;
  }
  return (
    message === ACTIVITY_CONFIRM_OFFLINE_BLOCKED_MESSAGE ||
    message === ACTIVITY_CONFIRM_RECONNECTING_BLOCKED_MESSAGE
  );
}

export function getActivityConfirmSubmitBlockedMessage(
  socketConnection: ActivitySocketConnectionDisplay,
  editRecoveryState: ActivityEditRecoveryState
): string | null {
  if (socketConnection !== 'connected') {
    return socketConnection === 'offline'
      ? ACTIVITY_CONFIRM_OFFLINE_BLOCKED_MESSAGE
      : ACTIVITY_CONFIRM_RECONNECTING_BLOCKED_MESSAGE;
  }
  if (editRecoveryState === 'resyncing') {
    return ACTIVITY_CONFIRM_RESYNCING_BLOCKED_MESSAGE;
  }
  if (editRecoveryState === 'server-changed') {
    return ACTIVITY_CONFIRM_SERVER_CHANGED_BLOCKED_MESSAGE;
  }
  if (editRecoveryState != null) {
    return ACTIVITY_CONFIRM_LOCK_VERIFY_BLOCKED_MESSAGE;
  }
  return null;
}
