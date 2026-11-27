import { describe, expect, it } from 'vitest';

import {
  relativeLuminanceFromHex,
  wcagContrastRatio,
} from '../utils/wcagContrast';
import {
  coerceUserColourKey,
  defaultUserColourKeyForUserId,
  USER_COLOUR_KEYS,
  USER_COLOUR_PALETTE,
  userColourKeySchema,
} from './userColourPalette';

describe('userColourPalette', () => {
  it('has twelve keys in enum schema', () => {
    expect(USER_COLOUR_KEYS).toHaveLength(12);
    for (const key of USER_COLOUR_KEYS) {
      expect(userColourKeySchema.parse(key)).toBe(key);
    }
  });

  it('cycles default keys by user id', () => {
    expect(defaultUserColourKeyForUserId(1)).toBe(USER_COLOUR_KEYS[1 % 12]);
    const keysSeen = new Set(
      Array.from({ length: 12 }, (_, i) => defaultUserColourKeyForUserId(i + 1))
    );
    expect(keysSeen.size).toBe(12);
  });

  it('coerces invalid db value to default for user id', () => {
    expect(coerceUserColourKey(null, 5)).toBe(defaultUserColourKeyForUserId(5));
    expect(coerceUserColourKey('not-a-key', 5)).toBe(
      defaultUserColourKeyForUserId(5)
    );
    expect(coerceUserColourKey('blue', 5)).toBe('blue');
  });

  it('avatar foreground meets minimum contrast on muted bg (smoke)', () => {
    for (const key of USER_COLOUR_KEYS) {
      const { avatarBgHex, avatarFgHex } = USER_COLOUR_PALETTE[key];
      const bg = relativeLuminanceFromHex(avatarBgHex);
      const fg = relativeLuminanceFromHex(avatarFgHex);
      expect(bg).not.toBeNull();
      expect(fg).not.toBeNull();
      if (bg === null || fg === null) continue;
      const ratio = wcagContrastRatio(bg, fg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
