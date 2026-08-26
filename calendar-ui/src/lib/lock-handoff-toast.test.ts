import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startLockHandoffCountdownToast } from './lock-handoff-toast';

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    loading: vi.fn(),
    dismiss: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

describe('startLockHandoffCountdownToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:57:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows holder countdown with lost-in suffix', () => {
    const handle = startLockHandoffCountdownToast({
      activityId: 5,
      graceEndsAt: new Date(Date.now() + 60_000).toISOString(),
      counterpartUsername: 'admin',
      role: 'holder',
    });

    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toContain(
      'admin has requested to edit this activity'
    );
    expect(toastMock.loading.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        description: 'Unsaved changes will be lost in 1 minute.',
      })
    );

    handle.dispose();
  });

  it('shows requester countdown with unlocked-in suffix', () => {
    const handle = startLockHandoffCountdownToast({
      activityId: 5,
      graceEndsAt: new Date(Date.now() + 60_000).toISOString(),
      counterpartUsername: 'editor',
      role: 'requester',
    });

    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toContain(
      'Requesting the current editor to save their changes'
    );
    expect(toastMock.loading.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        description: 'The activity will be unlocked in 1 minute.',
      })
    );

    handle.dispose();
  });

  it('shows unlocking message for requester after countdown expires', () => {
    startLockHandoffCountdownToast({
      activityId: 5,
      graceEndsAt: new Date(Date.now()).toISOString(),
      counterpartUsername: 'editor',
      role: 'requester',
    });

    vi.advanceTimersByTime(1000);

    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toBe(
      'Unlocking activity...'
    );
    expect(toastMock.dismiss).not.toHaveBeenCalled();
  });
});
