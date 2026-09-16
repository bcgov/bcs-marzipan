import { describe, expect, it } from 'vitest';

import { useActivityEditActions } from './useActivityEditActions';

describe('useActivityEditActions', () => {
  const baseInput = {
    lockState: 'idle' as const,
    mayEditFormFields: true,
    canReviewActivities: true,
    canCompleteActivities: true,
    markCompleteEligible: true,
    hasEditLock: true,
    canSubmitWithoutValidationErrors: true,
    isSubmitting: false,
    readOnly: false,
    isDirty: true,
  };

  it('hides review and complete actions during recurring lockout', () => {
    const flags = useActivityEditActions({
      ...baseInput,
      isBlockedByRecurringLockout: true,
      readOnly: true,
    });

    expect(flags.isEditingBlocked).toBe(true);
    expect(flags.showReviewAction).toBe(false);
    expect(flags.showCompleteAction).toBe(false);
    expect(flags.canSubmitUpdate).toBe(false);
  });

  it('treats another-user lock the same as recurring lockout for edit actions', () => {
    const flags = useActivityEditActions({
      ...baseInput,
      lockState: 'locked-by-other',
      readOnly: true,
      hasEditLock: false,
      isDirty: false,
    });

    expect(flags.isEditingBlocked).toBe(true);
    expect(flags.showReviewAction).toBe(false);
    expect(flags.showCompleteAction).toBe(false);
  });
});
