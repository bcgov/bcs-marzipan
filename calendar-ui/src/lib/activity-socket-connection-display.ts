/** User-facing connection state for the per-activity Socket.IO client. */
export type ActivitySocketConnectionDisplay =
  | 'connected'
  | 'reconnecting'
  | 'browser-offline'
  | 'disconnected';

export const ACTIVITY_SOCKET_DISCONNECTED_AFTER_MS = 3_000;

export type BlockedActivitySocketConnectionDisplay = Exclude<
  ActivitySocketConnectionDisplay,
  'connected'
>;

export function isActivitySocketConnectionBlocked(
  connection: ActivitySocketConnectionDisplay
): connection is BlockedActivitySocketConnectionDisplay {
  return connection !== 'connected';
}

export function resolveActivitySocketConnectionDisplay(input: {
  socketConnected: boolean;
  browserOnline: boolean;
  disconnectedLongEnough: boolean;
}): ActivitySocketConnectionDisplay {
  if (!input.browserOnline) {
    return 'browser-offline';
  }
  if (input.socketConnected) {
    return 'connected';
  }
  if (input.disconnectedLongEnough) {
    return 'disconnected';
  }
  return 'reconnecting';
}
