import { describe, expect, it, vi } from 'vitest';

import { releaseLockWithRetry } from './release-lock-with-retry';

describe('releaseLockWithRetry', () => {
  it('retries until release succeeds', async () => {
    vi.useFakeTimers();
    const releaseLock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(undefined);

    const promise = releaseLockWithRetry(releaseLock, 42);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(true);
    expect(releaseLock).toHaveBeenCalledTimes(3);
    expect(releaseLock).toHaveBeenNthCalledWith(1, 42);
    vi.useRealTimers();
  });

  it('returns false after exhausting retries', async () => {
    vi.useFakeTimers();
    const releaseLock = vi.fn().mockRejectedValue(new Error('network'));

    const promise = releaseLockWithRetry(releaseLock, 7, {
      attempts: 2,
      delayMs: 100,
    });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(false);
    expect(releaseLock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
