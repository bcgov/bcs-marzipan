/**
 * Section legend swatch colours stored as `#RGB` / `#RRGGBB`.
 * Shared by JSON report config validation and HTML renderers (defense in depth).
 */
export const LEGEND_SWATCH_HEX_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function sanitizeLegendSwatchHexColor(
  color: string | null | undefined
): string | null {
  if (!color) return null;
  return LEGEND_SWATCH_HEX_REGEX.test(color) ? color : null;
}
