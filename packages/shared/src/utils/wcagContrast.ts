/**
 * WCAG 2.x relative luminance and contrast utilities (sRGB).
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */

const HEX_3_OR_6 = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Parses `#rgb` or `#rrggbb` to 8-bit sRGB channels.
 * Returns null if the string does not match that form.
 */
export function parseHexColorToSrgb255(
  hex: string
): readonly [number, number, number] | null {
  if (!HEX_3_OR_6.test(hex)) return null;
  const raw = hex.slice(1);
  const full =
    raw.length === 3
      ? [...raw].map((c) => `${c}${c}`).join('')
      : raw.length === 6
        ? raw
        : '';
  if (full.length !== 6) return null;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

/**
 * Relative luminance for sRGB channels in 0–255 (linearised per WCAG).
 */
export function relativeLuminanceSrgb(
  rgb: readonly [number, number, number]
): number {
  const channel = (c255: number) => {
    const c = c255 / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(rgb[0]);
  const g = channel(rgb[1]);
  const b = channel(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function relativeLuminanceFromHex(hex: string): number | null {
  const rgb = parseHexColorToSrgb255(hex);
  return rgb === null ? null : relativeLuminanceSrgb(rgb);
}

/** WCAG contrast ratio between two relative luminance values (order-independent). */
export function wcagContrastRatio(
  luminance1: number,
  luminance2: number
): number {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

const LUM_WHITE = 1;
const LUM_BLACK = 0;

/**
 * Chooses `#ffffff` or `#000000` depending on which achieves the higher
 * WCAG contrast ratio against the given solid background hex.
 *
 * On unparseable hex, returns `#000000` (caller should validate colours first).
 */
export function contrastingBlackOrWhiteForegroundHex(
  hex: string
): '#ffffff' | '#000000' {
  const Lbg = relativeLuminanceFromHex(hex);
  if (Lbg === null) return '#000000';
  const whiteRatio = wcagContrastRatio(Lbg, LUM_WHITE);
  const blackRatio = wcagContrastRatio(Lbg, LUM_BLACK);
  return whiteRatio >= blackRatio ? '#ffffff' : '#000000';
}
