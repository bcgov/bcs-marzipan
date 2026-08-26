import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from './auth/constants';
import {
  getMsUntilNextRecurringLockoutBoundary,
  getMsUntilRecurringEditLockoutStart,
  isUserBlockedByRecurringEditLockout,
  isWithinRecurringEditLockoutWindow,
  isWithinRecurringLockoutBannerWindow,
} from './recurring-edit-lockout';

const baseSettings = {
  isActive: true,
  startTimeOfDay: '09:00',
  endTimeOfDay: '10:00',
};

const bannerSettings = {
  isActive: true,
  startTimeOfDay: '14:00',
  endTimeOfDay: '16:00',
  bannerLeadMinutes: 20,
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

describe('isWithinRecurringLockoutBannerWindow', () => {
  it('returns null before the lead-time window starts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:39:00.000Z'));

    expect(isWithinRecurringLockoutBannerWindow(bannerSettings)).toBe(false);

    vi.useRealTimers();
  });

  it('returns banner during lead-time window before lockout start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:40:00.000Z'));

    expect(isWithinRecurringLockoutBannerWindow(bannerSettings)).toBe(true);

    vi.useRealTimers();
  });

  it('returns null at end boundary because end time is exclusive', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T23:00:00.000Z'));

    expect(isWithinRecurringLockoutBannerWindow(bannerSettings)).toBe(false);

    vi.useRealTimers();
  });
});

describe('getMsUntilRecurringEditLockoutStart', () => {
  it('returns ms until start when outside the lockout window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:40:00.000Z'));

    expect(getMsUntilRecurringEditLockoutStart(bannerSettings)).toBe(
      20 * 60_000
    );

    vi.useRealTimers();
  });

  it('returns null when the lockout window has already started', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T21:00:00.000Z'));

    expect(getMsUntilRecurringEditLockoutStart(bannerSettings)).toBeNull();

    vi.useRealTimers();
  });
});

describe('getMsUntilNextRecurringLockoutBoundary', () => {
  it('returns ms until show when outside the banner window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:39:00.000Z'));

    expect(getMsUntilNextRecurringLockoutBoundary(bannerSettings)).toBe(60_000);

    vi.useRealTimers();
  });

  it('returns ms until hide when inside the banner window during active lockout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T21:00:00.000Z'));

    expect(getMsUntilNextRecurringLockoutBoundary(bannerSettings)).toBe(
      120 * 60_000
    );

    vi.useRealTimers();
  });

  it('returns ms until lock start when inside the lead-up window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:40:00.000Z'));

    expect(getMsUntilNextRecurringLockoutBoundary(bannerSettings)).toBe(
      20 * 60_000
    );

    vi.useRealTimers();
  });

  it('returns roughly one minute when called one minute before a boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:59:00.000Z'));

    const msUntil = getMsUntilNextRecurringLockoutBoundary(bannerSettings);
    expect(msUntil).toBeGreaterThanOrEqual(60_000);
    expect(msUntil).toBeLessThanOrEqual(61_000);

    vi.useRealTimers();
  });

  it('returns time until end when called exactly at lockout start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T21:00:00.000Z'));

    const msUntil = getMsUntilNextRecurringLockoutBoundary(bannerSettings);
    expect(msUntil).toBe(120 * 60_000);
    expect(msUntil).toBeLessThan(24 * 60 * 60_000);

    vi.useRealTimers();
  });
});
