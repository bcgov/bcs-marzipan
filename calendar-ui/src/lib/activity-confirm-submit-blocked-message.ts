import type { ActivitySocketConnectionDisplay } from '../hooks/activity-socket-connection-display';

type EditRecoveryState =
  | 'server-changed'
  | 'retry'
  | 'lock-required'
  | 'time-lockout'
  | 'unauthorized'
  | 'server-error'
  | 'unavailable'
  | 'resyncing'
  | null;

export function getActivityConfirmSubmitBlockedMessage(
  socketConnection: ActivitySocketConnectionDisplay,
  editRecoveryState: EditRecoveryState
): string | null {
  if (socketConnection !== 'connected') {
    return socketConnection === 'offline'
      ? 'You are offline. Reconnect before saving.'
      : 'Reconnecting to the server. You cannot save until the connection is restored.';
  }
  if (editRecoveryState === 'server-changed') {
    return 'This activity changed on the server. Discard and reload the latest version before saving.';
  }
  if (editRecoveryState != null) {
    return 'The edit lock could not be verified. Retry after the connection is restored.';
  }
  return null;
}
