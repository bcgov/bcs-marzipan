import { describe, expect, it } from 'vitest';

import { toCalendarDateStringFromDb, toCivilTimeStringFromDb } from './mapper';

describe('toCalendarDateStringFromDb', () => {
  it('passes through valid YYYY-MM-DD strings', () => {
    expect(toCalendarDateStringFromDb('2026-04-27')).toBe('2026-04-27');
  });

  it('returns null for null/undefined/empty string', () => {
    expect(toCalendarDateStringFromDb(null)).toBeNull();
    expect(toCalendarDateStringFromDb(undefined)).toBeNull();
    expect(toCalendarDateStringFromDb('')).toBeNull();
  });

  it('extracts UTC components from a Date instance', () => {
    // PostgreSQL `DATE` libraries that opt into JS Date conversion typically
    // produce a UTC-midnight Date for the given calendar day; we read UTC
    // components rather than host-local getters so output is the same under
    // any TZ.
    const utcMidnight = new Date(Date.UTC(2026, 3, 27, 0, 0, 0));
    expect(toCalendarDateStringFromDb(utcMidnight)).toBe('2026-04-27');
  });

  it('throws on a malformed string from the DB', () => {
    expect(() => toCalendarDateStringFromDb('27/04/2026')).toThrow();
  });

  it('returns null for an invalid Date', () => {
    expect(toCalendarDateStringFromDb(new Date(NaN))).toBeNull();
  });
});

describe('toCivilTimeStringFromDb', () => {
  it('passes through HH:mm', () => {
    expect(toCivilTimeStringFromDb('14:30')).toBe('14:30');
  });

  it('truncates HH:mm:ss to HH:mm', () => {
    expect(toCivilTimeStringFromDb('14:30:00')).toBe('14:30');
  });

  it('returns null for null/empty', () => {
    expect(toCivilTimeStringFromDb(null)).toBeNull();
    expect(toCivilTimeStringFromDb('')).toBeNull();
  });

  it('throws on garbage input', () => {
    expect(() => toCivilTimeStringFromDb('not a time')).toThrow();
  });
});
