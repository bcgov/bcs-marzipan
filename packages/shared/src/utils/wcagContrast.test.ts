import { describe, expect, it } from 'vitest';

import {
  contrastingBlackOrWhiteForegroundHex,
  parseHexColorToSrgb255,
  relativeLuminanceFromHex,
  wcagContrastRatio,
} from './wcagContrast';

describe('wcagContrast', () => {
  it('parses 3- and 6-digit hex with hash', () => {
    expect(parseHexColorToSrgb255('#abc')).toEqual([170, 187, 204]);
    expect(parseHexColorToSrgb255('#AbC')).toEqual([170, 187, 204]);
    expect(parseHexColorToSrgb255('#aabbcc')).toEqual([170, 187, 204]);
    expect(parseHexColorToSrgb255('abc')).toBe(null);
    expect(parseHexColorToSrgb255('#aabbc')).toBe(null);
  });

  it('computes contrast ratio symmetrically and matches known endpoints', () => {
    expect(wcagContrastRatio(1, 0)).toBeCloseTo(21, 10);
    expect(wcagContrastRatio(0, 1)).toBeCloseTo(21, 10);
    expect(wcagContrastRatio(0.05, 0.05)).toBeCloseTo(1, 10);
  });

  it('prefers white text on a dark blue and black on a light cream', () => {
    expect(contrastingBlackOrWhiteForegroundHex('#2C7DA0')).toBe('#ffffff');
    expect(contrastingBlackOrWhiteForegroundHex('#FEF9E8')).toBe('#000000');
  });

  it('relativeLuminanceFromHex returns null for invalid input', () => {
    expect(relativeLuminanceFromHex('not-a-color')).toBe(null);
  });
});
