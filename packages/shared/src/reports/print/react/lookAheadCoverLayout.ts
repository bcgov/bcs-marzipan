import { REPORT_PRINT_COVER_CONTENT_WIDTH_PX } from '../../reportPrintDimensions';

/** Figma frame width used for look-ahead cover coordinates (Letter, 1×). */
export const LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX = 612 as const;

/**
 * Scale Figma (612px-wide) coordinates and sizes onto the cover inset column
 * ({@link REPORT_PRINT_COVER_CONTENT_WIDTH_PX} — canonical layout minus standard horizontal margins).
 */
export function lookAheadCoverLayoutScale(): number {
  return (
    REPORT_PRINT_COVER_CONTENT_WIDTH_PX / LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX
  );
}

/** Map a horizontal/vertical distance from the 612px Figma frame to layout px. */
export function lookAheadCoverLayoutPx(figmaPx: number): number {
  return figmaPx * lookAheadCoverLayoutScale();
}
