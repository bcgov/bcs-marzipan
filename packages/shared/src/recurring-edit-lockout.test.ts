import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from './auth/constants';
import {
  isUserBlockedByRecurringEditLockout,
  isWithinRecurringEditLockoutWindow,
} from './recurring-edit-lockout';

const baseSettings = {
  isActive: true,
  startTimeOfDay: '09:00',
  endTimeOfDay: '10:00',
};

describe('isWithinRecurringEditLockoutWindow', () => {
  it('includes the start boundary and excludes the end boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    expect(isWithinRecurringEditLockoutWindow(baseSettings)).toBe(true);

    vi.setSystemTime(new Date('2026-08-05T17:00:00.000Z'));
    expect(isWithinRecurringEditLockoutWindow(baseSettings)).toBe(false);

    vi.useRealTimers();
  });
});

describe('isUserBlockedByRecurringEditLockout', () => {
  it('blocks users without bypass permission during the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    expect(
      isUserBlockedByRecurringEditLockout(baseSettings, [
        PERMISSIONS.ACTIVITIES.EDIT,
      ])
    ).toBe(true);

    vi.useRealTimers();
  });

  it('allows users with bypass permission during the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    expect(
      isUserBlockedByRecurringEditLockout(baseSettings, [
        PERMISSIONS.ACTIVITIES.BYPASS_RECURRING_LOCKOUT,
      ])
    ).toBe(false);

    vi.useRealTimers();
  });

  it('does not block outside the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T17:00:00.000Z'));

    expect(isUserBlockedByRecurringEditLockout(baseSettings, [])).toBe(false);

    vi.useRealTimers();
  });
});
