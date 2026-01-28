import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './index';

describe('formatDate', () => {
  it('formats Date to YYYY-MM-DD', () => {
    const d = new Date('2025-06-15T14:30:00.000Z');
    expect(formatDate(d)).toBe('2025-06-15');
  });

  it('formats ISO string to YYYY-MM-DD', () => {
    expect(formatDate('2025-06-15T14:30:00.000Z')).toBe('2025-06-15');
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formats Date to ISO string', () => {
    const d = new Date('2025-06-15T14:30:00.000Z');
    expect(formatDateTime(d)).toBe('2025-06-15T14:30:00.000Z');
  });

  it('formats ISO string (round-trip)', () => {
    const iso = '2025-06-15T14:30:00.000Z';
    expect(formatDateTime(iso)).toBe(iso);
  });

  it('returns empty string for null', () => {
    expect(formatDateTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDateTime(undefined)).toBe('');
  });
});
