import type { ActivityFormData } from '../schemas/activity.schema';
import { activityNeedsReleaseTimeField } from './activity-release-time';

/** Release-type workflow flags for a comms material (from lookup API). */
export type CommsMaterialReleaseFlags = {
  audience: 'media' | 'public' | null;
  allowsTranslation: boolean;
  requiresNewsReleaseDetails: boolean;
};

export type CommsMaterialReleaseFlagsById = ReadonlyMap<
  number,
  CommsMaterialReleaseFlags
>;

function selectedMaterialIds(ids: number[] | undefined): number[] {
  return ids ?? [];
}

function anySelectedHasFlag(
  ids: number[],
  flagsById: CommsMaterialReleaseFlagsById,
  key: keyof CommsMaterialReleaseFlags
): boolean {
  return ids.some((id) => flagsById.get(id)?.[key] === true);
}

export function needsReleaseTimeDetails(
  commsMaterialIds: number[] | undefined,
  flagsById: CommsMaterialReleaseFlagsById | undefined
): boolean {
  return activityNeedsReleaseTimeField(commsMaterialIds, flagsById);
}

/**
 * Clears news-release, translation, and release-time activity fields when no
 * selected comms material warrants them (client submit + server save).
 */
export function stripCommsDependentFields(
  data: ActivityFormData,
  flagsById: CommsMaterialReleaseFlagsById | undefined
): ActivityFormData {
  if (!flagsById || flagsById.size === 0) {
    return data;
  }

  const ids = selectedMaterialIds(data.commsMaterialIds);
  const needsNewsReleaseDetails = anySelectedHasFlag(
    ids,
    flagsById,
    'requiresNewsReleaseDetails'
  );
  const allowsTranslation = anySelectedHasFlag(
    ids,
    flagsById,
    'allowsTranslation'
  );
  const needsReleaseTime = needsReleaseTimeDetails(ids, flagsById);

  let next: ActivityFormData = { ...data };

  if (!needsNewsReleaseDetails) {
    next = {
      ...next,
      newsReleaseOriginId: null,
      newsReleaseDistributionId: null,
    };
  }

  if (!allowsTranslation) {
    next = {
      ...next,
      translationsRequiredStatusId: null,
      translationLanguageIds: [],
    };
  }

  if (!needsReleaseTime) {
    next = {
      ...next,
      releaseTimeOffsetMinutes: null,
    };
  }

  return next;
}

/** Build flags map from comms material lookup rows. */
export function buildCommsMaterialReleaseFlagsById(
  materials: ReadonlyArray<{
    id: number;
    releaseType?: CommsMaterialReleaseFlags | null;
  }>
): CommsMaterialReleaseFlagsById {
  const map = new Map<number, CommsMaterialReleaseFlags>();
  for (const m of materials) {
    if (!m.releaseType) continue;
    map.set(m.id, {
      audience: m.releaseType.audience ?? null,
      allowsTranslation: m.releaseType.allowsTranslation,
      requiresNewsReleaseDetails: m.releaseType.requiresNewsReleaseDetails,
    });
  }
  return map;
}
