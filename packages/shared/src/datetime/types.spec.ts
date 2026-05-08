import { describe, expect, it } from 'vitest';

import {
  isCalendarDateString,
  isCivilTimeString,
  toCalendarDateString,
  toCivilTimeString,
} from './types';

describe('isCalendarDateString', () => {
  it.each([
    ['2026-01-01', true],
    ['2026-12-31', true],
    ['2024-02-29', true],
    ['2026-02-29', false],
    ['2026-02-30', false],
    ['2026-13-01', false],
    ['2026-1-1', false],
    ['2026/01/01', false],
    ['2026-01-01T00:00:00Z', false],
    ['', false],
  ])('isCalendarDateString(%s) === %s', (input, expected) => {
    expect(isCalendarDateString(input)).toBe(expected);
  });

  it('rejects non-strings', () => {
    expect(isCalendarDateString(20260101)).toBe(false);
    expect(isCalendarDateString(null)).toBe(false);
    expect(isCalendarDateString(undefined)).toBe(false);
  });
});

describe('isCivilTimeString', () => {
  it.each([
    ['00:00', true],
    ['09:30', true],
    ['23:59', true],
    ['9:30', false],
    ['24:00', false],
    ['12:60', false],
    ['12:00:00', false],
    ['', false],
  ])('isCivilTimeString(%s) === %s', (input, expected) => {
    expect(isCivilTimeString(input)).toBe(expected);
  });
});

describe('toCalendarDateString / toCivilTimeString', () => {
  it('passes through valid values', () => {
    expect(toCalendarDateString('2026-04-27')).toBe('2026-04-27');
    expect(toCivilTimeString('14:30')).toBe('14:30');
  });

  it('throws on invalid values', () => {
    expect(() => toCalendarDateString('2026-02-30')).toThrow();
    expect(() => toCivilTimeString('25:00')).toThrow();
  });
});
