import { describe, expect, it } from 'vitest';

import {
  computeActivityReleaseTimeInstant,
  formatReleaseTimeOffsetLabel,
  RELEASE_TIME_OFFSET_MAX_MINUTES,
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
