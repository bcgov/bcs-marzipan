import { describe, expect, it } from 'vitest';

import {
  computeActivityReleaseTimeInstant,
  customPartsToReleaseTimeOffsetMinutes,
  formatReleaseTimeOffsetLabel,
  getActivityReleaseTimePreview,
  getReleaseTimeOffsetMaxAmountForUnit,
  isValidCustomReleaseTimeOffsetAmount,
  RELEASE_TIME_OFFSET_MAX_MINUTES,
  releaseTimeOffsetMinutesToCustomParts,
  releaseTimeOffsetMinutesToCustomPartsForUnit,
} from './activity-release-time';

describe('computeActivityReleaseTimeInstant', () => {
  const confirmedTimed = {
    releaseTimeOffsetMinutes: 15,
    startDate: '2026-03-13',
    startTime: '14:30',
    isAllDay: false,
    dateStatusName: 'confirmed',
    timeStatusName: 'confirmed',
  } as const;

  it('returns null when offset is missing', () => {
    expect(
      computeActivityReleaseTimeInstant({
        ...confirmedTimed,
        releaseTimeOffsetMinutes: null,
      })
    ).toBeNull();
  });

  it('returns null when date is not confirmed', () => {
    expect(
      computeActivityReleaseTimeInstant({
        ...confirmedTimed,
        dateStatusName: 'tbd',
      })
    ).toBeNull();
  });

  it('returns null when time is not confirmed for timed events', () => {
    expect(
      computeActivityReleaseTimeInstant({
        ...confirmedTimed,
        timeStatusName: 'tbd',
      })
    ).toBeNull();
  });

  it('computes timed anchor plus offset', () => {
    const iso = computeActivityReleaseTimeInstant(confirmedTimed);
    expect(iso).toBe('2026-03-13T21:45:00.000Z');
  });

  it('uses midnight anchor for all-day when date confirmed', () => {
    const iso = computeActivityReleaseTimeInstant({
      releaseTimeOffsetMinutes: 60,
      startDate: '2026-03-13',
      startTime: null,
      isAllDay: true,
      dateStatusName: 'confirmed',
      timeStatusName: 'tbd',
    });
    expect(iso).toBe('2026-03-13T08:00:00.000Z');
  });
});

describe('getActivityReleaseTimePreview', () => {
  it('returns null when offset is unset', () => {
    expect(
      getActivityReleaseTimePreview({
        releaseTimeOffsetMinutes: null,
        startDate: '2026-03-13',
        startTime: '14:30',
        isAllDay: false,
      })
    ).toBeNull();
  });

  it('previews timed release without confirmed status', () => {
    const result = getActivityReleaseTimePreview({
      releaseTimeOffsetMinutes: 15,
      startDate: '2026-03-13',
      startTime: '14:30',
      isAllDay: false,
    });
    expect(result?.kind).toBe('preview');
    if (result?.kind === 'preview') {
      expect(result.label).toMatch(/2:45 pm PT, Fri Mar 13/);
    }
  });

  it('previews Time TBD when start time is missing for timed events', () => {
    const result = getActivityReleaseTimePreview({
      releaseTimeOffsetMinutes: 15,
      startDate: '2026-03-13',
      startTime: null,
      isAllDay: false,
    });
    expect(result?.kind).toBe('preview');
    if (result?.kind === 'preview') {
      expect(result.label).toMatch(/^Time TBD, Fri Mar 13/);
    }
  });

  it('previews civil time when start date is missing', () => {
    expect(
      getActivityReleaseTimePreview({
        releaseTimeOffsetMinutes: 15,
        startDate: null,
        startTime: '14:30',
        isAllDay: false,
      })
    ).toEqual({
      kind: 'preview',
      label: '2:45 pm PT, Date TBD',
    });
  });

  it('hints when start date is missing and start time is empty', () => {
    expect(
      getActivityReleaseTimePreview({
        releaseTimeOffsetMinutes: 15,
        startDate: null,
        startTime: null,
        isAllDay: false,
      })
    ).toEqual({ kind: 'hint', message: 'Start date required' });
  });

  it('previews all-day from date anchor only', () => {
    const result = getActivityReleaseTimePreview({
      releaseTimeOffsetMinutes: 60,
      startDate: '2026-03-13',
      startTime: null,
      isAllDay: true,
    });
    expect(result?.kind).toBe('preview');
    if (result?.kind === 'preview') {
      expect(result.label).toMatch(/1:00 am PT, Fri Mar 13/);
    }
  });
});

describe('releaseTimeOffset custom parts', () => {
  it('maps minutes to the largest clean unit', () => {
    expect(releaseTimeOffsetMinutesToCustomParts(0)).toEqual({
      amount: 0,
      unit: 'minutes',
    });
    expect(releaseTimeOffsetMinutesToCustomParts(45)).toEqual({
      amount: 45,
      unit: 'minutes',
    });
    expect(releaseTimeOffsetMinutesToCustomParts(90)).toEqual({
      amount: 90,
      unit: 'minutes',
    });
    expect(releaseTimeOffsetMinutesToCustomParts(120)).toEqual({
      amount: 2,
      unit: 'hours',
    });
    expect(releaseTimeOffsetMinutesToCustomParts(1440)).toEqual({
      amount: 1,
      unit: 'days',
    });
    expect(releaseTimeOffsetMinutesToCustomParts(10_080)).toEqual({
      amount: 7,
      unit: 'days',
    });
  });

  it('converts custom parts back to minutes within cap', () => {
    expect(customPartsToReleaseTimeOffsetMinutes(30, 'minutes')).toBe(30);
    expect(customPartsToReleaseTimeOffsetMinutes(2, 'hours')).toBe(120);
    expect(customPartsToReleaseTimeOffsetMinutes(7, 'days')).toBe(10_080);
    expect(customPartsToReleaseTimeOffsetMinutes(8, 'days')).toBeNull();
    expect(customPartsToReleaseTimeOffsetMinutes(169, 'hours')).toBeNull();
    expect(customPartsToReleaseTimeOffsetMinutes(10_081, 'minutes')).toBeNull();
  });

  it('validates amounts per unit', () => {
    expect(isValidCustomReleaseTimeOffsetAmount(168, 'hours')).toBe(true);
    expect(isValidCustomReleaseTimeOffsetAmount(169, 'hours')).toBe(false);
    expect(getReleaseTimeOffsetMaxAmountForUnit('days')).toBe(7);
  });

  it('rounds when converting offset to another custom unit', () => {
    expect(releaseTimeOffsetMinutesToCustomPartsForUnit(45, 'hours')).toEqual({
      amount: 1,
      unit: 'hours',
    });
    expect(releaseTimeOffsetMinutesToCustomPartsForUnit(90, 'hours')).toEqual({
      amount: 2,
      unit: 'hours',
    });
    expect(releaseTimeOffsetMinutesToCustomPartsForUnit(20, 'hours')).toEqual({
      amount: 20,
      unit: 'minutes',
    });
    expect(releaseTimeOffsetMinutesToCustomPartsForUnit(90, 'days')).toEqual({
      amount: 90,
      unit: 'minutes',
    });
    expect(releaseTimeOffsetMinutesToCustomPartsForUnit(1440, 'days')).toEqual({
      amount: 1,
      unit: 'days',
    });
  });
});

describe('formatReleaseTimeOffsetLabel', () => {
  it('formats presets and custom offsets', () => {
    expect(formatReleaseTimeOffsetLabel(null)).toBe('(empty)');
    expect(formatReleaseTimeOffsetLabel(0)).toBe('At scheduled start');
    expect(formatReleaseTimeOffsetLabel(15)).toBe(
      '15 minutes after scheduled start'
    );
    expect(formatReleaseTimeOffsetLabel(1440)).toBe(
      '1 day after scheduled start'
    );
  });

  it('documents max offset constant', () => {
    expect(RELEASE_TIME_OFFSET_MAX_MINUTES).toBe(10_080);
  });
});
