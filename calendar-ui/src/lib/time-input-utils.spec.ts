import { describe, expect, it } from 'vitest';

import {
  derivePickerPreviewParts,
  hhmmToTwelveHourParts,
  nearestFiveMinute,
  snapMinuteToFive,
  twelveHourPartsToHHmm,
} from './time-input-utils';

describe('hhmmToTwelveHourParts / twelveHourPartsToHHmm', () => {
  it('round-trips midnight and noon', () => {
    const mid = hhmmToTwelveHourParts('00:00');
    expect(mid).toEqual({ hour12: 12, minute: 0, isPm: false });
    expect(twelveHourPartsToHHmm(mid!)).toBe('00:00');

    const noon = hhmmToTwelveHourParts('12:00');
    expect(noon).toEqual({ hour12: 12, minute: 0, isPm: true });
    expect(twelveHourPartsToHHmm(noon!)).toBe('12:00');
  });

  it('handles 1:30 pm and 9:05 am', () => {
    const p = hhmmToTwelveHourParts('13:30');
    expect(p).toEqual({ hour12: 1, minute: 30, isPm: true });
    expect(twelveHourPartsToHHmm(p!)).toBe('13:30');

    const a = hhmmToTwelveHourParts('09:05');
    expect(a).toEqual({ hour12: 9, minute: 5, isPm: false });
    expect(twelveHourPartsToHHmm(a!)).toBe('09:05');
  });

  it('returns null for empty', () => {
    expect(hhmmToTwelveHourParts('')).toBeNull();
    expect(hhmmToTwelveHourParts(null)).toBeNull();
  });
});

describe('snapMinuteToFive / nearestFiveMinute', () => {
  it('snaps to 5-minute grid', () => {
    expect(snapMinuteToFive(7)).toBe(5);
    expect(snapMinuteToFive(8)).toBe(10);
    expect(nearestFiveMinute(7)).toBe(5);
    expect(nearestFiveMinute(8)).toBe(10);
  });

  it('clamps 59 to 55 on the picker grid', () => {
    expect(snapMinuteToFive(59)).toBe(55);
  });
});

describe('derivePickerPreviewParts', () => {
  it('returns null when empty value and no draft input', () => {
    expect(
      derivePickerPreviewParts({
        value: '',
        hourDraft: '',
        minDraft: '',
        isPm: false,
      })
    ).toBeNull();
  });

  it('uses drafts when typing with no committed value', () => {
    expect(
      derivePickerPreviewParts({
        value: '',
        hourDraft: '3',
        minDraft: '',
        isPm: true,
      })
    ).toEqual({ hour12: 3, minute: 0, isPm: true });
  });

  it('falls back to committed value for empty draft segments', () => {
    expect(
      derivePickerPreviewParts({
        value: '14:30',
        hourDraft: '2',
        minDraft: '',
        isPm: true,
      })
    ).toEqual({ hour12: 2, minute: 30, isPm: true });
  });

  it('snaps manual minutes to nearest 5 when two or more digits in draft', () => {
    expect(
      derivePickerPreviewParts({
        value: '',
        hourDraft: '2',
        minDraft: '22',
        isPm: false,
      })
    ).toEqual({ hour12: 2, minute: 20, isPm: false });

    expect(
      derivePickerPreviewParts({
        value: '',
        hourDraft: '2',
        minDraft: '23',
        isPm: false,
      })
    ).toEqual({ hour12: 2, minute: 25, isPm: false });
  });

  it('does not snap minute preview for a single digit draft (may be incomplete)', () => {
    expect(
      derivePickerPreviewParts({
        value: '',
        hourDraft: '2',
        minDraft: '2',
        isPm: false,
      })
    ).toEqual({ hour12: 2, minute: 2, isPm: false });
  });
});
