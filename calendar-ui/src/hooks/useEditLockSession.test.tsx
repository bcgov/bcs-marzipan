import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import {
  EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS,
  EDIT_LOCK_IDLE_WARN_MS,
} from '../lib/edit-lock-idle-expiry';
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
const IDLE_DEADLINE_MS = 1_000_000;

describe('useEditLockSession activity heartbeat', () => {
  const sendHeartbeat = vi.fn(
    (_options?: { keepAlive?: boolean }): Promise<HeartbeatOutcome> =>
      Promise.resolve('ok')
  );
  const onEditLockLost = vi.fn();
  const refreshLockFromServer = vi.fn().mockResolvedValue('owned');
  let serverNowMs = IDLE_DEADLINE_MS + 60_000;

  function useHarness(
    opts: {
      lockState?: LockState;
      isEditing?: boolean;
      idleExpiresAt?: string;
      socketConnection?:
        | 'connected'
        | 'reconnecting'
        | 'browser-offline'
        | 'disconnected';
    } = {}
  ) {
    const form = useForm<ActivityFormData>({
      defaultValues: getDefaultFormValues() as ActivityFormData,
    });

    const idleExpiresAt =
      opts.idleExpiresAt ?? new Date(IDLE_DEADLINE_MS).toISOString();

    useEditLockSession({
      form,
      activityId: 1,
      lockState: opts.lockState ?? 'owned',
      lock: { idleExpiresAt } as Parameters<
        typeof useEditLockSession
      >[0]['lock'],
      isEditing: opts.isEditing ?? true,
      sendHeartbeat,
      getServerNowMs: () => serverNowMs,
      onEditLockLost,
      socketConnection: opts.socketConnection ?? 'connected',
      refreshLockFromServer,
    });

    return { form };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    serverNowMs = IDLE_DEADLINE_MS + 60_000;
    sendHeartbeat.mockClear().mockImplementation(() => Promise.resolve('ok'));
    onEditLockLost.mockClear();
    refreshLockFromServer.mockClear().mockResolvedValue('owned');
    vi.mocked(toast.warning).mockClear();
    vi.mocked(toast.dismiss).mockClear();
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

describe('useEditLockSession idle deadline (server clock)', () => {
  const sendHeartbeat = vi.fn().mockResolvedValue('ok');
  const onEditLockLost = vi.fn();
  const refreshLockFromServer = vi.fn().mockResolvedValue('owned');
  const IDLE_DEADLINE_MS = 2_000_000;
  let serverNowMs = IDLE_DEADLINE_MS;

  beforeEach(() => {
    vi.useFakeTimers();
    serverNowMs = IDLE_DEADLINE_MS - EDIT_LOCK_IDLE_WARN_MS + 5_000;
    sendHeartbeat.mockClear();
    onEditLockLost.mockClear();
    refreshLockFromServer.mockClear().mockResolvedValue('owned');
    vi.mocked(toast.warning).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function useIdleHarness(
    socketConnection:
      | 'connected'
      | 'reconnecting'
      | 'browser-offline'
      | 'disconnected' = 'connected'
  ) {
    const form = useForm<ActivityFormData>({
      defaultValues: getDefaultFormValues() as ActivityFormData,
    });
    useEditLockSession({
      form,
      activityId: 1,
      lockState: 'owned',
      lock: {
        idleExpiresAt: new Date(IDLE_DEADLINE_MS).toISOString(),
      } as Parameters<typeof useEditLockSession>[0]['lock'],
      isEditing: true,
      sendHeartbeat,
      getServerNowMs: () => serverNowMs,
      onEditLockLost,
      socketConnection,
      refreshLockFromServer,
    });
  }

  it('shows idle warning within one minute of the server deadline', () => {
    renderHook(() => useIdleHarness());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(toast.warning).toHaveBeenCalledWith(
      'Edit session ending soon',
      expect.objectContaining({ id: 'idle-lock-warn-1' })
    );
  });

  it('calls onEditLockLost when the server idle deadline passes locally', () => {
    serverNowMs = IDLE_DEADLINE_MS - EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS;
    renderHook(() => useIdleHarness());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(onEditLockLost).toHaveBeenCalledTimes(1);
  });

  it('polls lock status while the socket is disconnected', () => {
    serverNowMs = IDLE_DEADLINE_MS + 60_000;
    renderHook(() => useIdleHarness('disconnected'));

    expect(refreshLockFromServer).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(refreshLockFromServer).toHaveBeenCalledTimes(2);
  });
});
