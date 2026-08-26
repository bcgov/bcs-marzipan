import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatCountdownRemaining,
  startCountdownLoadingToast,
} from './countdown-loading-toast';

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    loading: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

describe('formatCountdownRemaining', () => {
  it('shows minutes only when at least one minute remains', () => {
    expect(formatCountdownRemaining(180)).toBe('3 minutes');
    expect(formatCountdownRemaining(61)).toBe('2 minutes');
    expect(formatCountdownRemaining(60)).toBe('1 minute');
  });

  it('shows seconds when under one minute', () => {
    expect(formatCountdownRemaining(59)).toBe('59 seconds');
    expect(formatCountdownRemaining(1)).toBe('1 second');
    expect(formatCountdownRemaining(0)).toBe('0 seconds');
  });
});

describe('startCountdownLoadingToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:57:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks a loading toast until expiry then dismisses by default', () => {
    const handle = startCountdownLoadingToast({
      toastId: 'countdown-test',
      endMs: Date.now() + 2_000,
      getContent: (secondsLeft) => ({
        title: 'Waiting',
        description: `${secondsLeft}s remaining`,
      }),
    });

    expect(toastMock.loading).toHaveBeenCalledWith(
      'Waiting',
      expect.objectContaining({
        id: 'countdown-test',
        description: '2s remaining',
        duration: Infinity,
      })
    );

    vi.advanceTimersByTime(1000);
    expect(toastMock.loading.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({ description: '1s remaining' })
    );

    vi.advanceTimersByTime(1000);
    expect(toastMock.dismiss).toHaveBeenCalledWith('countdown-test');

    handle.dispose();
  });

  it('supports warning variant with live countdown', () => {
    const handle = startCountdownLoadingToast({
      toastId: 'countdown-warning',
      endMs: Date.now() + 2_000,
      variant: 'warning',
      getContent: (secondsLeft) => ({
        title: 'Warning',
        description: `${secondsLeft}s remaining`,
      }),
    });

    expect(toastMock.warning).toHaveBeenCalledWith(
      'Warning',
      expect.objectContaining({
        id: 'countdown-warning',
        description: '2s remaining',
        duration: Infinity,
      })
    );
    expect(toastMock.loading).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(toastMock.warning.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({ description: '1s remaining' })
    );

    vi.advanceTimersByTime(1000);
    expect(toastMock.dismiss).toHaveBeenCalledWith('countdown-warning');

    handle.dispose();
  });

  it('supports onExpired returning false to stop ticking without dismissing', () => {
    const onExpired = vi.fn(() => false);

    startCountdownLoadingToast({
      toastId: 'countdown-expired',
      endMs: Date.now(),
      getContent: (secondsLeft) =>
        secondsLeft > 0
          ? { title: 'Waiting', description: `${secondsLeft}s remaining` }
          : { title: 'Done waiting' },
      onExpired,
    });

    vi.advanceTimersByTime(1000);

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toBe('Done waiting');
    expect(toastMock.dismiss).not.toHaveBeenCalled();
  });

  it('dispose clears the interval and dismisses the toast', () => {
    const handle = startCountdownLoadingToast({
      toastId: 'countdown-dispose',
      endMs: Date.now() + 60_000,
      getContent: (secondsLeft) => ({
        title: 'Waiting',
        description: `${secondsLeft}s remaining`,
      }),
    });

    handle.dispose();

    expect(toastMock.dismiss).toHaveBeenCalledWith('countdown-dispose');

    vi.advanceTimersByTime(5000);
    expect(toastMock.loading).toHaveBeenCalledTimes(1);
  });
});
