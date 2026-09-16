import { renderHook, waitFor } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MutableRefObject } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { teardownEditSessionForLockout } from '@/lib/teardown-edit-session-for-lockout';

import type { LockState } from './useActivityLock';
import { useRecurringLockoutSession } from './useRecurringLockoutSession';

const useLockoutEditCountdownToastMock = vi.fn();

vi.mock('./useLockoutEditCountdownToast', () => ({
  useLockoutEditCountdownToast: (
    options: Parameters<typeof useLockoutEditCountdownToastMock>[0]
  ) => useLockoutEditCountdownToastMock(options),
}));

vi.mock('@/lib/teardown-edit-session-for-lockout', () => ({
  teardownEditSessionForLockout: vi.fn(() => Promise.resolve()),
}));

const teardownEditSessionForLockoutMock = vi.mocked(
  teardownEditSessionForLockout
);

const schedule = {
  isActive: true,
  startTimeOfDay: '14:00',
  endTimeOfDay: '16:00',
  bannerLeadMinutes: 20,
  editCountdownLeadMinutes: 3,
};

function createOptions(
  overrides: {
    isBlockedByRecurringLockout?: boolean;
    isEditing?: boolean;
    lockState?: LockState;
    recurringLockoutSchedule?: typeof schedule | null;
  } = {}
) {
  const initialFormDataRef = {
    current: {} as ActivityFormData,
  } satisfies MutableRefObject<ActivityFormData | null>;

  return {
    activityId: 42,
    isBlockedByRecurringLockout: false,
    recurringLockoutSchedule: schedule,
    permissions: [] as readonly string[],
    isEditing: true,
    lockState: 'owned' as LockState,
    form: {} as UseFormReturn<ActivityFormData>,
    initialFormDataRef,
    setFormUiEpoch: vi.fn(),
    setIsEditing: vi.fn(),
    applyExternalLockReleased: vi.fn(),
    releaseWithRetry: vi.fn(() => Promise.resolve()),
    refreshActivity: vi.fn(() => Promise.resolve()),
    closeSubmitModals: vi.fn(),
    ...overrides,
  };
}

describe('useRecurringLockoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLockoutEditCountdownToastMock.mockImplementation(() => undefined);
  });

  it('returns lockoutSubmitGenerationRef', () => {
    const { result } = renderHook(
      (props) => useRecurringLockoutSession(props),
      { initialProps: createOptions() }
    );

    expect(result.current.lockoutSubmitGenerationRef.current).toBe(0);
  });

  it('runs teardown once when blocking flips true and stays true across re-renders', async () => {
    const { rerender } = renderHook(
      (props) => useRecurringLockoutSession(props),
      { initialProps: createOptions() }
    );

    rerender(createOptions({ isBlockedByRecurringLockout: true }));

    await waitFor(() => {
      expect(teardownEditSessionForLockoutMock).toHaveBeenCalledTimes(1);
    });

    rerender(
      createOptions({
        isBlockedByRecurringLockout: true,
        isEditing: false,
        lockState: 'idle',
      })
    );

    expect(teardownEditSessionForLockoutMock).toHaveBeenCalledTimes(1);
  });

  it('runs teardown when blocking transitions and the user holds the edit lock', async () => {
    const { rerender } = renderHook(
      (props) => useRecurringLockoutSession(props),
      { initialProps: createOptions({ isEditing: false, lockState: 'owned' }) }
    );

    rerender(
      createOptions({
        isBlockedByRecurringLockout: true,
        isEditing: false,
        lockState: 'owned',
      })
    );

    await waitFor(() => {
      expect(teardownEditSessionForLockoutMock).toHaveBeenCalledTimes(1);
    });
  });

  it('skips teardown when not editing and the user does not hold the lock', async () => {
    const { rerender } = renderHook(
      (props) => useRecurringLockoutSession(props),
      {
        initialProps: createOptions({
          isEditing: false,
          lockState: 'idle',
        }),
      }
    );

    rerender(
      createOptions({
        isBlockedByRecurringLockout: true,
        isEditing: false,
        lockState: 'idle',
      })
    );

    await waitFor(() => {
      expect(teardownEditSessionForLockoutMock).not.toHaveBeenCalled();
    });
  });

  it('does not re-run teardown when blocking becomes true again with no active edit session', async () => {
    const { rerender } = renderHook(
      (props) => useRecurringLockoutSession(props),
      { initialProps: createOptions() }
    );

    rerender(createOptions({ isBlockedByRecurringLockout: true }));

    await waitFor(() => {
      expect(teardownEditSessionForLockoutMock).toHaveBeenCalledTimes(1);
    });

    rerender(
      createOptions({
        isBlockedByRecurringLockout: false,
        isEditing: false,
        lockState: 'idle',
      })
    );

    rerender(
      createOptions({
        isBlockedByRecurringLockout: true,
        isEditing: false,
        lockState: 'idle',
      })
    );

    expect(teardownEditSessionForLockoutMock).toHaveBeenCalledTimes(1);
  });
});
