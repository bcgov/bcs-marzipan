import { describe, expect, it, vi } from 'vitest';

import { SYSTEM_ROLE_IDS } from './auth/constants';
import {
  isRoleBlockedByRecurringEditLockout,
  isWithinRecurringEditLockoutWindow,
} from './recurring-edit-lockout';

const baseSettings = {
  isActive: true,
  startTimeOfDay: '09:00',
  endTimeOfDay: '10:00',
  exemptRoleIds: [],
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

describe('isRoleBlockedByRecurringEditLockout', () => {
  it('blocks non-exempt roles during the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    expect(
      isRoleBlockedByRecurringEditLockout(baseSettings, SYSTEM_ROLE_IDS.EDITOR)
    ).toBe(true);

    vi.useRealTimers();
  });

  it('allows exempt roles during the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    expect(
      isRoleBlockedByRecurringEditLockout(
        {
          ...baseSettings,
          exemptRoleIds: [SYSTEM_ROLE_IDS.SYSTEM_ADMIN],
        },
        SYSTEM_ROLE_IDS.SYSTEM_ADMIN
      )
    ).toBe(false);

    vi.useRealTimers();
  });

  it('respects an explicit empty exempt-role list', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00.000Z'));

    expect(
      isRoleBlockedByRecurringEditLockout(
        baseSettings,
        SYSTEM_ROLE_IDS.SYSTEM_ADMIN
      )
    ).toBe(true);

    vi.useRealTimers();
  });
});
