import type { LockState } from './useActivityLock';

export type ActivityEditActionFlags = {
  /** Another user holds the edit lock. */
  isLockedByOther: boolean;
  /** Edit actions are blocked by another user's lock or recurring lockout. */
  isEditingBlocked: boolean;
  /**
   * Save submits through the form when the client holds the edit lock and the form has unsaved
   * edits. Validation failures are handled by the form submit error path so focus can move to
   * the first invalid field. Review uses ensureEditThen separately so reviewers can mark
   * reviewed without dirtying the form first.
   */
  canSubmitUpdate: boolean;
  /** Show Review for users with activities.review who may edit this activity. */
  showReviewAction: boolean;
  /** Review button is clickable when not submitting and, if saving first, validation passes. */
  reviewActionEnabled: boolean;
  /** Show Complete / Save and complete for users with activities.complete when eligible. */
  showCompleteAction: boolean;
  /** Complete button is clickable when not submitting and, if saving first, validation passes. */
  completeActionEnabled: boolean;
};

type UseActivityEditActionsInput = {
  lockState: LockState;
  mayEditFormFields: boolean;
  canReviewActivities: boolean;
  canCompleteActivities: boolean;
  markCompleteEligible: boolean;
  hasEditLock: boolean;
  canSubmitWithoutValidationErrors: boolean;
  isSubmitting: boolean;
  readOnly: boolean;
  isBlockedByRecurringLockout?: boolean;
  /** Save is only meaningful when the user has changed something. */
  isDirty: boolean;
};

/**
 * Centralizes sticky action-bar flags for the activity edit page.
 */
export function useActivityEditActions({
  lockState,
  mayEditFormFields,
  canReviewActivities,
  canCompleteActivities,
  markCompleteEligible,
  hasEditLock,
  canSubmitWithoutValidationErrors,
  isSubmitting,
  readOnly,
  isBlockedByRecurringLockout = false,
  isDirty,
}: UseActivityEditActionsInput): ActivityEditActionFlags {
  const isLockedByOther = lockState === 'locked-by-other';
  const isEditingBlocked = isLockedByOther || isBlockedByRecurringLockout;

  const canSubmitUpdate = hasEditLock && !isSubmitting && !readOnly && isDirty;

  const showReviewAction =
    canReviewActivities && mayEditFormFields && !isEditingBlocked;

  const reviewActionEnabled =
    showReviewAction &&
    !isSubmitting &&
    (!isDirty || canSubmitWithoutValidationErrors);

  const showCompleteAction =
    canCompleteActivities &&
    markCompleteEligible &&
    mayEditFormFields &&
    !isEditingBlocked;

  const completeActionEnabled =
    showCompleteAction &&
    !isSubmitting &&
    (!isDirty || canSubmitWithoutValidationErrors);

  return {
    isLockedByOther,
    isEditingBlocked,
    canSubmitUpdate,
    showReviewAction,
    reviewActionEnabled,
    showCompleteAction,
    completeActionEnabled,
  };
}
