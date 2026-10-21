import { describe, expect, it } from 'vitest';

import {
  EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS,
  EDIT_LOCK_IDLE_WARN_MS,
  getEditLockIdleMsLeft,
  isEditLockIdleDeadlinePassed,
  isEditLockIdleExpired,
} from './edit-lock-idle-expiry';

const DEADLINE = 1_000_000;

describe('isEditLockIdleExpired', () => {
  it('is false without a known idle deadline', () => {
    expect(
      isEditLockIdleExpired({
        idleExpiresAtMs: null,
        serverNowMs: DEADLINE * 2,
        unconfirmedActivityAtMs: null,
      })
    ).toBe(false);
  });

  it('is false before the idle deadline (lock lost for another reason)', () => {
    expect(
      isEditLockIdleExpired({
        idleExpiresAtMs: DEADLINE,
        serverNowMs: DEADLINE - EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS - 1,
        unconfirmedActivityAtMs: null,
      })
    ).toBe(false);
  });

  it('is true after the deadline with no unacknowledged activity', () => {
    expect(
      isEditLockIdleExpired({
        idleExpiresAtMs: DEADLINE,
        serverNowMs: DEADLINE + 1,
        unconfirmedActivityAtMs: null,
      })
    ).toBe(true);
  });

  it('allows small clock skew near the deadline', () => {
    expect(
      isEditLockIdleExpired({
        idleExpiresAtMs: DEADLINE,
        serverNowMs: DEADLINE - EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS,
        unconfirmedActivityAtMs: null,
      })
    ).toBe(true);
  });

  it('is false when activity before the deadline never reached the server', () => {
    expect(
      isEditLockIdleExpired({
        idleExpiresAtMs: DEADLINE,
        serverNowMs: DEADLINE + 60_000,
        unconfirmedActivityAtMs: DEADLINE - 10_000,
      })
    ).toBe(false);
  });

  it('is true when the only unacknowledged activity came after the deadline', () => {
    expect(
      isEditLockIdleExpired({
        idleExpiresAtMs: DEADLINE,
        serverNowMs: DEADLINE + 60_000,
        unconfirmedActivityAtMs: DEADLINE + 30_000,
      })
    ).toBe(true);
  });
});

describe('idle deadline helpers', () => {
  const deadlineIso = new Date(DEADLINE).toISOString();

  it('computes ms left from server now', () => {
    expect(getEditLockIdleMsLeft(deadlineIso, DEADLINE - 10_000)).toBe(10_000);
  });

  it('detects passed deadline within tolerance', () => {
    expect(
      isEditLockIdleDeadlinePassed(
        deadlineIso,
        DEADLINE - EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS
      )
    ).toBe(true);
  });

  it('exports a one-minute warn lead', () => {
    expect(EDIT_LOCK_IDLE_WARN_MS).toBe(60_000);
  });
});
