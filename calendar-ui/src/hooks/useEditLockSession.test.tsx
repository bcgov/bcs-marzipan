import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import type { HeartbeatOutcome, LockState } from './useActivityLock';
import { useEditLockSession } from './useEditLockSession';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const THROTTLE_MS = 30_000;
const THROTTLED_RETRY_MS = 11_000;
const KEEPALIVE_MS = 90_000;

describe('useEditLockSession activity heartbeat', () => {
  const sendHeartbeat = vi.fn(
    (_options?: { keepAlive?: boolean }): Promise<HeartbeatOutcome> =>
      Promise.resolve('ok')
  );

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
    sendHeartbeat.mockClear().mockImplementation(() => Promise.resolve('ok'));
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
      result.current.form.setValue('title', 'One', { shouldDirty: true });
    });
    expect(sendHeartbeat).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(THROTTLE_MS);
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('retries a throttled activity heartbeat after the server window', async () => {
    sendHeartbeat.mockImplementationOnce(() => Promise.resolve('throttled'));
    renderHook(() => useHarness());

    await act(async () => {
      window.dispatchEvent(new Event('keydown'));
      await Promise.resolve();
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(THROTTLED_RETRY_MS - 1);
      await Promise.resolve();
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
    expect(sendHeartbeat).toHaveBeenLastCalledWith();

    // Succeeded: no further retries without more activity.
    await act(async () => {
      vi.advanceTimersByTime(THROTTLED_RETRY_MS * 2);
      await Promise.resolve();
    });
    expect(
      sendHeartbeat.mock.calls.filter((args) => args[0] === undefined)
    ).toHaveLength(2);
  });

  it('does not retry a throttled heartbeat after unmount', async () => {
    let resolveFirst: (outcome: HeartbeatOutcome) => void = () => {};
    sendHeartbeat.mockImplementationOnce(
      () =>
        new Promise<HeartbeatOutcome>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const { unmount } = renderHook(() => useHarness());

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    unmount();

    await act(async () => {
      resolveFirst('throttled');
      await Promise.resolve();
      vi.advanceTimersByTime(THROTTLED_RETRY_MS);
    });

    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
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
