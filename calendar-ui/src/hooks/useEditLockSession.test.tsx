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

const THROTTLE_MS = 30_000;
const KEEPALIVE_MS = 90_000;

describe('useEditLockSession activity heartbeat', () => {
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

  it('does not extend the idle deadline without user activity', () => {
    renderHook(() => useHarness());

    act(() => {
      vi.advanceTimersByTime(KEEPALIVE_MS * 3);
    });

    expect(sendHeartbeat).not.toHaveBeenCalledWith();
    expect(sendHeartbeat).not.toHaveBeenCalledWith(undefined);
  });

  it('sends keep-alive heartbeats that only renew the connection', () => {
    renderHook(() => useHarness());

    act(() => {
      vi.advanceTimersByTime(KEEPALIVE_MS);
    });

    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
    expect(sendHeartbeat).toHaveBeenCalledWith({ keepAlive: true });
  });

  it('sends an activity heartbeat immediately on form change, then throttles', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.form.setValue('title', 'One');
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.form.setValue('title', 'Two');
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(THROTTLE_MS);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('treats keyboard input as activity', () => {
    renderHook(() => useHarness());

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });

    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
  });

  it('removes listeners and timers on unmount', () => {
    const { unmount } = renderHook(() => useHarness());

    unmount();

    act(() => {
      window.dispatchEvent(new Event('keydown'));
      vi.advanceTimersByTime(KEEPALIVE_MS);
    });

    expect(sendHeartbeat).not.toHaveBeenCalled();
  });

  it('does not send heartbeats when not editing with an owned lock', () => {
    renderHook(() => useHarness({ lockState: 'owned', isEditing: false }));

    act(() => {
      window.dispatchEvent(new Event('keydown'));
      vi.advanceTimersByTime(KEEPALIVE_MS);
    });

    expect(sendHeartbeat).not.toHaveBeenCalled();
  });
});
