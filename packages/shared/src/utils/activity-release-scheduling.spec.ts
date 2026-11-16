import { describe, expect, it } from 'vitest';

import {
  applyReleaseSchedulingRadioChange,
  formatReleaseSchedulingModeLabel,
  normalizeReleaseSchedulingPersistence,
  RELEASE_SCHEDULING_RADIO_CUSTOM,
  RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED,
  RELEASE_SCHEDULING_RADIO_ON_SIGNAL,
  releaseSchedulingRadioValueFromFields,
} from './activity-release-scheduling';

describe('releaseSchedulingRadioValueFromFields', () => {
  it('maps on_signal mode', () => {
    expect(releaseSchedulingRadioValueFromFields('on_signal', null)).toBe(
      RELEASE_SCHEDULING_RADIO_ON_SIGNAL
    );
  });

  it('maps preset offsets', () => {
    expect(releaseSchedulingRadioValueFromFields('relative', 15)).toBe('15');
  });

  it('maps custom relative offset', () => {
    expect(releaseSchedulingRadioValueFromFields('relative', 45)).toBe(
      RELEASE_SCHEDULING_RADIO_CUSTOM
    );
  });

  it('returns not specified when mode and offset are empty', () => {
    expect(releaseSchedulingRadioValueFromFields(null, null)).toBe(
      RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED
    );
  });
});

describe('applyReleaseSchedulingRadioChange', () => {
  it('clears on not specified', () => {
    expect(
      applyReleaseSchedulingRadioChange(RELEASE_SCHEDULING_RADIO_NOT_SPECIFIED)
    ).toEqual({
      releaseSchedulingMode: null,
      releaseTimeOffsetMinutes: null,
    });
  });

  it('sets on signal', () => {
    expect(
      applyReleaseSchedulingRadioChange(RELEASE_SCHEDULING_RADIO_ON_SIGNAL)
    ).toEqual({
      releaseSchedulingMode: 'on_signal',
      releaseTimeOffsetMinutes: null,
    });
  });

  it('sets relative preset', () => {
    expect(applyReleaseSchedulingRadioChange('15')).toEqual({
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: 15,
    });
  });
});

describe('normalizeReleaseSchedulingPersistence', () => {
  const confirmedSchedule = {
    startDate: '2026-06-01',
    startTime: '09:00:00',
    isAllDay: false,
    dateStatusName: 'confirmed',
    timeStatusName: 'confirmed',
  };

  it('clears offset and instant for on_signal', () => {
    expect(
      normalizeReleaseSchedulingPersistence({
        releaseSchedulingMode: 'on_signal',
        releaseTimeOffsetMinutes: 15,
        ...confirmedSchedule,
      })
    ).toEqual({
      releaseSchedulingMode: 'on_signal',
      releaseTimeOffsetMinutes: null,
      releaseTime: null,
    });
  });

  it('computes instant for relative mode', () => {
    const result = normalizeReleaseSchedulingPersistence({
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: 15,
      ...confirmedSchedule,
    });
    expect(result.releaseSchedulingMode).toBe('relative');
    expect(result.releaseTimeOffsetMinutes).toBe(15);
    expect(result.releaseTime).toMatch(/^2026-/);
  });

  it('infers relative mode when offset is set without mode', () => {
    const result = normalizeReleaseSchedulingPersistence({
      releaseSchedulingMode: null,
      releaseTimeOffsetMinutes: 0,
      ...confirmedSchedule,
    });
    expect(result.releaseSchedulingMode).toBe('relative');
    expect(result.releaseTimeOffsetMinutes).toBe(0);
  });
});

describe('formatReleaseSchedulingModeLabel', () => {
  it('formats modes', () => {
    expect(formatReleaseSchedulingModeLabel('on_signal')).toBe('On signal');
    expect(formatReleaseSchedulingModeLabel(null)).toBe('(empty)');
  });
});
