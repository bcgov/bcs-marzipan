import { act, renderHook, waitFor } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MutableRefObject } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { teardownEditSessionForLockout } from '@/lib/teardown-edit-session-for-lockout';

import type { LockState } from './useActivityLock';
import { useRecurringLockoutSession } from './useRecurringLockoutSession';

const useLockoutEditCountdownToastMock = vi.fn();

vi.mock('@corpcal/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@corpcal/shared')>();
  return {
    ...actual,
    isWithinRecurringEditLockoutWindow: vi.fn(() => true),
  };
});

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

  it('combines server isBlocked with the session latch', () => {
    const { result, rerender } = renderHook(
      (props) => useRecurringLockoutSession(props),
      { initialProps: createOptions() }
    );

    expect(result.current.isRecurringLockoutBlocking).toBe(false);

    rerender(createOptions({ isBlockedByRecurringLockout: true }));

    expect(result.current.isRecurringLockoutBlocking).toBe(true);
  });

  it('runs teardown once when countdown and boundary transition both fire', async () => {
    let onLockoutStart: (() => void) | undefined;

    useLockoutEditCountdownToastMock.mockImplementation((options) => {
      onLockoutStart = options.onLockoutStart;
    });

    const { result, rerender } = renderHook(
      (props) => useRecurringLockoutSession(props),
      { initialProps: createOptions() }
    );

    act(() => {
      onLockoutStart?.();
    });

    await waitFor(() => {
      expect(teardownEditSessionForLockoutMock).toHaveBeenCalledTimes(1);
    });

    rerender(createOptions({ isBlockedByRecurringLockout: true }));

    await waitFor(() => {
      expect(result.current.isRecurringLockoutBlocking).toBe(true);
    });

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
          lockState: 'unlocked',
        }),
      }
    );

    rerender(
      createOptions({
        isBlockedByRecurringLockout: true,
        isEditing: false,
        lockState: 'unlocked',
      })
    );

    await waitFor(() => {
      expect(teardownEditSessionForLockoutMock).not.toHaveBeenCalled();
    });
  });
});
