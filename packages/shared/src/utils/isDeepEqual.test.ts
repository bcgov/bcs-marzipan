import { describe, expect, it } from 'vitest';

import { isDeepEqual } from './isDeepEqual';

describe('isDeepEqual', () => {
  describe('primitives', () => {
    it('returns true for identical numbers', () => {
      expect(isDeepEqual(1, 1)).toBe(true);
      expect(isDeepEqual(0, 0)).toBe(true);
    });

    it('returns false for NaN (NaN !== NaN in JS)', () => {
      expect(isDeepEqual(NaN, NaN)).toBe(false);
    });

    it('returns false for different numbers', () => {
      expect(isDeepEqual(1, 2)).toBe(false);
    });

    it('returns true for identical strings', () => {
      expect(isDeepEqual('a', 'a')).toBe(true);
      expect(isDeepEqual('', '')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(isDeepEqual('a', 'b')).toBe(false);
    });

    it('returns true for identical booleans', () => {
      expect(isDeepEqual(true, true)).toBe(true);
      expect(isDeepEqual(false, false)).toBe(true);
    });

    it('returns false for different booleans', () => {
      expect(isDeepEqual(true, false)).toBe(false);
    });
  });

  describe('null and undefined', () => {
    it('returns true when both are null', () => {
      expect(isDeepEqual(null, null)).toBe(true);
    });

    it('returns true when both are undefined', () => {
      expect(isDeepEqual(undefined, undefined)).toBe(true);
    });

    it('treats null and undefined as equal', () => {
      expect(isDeepEqual(null, undefined)).toBe(true);
      expect(isDeepEqual(undefined, null)).toBe(true);
    });

    it('returns false when one is null/undefined and the other is not', () => {
      expect(isDeepEqual(null, 0)).toBe(false);
      expect(isDeepEqual(undefined, '')).toBe(false);
      expect(isDeepEqual({}, null)).toBe(false);
    });
  });

  describe('arrays', () => {
    it('returns true for identical arrays', () => {
      expect(isDeepEqual([], [])).toBe(true);
      expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isDeepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
    });

    it('returns false for arrays of different length', () => {
      expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(isDeepEqual([1], [])).toBe(false);
    });

    it('returns false for arrays with different elements', () => {
      expect(isDeepEqual([1, 2], [1, 3])).toBe(false);
      expect(isDeepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });

    it('compares nested arrays recursively', () => {
      expect(isDeepEqual([[1], [2]], [[1], [2]])).toBe(true);
      expect(isDeepEqual([[1], [2]], [[1], [3]])).toBe(false);
    });
  });

  describe('objects', () => {
    it('returns true for identical plain objects', () => {
      expect(isDeepEqual({}, {})).toBe(true);
      expect(isDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns true when key order differs', () => {
      expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('returns false for objects with different keys', () => {
      expect(isDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('returns false for objects with different values', () => {
      expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('compares nested objects recursively', () => {
      expect(isDeepEqual({ x: { a: 1 } }, { x: { a: 1 } })).toBe(true);
      expect(isDeepEqual({ x: { a: 1 } }, { x: { a: 2 } })).toBe(false);
    });

    it('handles mixed arrays and objects', () => {
      expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(
        true
      );
      expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(
        false
      );
    });
  });

  describe('type mismatches', () => {
    it('returns false when types differ', () => {
      expect(isDeepEqual(1, '1')).toBe(false);
      expect(isDeepEqual([], {})).toBe(false);
      expect(isDeepEqual(null, 0)).toBe(false);
      expect(isDeepEqual(true, 1)).toBe(false);
    });
  });
});
