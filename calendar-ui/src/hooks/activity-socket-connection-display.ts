/** User-facing connection state for the per-activity Socket.IO client. */
export type ActivitySocketConnectionDisplay =
  | 'connected'
  | 'reconnecting'
  | 'offline';

export const ACTIVITY_SOCKET_OFFLINE_AFTER_MS = 3_000;

export function resolveActivitySocketConnectionDisplay(input: {
  socketConnected: boolean;
  browserOnline: boolean;
  disconnectedLongEnough: boolean;
}): ActivitySocketConnectionDisplay {
  if (input.socketConnected) {
    return 'connected';
  }
  if (!input.browserOnline || input.disconnectedLongEnough) {
    return 'offline';
  }
  return 'reconnecting';
}
