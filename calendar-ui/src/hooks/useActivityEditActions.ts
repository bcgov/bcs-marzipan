import type { LockState } from './useActivityLock';

export type ActivityEditActionFlags = {
  /** Another user holds the edit lock. */
  isLockedByOther: boolean;
  /**
   * Save submits through the form when the client holds the edit lock, validation passes, and
   * the form has unsaved edits. Review uses ensureEditThen separately so reviewers can mark
   * reviewed without dirtying the form first.
   */
  canSubmitUpdate: boolean;
  /** Show Review for users with activities.review who may edit this activity. */
  showReviewAction: boolean;
  /** Review button is clickable (not submitting, not blocked by another user's lock). */
  reviewActionEnabled: boolean;
  /** Show Complete / Save and complete for users with activities.complete when eligible. */
  showCompleteAction: boolean;
  /** Complete button is clickable. */
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
  isDirty,
}: UseActivityEditActionsInput): ActivityEditActionFlags {
  const isLockedByOther = lockState === 'locked-by-other';

  const canSubmitUpdate =
    hasEditLock &&
    canSubmitWithoutValidationErrors &&
    !isSubmitting &&
    !readOnly &&
    isDirty;

  const showReviewAction =
    canReviewActivities && mayEditFormFields && !isLockedByOther;

  const reviewActionEnabled = showReviewAction && !isSubmitting;

  const showCompleteAction =
    canCompleteActivities &&
    markCompleteEligible &&
    mayEditFormFields &&
    !isLockedByOther;

  const completeActionEnabled = showCompleteAction && !isSubmitting;

  return {
    isLockedByOther,
    canSubmitUpdate,
    showReviewAction,
    reviewActionEnabled,
    showCompleteAction,
    completeActionEnabled,
  };
}
