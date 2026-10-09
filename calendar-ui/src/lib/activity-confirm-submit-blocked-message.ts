/**
 * @deprecated Import from `@/lib/activity-edit-session-messages` instead.
 * Re-exports preserved for existing import paths.
 */

export {
  type ActivityEditRecoveryState,
  ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT as ACTIVITY_CONFIRM_OFFLINE_TOOLTIP,
  ACTIVITY_EDIT_RECONNECTING_MODAL_MESSAGE as ACTIVITY_CONFIRM_RECONNECTING_BLOCKED_MESSAGE,
  ACTIVITY_EDIT_RESYNCING_MODAL_MESSAGE as ACTIVITY_CONFIRM_RESYNCING_BLOCKED_MESSAGE,
  getActivityEditOfflineBlockedMessage,
  getActivityEditServerChangedBlockedMessage,
  getActivityConfirmBlockedMessage as getActivityConfirmSubmitBlockedMessage,
} from './activity-edit-session-messages';

/** @deprecated Use getActivityEditOfflineBlockedMessage('save') */
export const ACTIVITY_CONFIRM_OFFLINE_BLOCKED_MESSAGE =
  'You are offline. Reconnect to save changes.';

/** @deprecated Use getActivityEditServerChangedBlockedMessage('save') */
export const ACTIVITY_CONFIRM_SERVER_CHANGED_BLOCKED_MESSAGE =
  'This activity has been updated elsewhere and cannot be saved.';

/** @deprecated Use ACTIVITY_EDIT_SESSION_RESTORE_FAILED_MESSAGE */
export const ACTIVITY_CONFIRM_LOCK_VERIFY_BLOCKED_MESSAGE =
  'Your session cannot be restored. Please check your connection.';
