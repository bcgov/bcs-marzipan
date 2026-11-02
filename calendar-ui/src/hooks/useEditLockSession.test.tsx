import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import type { LockState } from './useActivityLock';
import { useEditLockSession } from './useEditLockSession';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const DEBOUNCE_MS = 45_000;

describe('useEditLockSession debounced heartbeat', () => {
  const sendHeartbeat = vi.fn(() => Promise.resolve());

  function useHarness(
    opts: {
      lockState?: LockState;
      isEditing?: boolean;
    } = {}
  ) {
    const form = useForm<ActivityFormData>({
      defaultValues: getDefaultFormValues() as ActivityFormData,
    });

    useEditLockSession({
      form,
      activityId: 1,
      lockState: opts.lockState ?? 'owned',
      lock: null,
      isEditing: opts.isEditing ?? true,
      sendHeartbeat,
    });

    return { form };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sendHeartbeat.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends a debounced heartbeat after 45s without form changes', () => {
    renderHook(() => useHarness());

    expect(sendHeartbeat).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
  });

  it('reschedules the debounced heartbeat when the form changes', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    act(() => {
      result.current.form.setValue('title', 'Updated title');
    });

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(sendHeartbeat).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
  });

  it('clears the debounced timer and subscription on unmount', () => {
    const { unmount } = renderHook(() => useHarness());

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(sendHeartbeat).not.toHaveBeenCalled();
  });

  it('does not schedule debounced heartbeats when not editing with an owned lock', () => {
    renderHook(() => useHarness({ lockState: 'owned', isEditing: false }));

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(sendHeartbeat).not.toHaveBeenCalled();
  });
});
