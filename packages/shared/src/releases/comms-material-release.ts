import type { CommsMaterialReleaseSummary } from '../schemas/activity-response.schema';
import type { CommsMaterialReleaseFlagsById } from '../utils/comms-material-form-rules';

export type { CommsMaterialReleaseSummary };

export function activityHasReleaseTypeCommsMaterial(
  commsMaterialIds: number[] | undefined,
  flagsById: CommsMaterialReleaseFlagsById | undefined
): boolean {
  if (!flagsById || flagsById.size === 0) return false;
  const ids = commsMaterialIds ?? [];
  return ids.some((id) => flagsById.has(id));
}

export function activityAllowsTranslationCommsMaterial(
  commsMaterialIds: number[] | undefined,
  flagsById: CommsMaterialReleaseFlagsById | undefined
): boolean {
  if (!flagsById || flagsById.size === 0) return false;
  const ids = commsMaterialIds ?? [];
  return ids.some((id) => flagsById.get(id)?.allowsTranslation === true);
}
