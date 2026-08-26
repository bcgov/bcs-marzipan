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

  it('shows a loading toast with a live countdown', () => {
    const handle = startLockoutCountdownToast({
      activityId: 5,
      lockStartMs: Date.now() + 60_000,
      lockStartTimeLabel: '2:00 pm',
    });

    expect(toastMock.loading).toHaveBeenCalledWith(
      expect.stringContaining('Activity editing will lock at 2:00 pm PT'),
      expect.objectContaining({ duration: Infinity })
    );
    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toContain('(60s)');

    vi.advanceTimersByTime(1000);
    expect(toastMock.loading.mock.calls.at(-1)?.[0]).toContain('(59s)');

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
