import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  showLockoutChangesDiscardedToast,
  startLockoutCountdownToast,
} from './lockout-countdown-toast';

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    loading: vi.fn(),
    dismiss: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

describe('startLockoutCountdownToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:57:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a warning toast with a live countdown', () => {
    const handle = startLockoutCountdownToast({
      activityId: 5,
      lockStartMs: Date.now() + 60_000,
      lockStartTimeLabel: '2:00 pm',
    });

    expect(toastMock.warning).toHaveBeenCalledWith(
      expect.stringContaining('Activity editing will be locked at 2:00 pm PT'),
      expect.objectContaining({
        description: 'Unsaved changes will be lost in 1 minute.',
        duration: Infinity,
      })
    );

    vi.advanceTimersByTime(1000);
    expect(toastMock.warning.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        description: 'Unsaved changes will be lost in 59 seconds.',
      })
    );

    handle.dispose();
    expect(toastMock.dismiss).toHaveBeenCalled();
  });
});

describe('showLockoutChangesDiscardedToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a warning with the lockout end time', () => {
    showLockoutChangesDiscardedToast({ endTimeOfDay: '16:00' }, 9);

    expect(toastMock.warning).toHaveBeenCalledWith(
      'Unsaved changes discarded',
      expect.objectContaining({
        id: 'lockout-discarded-9',
        description: expect.stringContaining('4:00 pm PT'),
      })
    );
  });
});
