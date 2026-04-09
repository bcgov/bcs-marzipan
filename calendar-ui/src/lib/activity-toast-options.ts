/**
 * Helpers for activity create/update success toasts (display id resolution;
 * stable toast ids for Sonner deduplication live at call sites).
 */

/** Zero-pad the numeric activity id to at least 6 characters (e.g. 42 → "000042"), matching the id segment used in activity display IDs. */
export function formatActivityNumericIdPadded(id: number): string {
  return String(id).padStart(6, '0');
}

/**
 * Prefer API `displayId` (includes ministry/team prefix). Fallback matches prior
 * toast copy when the backend has not set displayId yet.
 */
export function resolveActivityToastDisplayId(
  displayId: string | null | undefined,
  numericId: number
): string {
  if (displayId) return displayId;
  return `CAL-${formatActivityNumericIdPadded(numericId)}`;
}
