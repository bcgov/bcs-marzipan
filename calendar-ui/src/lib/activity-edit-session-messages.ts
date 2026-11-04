/**
 * Activity edit session — user-facing copy (connection, recovery, confirm modals).
 *
 * Single source of truth for activity edit/review/complete/delete blocking messages.
 * Use with socket connection display and {@link ActivityEditRecoveryState}.
 */

import type { LockAcquireFailureReason } from '../hooks/useActivityLock';
import type { ActivityEditResyncAction } from './activity-edit-resync';
import {
  isActivitySocketConnectionBlocked,
  type ActivitySocketConnectionDisplay,
} from './activity-socket-connection-display';

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
  | 'idle-expired'
  | null;

export type ActivityEditConfirmAction =
  | 'save'
  | 'review'
  | 'complete'
  | 'delete'
  | 'request-delete'
  | 'clone'
  | 'note';

export type ActivityConfirmBlockedNotice = {
  message: string;
  variant: 'recovery' | 'connection';
};

/** Top-of-screen connection alert when an edit session is already active */
export const ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT =
  'You are offline. Reconnect to save changes.';

/** Top-of-screen connection alert before the user has started editing */
export const ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT_BEFORE_EDIT =
  'You are offline. Reconnect to make changes.';

export const ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT =
  'Connection lost. Trying to reconnect.';

/** Same copy as {@link ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT}. */
export const ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT_BEFORE_EDIT =
  ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT;

export const ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT = 'Reconnecting...';

export function getActivityConnectionOfflineAlertMessage(
  isActiveEditSession: boolean
): string {
  return isActiveEditSession
    ? ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT
    : ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT_BEFORE_EDIT;
}

export function getActivityConnectionDisconnectedAlertMessage(
  isActiveEditSession: boolean
): string {
  return isActiveEditSession
    ? ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT
    : ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT_BEFORE_EDIT;
}

export function getActivityConnectionBlockedAlertMessage(
  socketConnection: Exclude<ActivitySocketConnectionDisplay, 'connected'>,
  isActiveEditSession: boolean
): string {
  switch (socketConnection) {
    case 'browser-offline':
      return getActivityConnectionOfflineAlertMessage(isActiveEditSession);
    case 'disconnected':
      return getActivityConnectionDisconnectedAlertMessage(isActiveEditSession);
    case 'reconnecting':
      return ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT;
  }
}

export const ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT = 'Connection restored';

export const ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT =
  'Restoring your session…';

export const ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE =
  ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT;

export type ActivityEditAcquireFailureToastVariant = 'warning' | 'error';

export function getActivityEditAcquireFailureToastVariant(
  reason: LockAcquireFailureReason
): ActivityEditAcquireFailureToastVariant | null {
  if (reason == null) {
    return null;
  }
  if (
    reason === 'time-lockout' ||
    reason === 'locked-by-other' ||
    reason === 'network'
  ) {
    return 'warning';
  }
  return 'error';
}

const SUBMIT_BLOCKED_TOAST_TITLE_BY_ACTION: Record<
  Extract<ActivityEditConfirmAction, 'save' | 'review' | 'complete'>,
  string
> = {
  save: 'Unable to save',
  review: 'Unable to review',
  complete: 'Unable to complete',
};

export function getActivitySubmitBlockedToastTitle(
  action: Extract<ActivityEditConfirmAction, 'save' | 'review' | 'complete'>
): string {
  return SUBMIT_BLOCKED_TOAST_TITLE_BY_ACTION[action];
}

export const ACTIVITY_EDIT_RECOVERY_SERVER_CHANGED_BANNER =
  'This activity has been updated elsewhere. Your changes cannot be saved.';

export const ACTIVITY_EDIT_RECOVERY_FAILED_BANNER =
  'Your session could not be restored. Your changes are unsaved; check your connection and try again.';

export const ACTIVITY_EDIT_SESSION_RESTORE_FAILED_MESSAGE =
  'Your session cannot be restored. Please check your connection.';

export const ACTIVITY_EDIT_RECOVERY_IDLE_EXPIRED_BANNER =
  'Your edit session ended due to inactivity. Unsaved changes are kept; resume editing to save them.';

export const ACTIVITY_EDIT_IDLE_EXPIRED_BLOCKED_MESSAGE =
  'Your edit session ended due to inactivity. Resume editing to continue.';

export const ACTIVITY_EDIT_ACQUIRE_FAILURE_NETWORK =
  'Unable to start editing. Check your connection and try again.';

export const ACTIVITY_EDIT_ACQUIRE_FAILURE_UNAUTHORIZED =
  'You cannot edit this activity. Sign in and try again.';

export const ACTIVITY_EDIT_ACQUIRE_FAILURE_REQUEST =
  'Unable to start editing. Try again.';

const OFFLINE_BY_ACTION: Record<ActivityEditConfirmAction, string> = {
  save: 'You are offline. Reconnect to save changes.',
  review: 'You are offline. Reconnect to review this activity.',
  complete: 'You are offline. Reconnect to complete this activity.',
  delete: 'You are offline. Reconnect to continue.',
  'request-delete': 'You are offline. Reconnect to continue.',
  clone: 'You are offline. Reconnect to clone this activity.',
  note: 'You are offline. Reconnect to add a note.',
};

const DISCONNECTED_BY_ACTION: Record<ActivityEditConfirmAction, string> = {
  save: ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  review: ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  complete: ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  delete: ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  'request-delete': ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  clone: ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
  note: ACTIVITY_EDIT_CONNECTION_DISCONNECTED_ALERT,
};

const SERVER_CHANGED_BY_ACTION: Record<ActivityEditConfirmAction, string> = {
  save: 'This activity has been updated elsewhere and cannot be saved.',
  review: 'This activity has been updated elsewhere and cannot be reviewed.',
  complete: 'This activity has been updated elsewhere and cannot be completed.',
  delete: 'This activity has been updated elsewhere and cannot be deleted.',
  'request-delete':
    'This activity has been updated elsewhere and your delete request cannot be submitted.',
  clone: 'This activity has been updated elsewhere and cannot be cloned.',
  note: 'This activity has been updated elsewhere and a note cannot be added.',
};

export function getActivityEditOfflineBlockedMessage(
  action: ActivityEditConfirmAction
): string {
  return OFFLINE_BY_ACTION[action];
}

export function getActivityEditDisconnectedBlockedMessage(
  action: ActivityEditConfirmAction
): string {
  return DISCONNECTED_BY_ACTION[action];
}

export function getActivityEditServerChangedBlockedMessage(
  action: ActivityEditConfirmAction
): string {
  return SERVER_CHANGED_BY_ACTION[action];
}

/** Raw socket gate (also used for blocking edit-session start and clone). */
export function connectionBlocksFieldInput(
  socketConnection: ActivitySocketConnectionDisplay
): boolean {
  return isActivitySocketConnectionBlocked(socketConnection);
}

/** Block field input when disconnected only before an edit session has started. */
export function connectionBlocksFieldInputUnlessActiveSession(
  socketConnection: ActivitySocketConnectionDisplay,
  isActiveEditSession: boolean
): boolean {
  return (
    isActivitySocketConnectionBlocked(socketConnection) && !isActiveEditSession
  );
}

export type ShouldShowActivityConnectionAlertInput = {
  mayEditFormFields: boolean;
  socketConnection: ActivitySocketConnectionDisplay;
  isLockedByOther: boolean;
  isBlockedByRecurringLockout: boolean;
};

export function shouldShowActivityConnectionAlert(
  input: ShouldShowActivityConnectionAlertInput
): boolean {
  return (
    input.mayEditFormFields &&
    isActivitySocketConnectionBlocked(input.socketConnection) &&
    !input.isLockedByOther &&
    !input.isBlockedByRecurringLockout
  );
}

export function shouldSuppressAcquireConnectionToast(
  reason: LockAcquireFailureReason | null,
  socketConnection: ActivitySocketConnectionDisplay
): boolean {
  return (
    reason === 'network' && isActivitySocketConnectionBlocked(socketConnection)
  );
}

export function getActivityEditRecoveryBannerMessage(
  editRecoveryState: ActivityEditRecoveryState
): string | null {
  if (editRecoveryState === 'server-changed') {
    return ACTIVITY_EDIT_RECOVERY_SERVER_CHANGED_BANNER;
  }
  if (editRecoveryState === 'idle-expired') {
    return ACTIVITY_EDIT_RECOVERY_IDLE_EXPIRED_BANNER;
  }
  if (editRecoveryState != null && editRecoveryState !== 'resyncing') {
    return ACTIVITY_EDIT_RECOVERY_FAILED_BANNER;
  }
  return null;
}

export function getActivityConfirmConnectionFooterMessage(
  action: ActivityEditConfirmAction,
  socketConnection: ActivitySocketConnectionDisplay
): string | null {
  if (socketConnection === 'browser-offline') {
    return getActivityEditOfflineBlockedMessage(action);
  }
  if (socketConnection === 'disconnected') {
    return getActivityEditDisconnectedBlockedMessage(action);
  }
  if (socketConnection === 'reconnecting') {
    return ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT;
  }
  return null;
}

export function getActivityConfirmBlockedMessage(
  action: ActivityEditConfirmAction,
  socketConnection: ActivitySocketConnectionDisplay,
  editRecoveryState: ActivityEditRecoveryState
): string | null {
  const connectionFooterMessage = getActivityConfirmConnectionFooterMessage(
    action,
    socketConnection
  );
  if (connectionFooterMessage != null) {
    return connectionFooterMessage;
  }
  if (editRecoveryState === 'resyncing') {
    return ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE;
  }
  if (editRecoveryState === 'server-changed') {
    return getActivityEditServerChangedBlockedMessage(action);
  }
  if (editRecoveryState === 'idle-expired') {
    return ACTIVITY_EDIT_IDLE_EXPIRED_BLOCKED_MESSAGE;
  }
  if (editRecoveryState != null) {
    return ACTIVITY_EDIT_SESSION_RESTORE_FAILED_MESSAGE;
  }
  return null;
}

export function getActivityConfirmBlockedNotice(
  action: ActivityEditConfirmAction,
  socketConnection: ActivitySocketConnectionDisplay,
  editRecoveryState: ActivityEditRecoveryState
): ActivityConfirmBlockedNotice | null {
  const connectionMessage = getActivityConfirmConnectionFooterMessage(
    action,
    socketConnection
  );
  if (connectionMessage != null) {
    return { message: connectionMessage, variant: 'connection' };
  }
  const recoveryMessage = getActivityConfirmBlockedMessage(
    action,
    socketConnection,
    editRecoveryState
  );
  if (recoveryMessage != null) {
    return { message: recoveryMessage, variant: 'recovery' };
  }
  return null;
}

export function isActivityConfirmBlocked(
  notice: ActivityConfirmBlockedNotice | null | undefined
): boolean {
  return notice != null;
}

/** Shared gate for save/review/complete/delete/clone/note — connection + recovery only. */
export function isEditSessionConfirmGateClosed(
  socketConnection: ActivitySocketConnectionDisplay,
  editRecoveryState: ActivityEditRecoveryState
): boolean {
  return (
    isActivitySocketConnectionBlocked(socketConnection) ||
    editRecoveryState !== null
  );
}

export function isActivityEditSessionActionsBlocked(
  socketConnection: ActivitySocketConnectionDisplay,
  editRecoveryState: ActivityEditRecoveryState
): boolean {
  return isEditSessionConfirmGateClosed(socketConnection, editRecoveryState);
}

/** Warn on tab close / full reload only when unsaved edits could still be saved. */
export function shouldWarnActivityEditBeforeUnload(input: {
  isDirty: boolean;
  isActiveEditSession: boolean;
  socketConnection: ActivitySocketConnectionDisplay;
  editRecoveryState: ActivityEditRecoveryState;
}): boolean {
  if (!input.isDirty) {
    return false;
  }

  if (input.editRecoveryState === 'idle-expired') {
    return true;
  }

  return (
    input.isActiveEditSession &&
    input.socketConnection === 'connected' &&
    !isActivityEditSessionActionsBlocked(
      input.socketConnection,
      input.editRecoveryState
    )
  );
}

export function getActivityEditAcquireFailureToastMessage(
  reason: LockAcquireFailureReason,
  lockedByUsername: string | null,
  editLockConflictFallback: string
): string {
  if (reason === 'time-lockout') {
    return '';
  }
  if (reason === 'locked-by-other') {
    return lockedByUsername
      ? `Cannot edit. ${lockedByUsername} has started editing this activity.`
      : editLockConflictFallback;
  }
  if (reason === 'network') {
    return ACTIVITY_EDIT_ACQUIRE_FAILURE_NETWORK;
  }
  if (reason === 'unauthorized') {
    return ACTIVITY_EDIT_ACQUIRE_FAILURE_UNAUTHORIZED;
  }
  if (reason === 'request-failed') {
    return ACTIVITY_EDIT_ACQUIRE_FAILURE_REQUEST;
  }
  return ACTIVITY_EDIT_ACQUIRE_FAILURE_REQUEST;
}
