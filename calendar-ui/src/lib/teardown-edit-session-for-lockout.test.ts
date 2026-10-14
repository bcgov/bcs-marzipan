import { describe, expect, it, vi } from 'vitest';

import { teardownEditSessionForLockout } from './teardown-edit-session-for-lockout';

const { showLockoutChangesDiscardedToastMock, revertActivityEditSessionMock } =
  vi.hoisted(() => ({
    showLockoutChangesDiscardedToastMock: vi.fn(),
    revertActivityEditSessionMock: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock('./lockout-countdown-toast', () => ({
  showLockoutChangesDiscardedToast: showLockoutChangesDiscardedToastMock,
}));

vi.mock('./revert-activity-edit-session', () => ({
  revertActivityEditSession: revertActivityEditSessionMock,
}));

describe('teardownEditSessionForLockout', () => {
  it('bumps submit generation, shows discard toast, closes modals, and reverts with release', async () => {
    const lockoutSubmitGenerationRef = { current: 0 };
    const closeSubmitModals = vi.fn();
    const releaseWithRetry = vi.fn().mockResolvedValue(undefined);
    const applyExternalLockReleased = vi.fn();
    const setFormUiEpoch = vi.fn();
    const setIsEditing = vi.fn();
    const form = { reset: vi.fn() } as never;
    const schedule = {
      isActive: true,
      startTimeOfDay: '14:00',
      endTimeOfDay: '16:00',
    };

    await teardownEditSessionForLockout({
      activityId: 42,
      schedule,
      lockoutSubmitGenerationRef,
      isEditing: true,
      lockState: 'owned',
      initialFormData: { title: 'Baseline' } as never,
      form,
      setFormUiEpoch,
      setIsEditing,
      applyExternalLockReleased,
      releaseWithRetry,
      closeSubmitModals,
    });

    expect(lockoutSubmitGenerationRef.current).toBe(1);
    expect(showLockoutChangesDiscardedToastMock).toHaveBeenCalledWith(
      schedule,
      42
    );
    expect(closeSubmitModals).toHaveBeenCalledTimes(1);
    expect(revertActivityEditSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isEditing: true,
        release: releaseWithRetry,
      })
    );
  });

  it('omits release when the user does not hold the lock', async () => {
    const lockoutSubmitGenerationRef = { current: 2 };
    const closeSubmitModals = vi.fn();

    await teardownEditSessionForLockout({
      activityId: 7,
      schedule: {
        isActive: true,
        startTimeOfDay: '14:00',
        endTimeOfDay: '16:00',
      },
      lockoutSubmitGenerationRef,
      isEditing: true,
      lockState: 'idle',
      initialFormData: null,
      form: { reset: vi.fn() } as never,
      setFormUiEpoch: vi.fn(),
      setIsEditing: vi.fn(),
      applyExternalLockReleased: vi.fn(),
      releaseWithRetry: vi.fn(),
      closeSubmitModals,
    });

    expect(revertActivityEditSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        release: undefined,
      })
    );
  });
});
