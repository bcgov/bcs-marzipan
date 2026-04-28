/**
 * Helpers for activity create/update success toasts (display id resolution;
 * stable toast ids for Sonner deduplication live at call sites).
 */

import { buildActivityDisplayId, TEAM_PREFIX_FALLBACK } from '@corpcal/shared';

/**
 * Prefer API `displayId` (includes ministry/team prefix). Fallback matches
 * `buildActivityDisplayId(TEAM_PREFIX_FALLBACK, id)` when the backend has not
 * set displayId yet.
 */
export function resolveActivityToastDisplayId(
  displayId: string | null | undefined,
  numericId: number
): string {
  if (displayId) return displayId;
  return buildActivityDisplayId(TEAM_PREFIX_FALLBACK, numericId);
}
