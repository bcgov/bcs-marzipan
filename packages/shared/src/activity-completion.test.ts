import { describe, expect, it } from 'vitest';

import {
  computeEffectiveEndMs,
  isManualCompleteEligible,
  shouldRunCompletionJob,
  toPacificHourMinute,
} from './activity-completion';

// ============================================================================
// computeEffectiveEndMs
// ============================================================================

describe('computeEffectiveEndMs', () => {
  it('returns null when endDate is missing', () => {
    expect(computeEffectiveEndMs(null, '14:00', false)).toBeNull();
    expect(computeEffectiveEndMs(undefined, '14:00', false)).toBeNull();
  });

  it('returns null for timed activity when endTime is missing', () => {
    expect(computeEffectiveEndMs('2026-04-15', null, false)).toBeNull();
  });

  it('computes timed end as Pacific UTC-7', () => {
    // 2026-04-15 14:30 Pacific = 2026-04-15 21:30 UTC
    const ms = computeEffectiveEndMs('2026-04-15', '14:30', false);
    expect(ms).toBe(Date.UTC(2026, 3, 15, 21, 30, 0));
  });

  it('handles HH:mm:ss endTime format', () => {
    const ms = computeEffectiveEndMs('2026-04-15', '14:30:00', false);
    expect(ms).toBe(Date.UTC(2026, 3, 15, 21, 30, 0));
  });

  it('computes all-day end as start of next calendar day in Pacific', () => {
    // All-day on 2026-04-15: effective end = 2026-04-16 00:00 Pacific = 2026-04-16 07:00 UTC
    const ms = computeEffectiveEndMs('2026-04-15', null, true);
    expect(ms).toBe(Date.UTC(2026, 3, 16, 7, 0, 0));
  });

  it('ignores endTime for all-day activities', () => {
    const withTime = computeEffectiveEndMs('2026-04-15', '10:00', true);
    const withoutTime = computeEffectiveEndMs('2026-04-15', null, true);
    expect(withTime).toBe(withoutTime);
  });
});

// ============================================================================
// isManualCompleteEligible
// ============================================================================

describe('isManualCompleteEligible', () => {
  const baseOpts = {
    activityStatusName: 'reviewed',
    dateStatusName: 'confirmed',
    timeStatusName: 'confirmed',
    endDate: '2026-04-15',
    endTime: '14:00',
    isAllDay: false,
  };

  it('is eligible when now >= effectiveEnd and statuses are correct', () => {
    const effectiveEnd = computeEffectiveEndMs('2026-04-15', '14:00', false)!;
    expect(isManualCompleteEligible(effectiveEnd, baseOpts)).toEqual({
      eligible: true,
    });
    expect(isManualCompleteEligible(effectiveEnd + 1, baseOpts)).toEqual({
      eligible: true,
    });
  });

  it('is not eligible when now < effectiveEnd', () => {
    const effectiveEnd = computeEffectiveEndMs('2026-04-15', '14:00', false)!;
    const result = isManualCompleteEligible(effectiveEnd - 1, baseOpts);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/not ended/i);
  });

  it('rejects statuses other than reviewed, changed, completed', () => {
    const effectiveEnd = computeEffectiveEndMs('2026-04-15', '14:00', false)!;
    for (const status of ['new', 'deleted', 'delete_requested', 'on_hold']) {
      const result = isManualCompleteEligible(effectiveEnd + 1, {
        ...baseOpts,
        activityStatusName: status,
      });
      expect(result.eligible).toBe(false);
    }
  });

  it('allows changed and completed statuses', () => {
    const effectiveEnd = computeEffectiveEndMs('2026-04-15', '14:00', false)!;
    for (const status of ['changed', 'completed']) {
      expect(
        isManualCompleteEligible(effectiveEnd + 1, {
          ...baseOpts,
          activityStatusName: status,
        }).eligible
      ).toBe(true);
    }
  });

  it('rejects non-confirmed date/time statuses', () => {
    const effectiveEnd = computeEffectiveEndMs('2026-04-15', '14:00', false)!;
    expect(
      isManualCompleteEligible(effectiveEnd + 1, {
        ...baseOpts,
        dateStatusName: 'tentative',
      }).eligible
    ).toBe(false);
    expect(
      isManualCompleteEligible(effectiveEnd + 1, {
        ...baseOpts,
        timeStatusName: 'not_confirmed',
      }).eligible
    ).toBe(false);
  });

  it('returns ineligible when endDate is missing', () => {
    const result = isManualCompleteEligible(Date.now(), {
      ...baseOpts,
      endDate: null,
    });
    expect(result.eligible).toBe(false);
  });
});

// ============================================================================
// toPacificHourMinute
// ============================================================================

describe('toPacificHourMinute', () => {
  it('converts UTC midnight to 17:00 Pacific previous day', () => {
    // 2026-04-16 00:00 UTC = 2026-04-15 17:00 Pacific
    const utcMs = Date.UTC(2026, 3, 16, 0, 0, 0);
    expect(toPacificHourMinute(utcMs)).toEqual({ hour: 17, minute: 0 });
  });

  it('converts 07:15 UTC to 00:15 Pacific', () => {
    const utcMs = Date.UTC(2026, 3, 16, 7, 15, 0);
    expect(toPacificHourMinute(utcMs)).toEqual({ hour: 0, minute: 15 });
  });
});

// ============================================================================
// shouldRunCompletionJob
// ============================================================================

describe('shouldRunCompletionJob', () => {
  it('daily + buffer 0: fires only at 00:00', () => {
    expect(shouldRunCompletionJob('daily', 0, 0, 0)).toBe(true);
    expect(shouldRunCompletionJob('daily', 0, 12, 0)).toBe(false);
    expect(shouldRunCompletionJob('daily', 0, 0, 15)).toBe(false);
  });

  it('daily + buffer 15: fires only at 00:15', () => {
    expect(shouldRunCompletionJob('daily', 15, 0, 15)).toBe(true);
    expect(shouldRunCompletionJob('daily', 15, 0, 0)).toBe(false);
  });

  it('twice_daily + buffer 30: fires at 00:30 and 12:30', () => {
    expect(shouldRunCompletionJob('twice_daily', 30, 0, 30)).toBe(true);
    expect(shouldRunCompletionJob('twice_daily', 30, 12, 30)).toBe(true);
    expect(shouldRunCompletionJob('twice_daily', 30, 6, 30)).toBe(false);
  });

  it('hourly + buffer 45: fires at :45 every hour', () => {
    for (let h = 0; h < 24; h++) {
      expect(shouldRunCompletionJob('hourly', 45, h, 45)).toBe(true);
      expect(shouldRunCompletionJob('hourly', 45, h, 0)).toBe(false);
    }
  });
});
