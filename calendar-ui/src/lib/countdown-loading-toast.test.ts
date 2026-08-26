import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startCountdownLoadingToast } from './countdown-loading-toast';

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

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
      getMessage: (secondsLeft) => `Waiting (${secondsLeft}s)`,
    });

    expect(toastMock.loading).toHaveBeenCalledWith(
      'Waiting (2s)',
      expect.objectContaining({ id: 'countdown-test', duration: Infinity })
    );

    vi.advanceTimersByTime(1000);
    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toBe('Waiting (1s)');

    vi.advanceTimersByTime(1000);
    expect(toastMock.dismiss).toHaveBeenCalledWith('countdown-test');

    handle.dispose();
  });

  it('supports onExpired returning false to stop ticking without dismissing', () => {
    const onExpired = vi.fn(() => false);

    startCountdownLoadingToast({
      toastId: 'countdown-expired',
      endMs: Date.now(),
      getMessage: (secondsLeft) =>
        secondsLeft > 0 ? `Waiting (${secondsLeft}s)` : 'Done waiting',
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
      getMessage: (secondsLeft) => `Waiting (${secondsLeft}s)`,
    });

    handle.dispose();

    expect(toastMock.dismiss).toHaveBeenCalledWith('countdown-dispose');

    vi.advanceTimersByTime(5000);
    expect(toastMock.loading).toHaveBeenCalledTimes(1);
  });
});
