/**
 * Builds toast options for activity-updated toasts (e.g. used by EditActivityForm
 * for consistent id and description; stable ids enable Sonner deduplication).
 */

/** Zero-pad the numeric activity id to at least 6 characters (e.g. 42 → "000042"), matching the id segment used in activity display IDs. */
export function formatActivityNumericIdPadded(id: number): string {
  return String(id).padStart(6, '0');
}

export interface ActivityUpdatedToastParams {
  id: string;
  title?: string;
  displayId?: string | null;
}

const DURATION_MS = 5000;

export function getActivityUpdatedToastOptions(
  params: ActivityUpdatedToastParams
): { id: string; description: string; duration: number } {
  const { id, title = '', displayId } = params;
  const prefix = displayId ?? `ACT-${id}`;
  return {
    id: `activity-updated-${id}`,
    description: title ? `${prefix}: ${title}` : prefix,
    duration: DURATION_MS,
  };
}
