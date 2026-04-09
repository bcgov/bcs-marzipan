import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import {
  buildReviewDiffLookups,
  mapResponseToFormData,
} from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';
import { normalizeActivityRichTextFormFields } from './normalize-activity-rich-text-form';

function buildFormLookups(
  lookups: Pick<
    FormLookupData,
    'categories' | 'commsMaterials' | 'translationLanguages' | 'sharedWithTeams'
  >
): Parameters<typeof mapResponseToFormData>[1] {
  return buildReviewDiffLookups({
    categories: lookups.categories,
    commsMaterials: lookups.commsMaterials,
    translationLanguages: lookups.translationLanguages,
    sharedWithTeams: lookups.sharedWithTeams,
  });
}

/**
 * Maps API ActivityResponse to ActivityFormData for the form.
 */
export function activityToFormData(
  activity: ActivityResponse,
  lookups: FormLookupData
): ActivityFormData {
  const base = normalizeActivityRichTextFormFields(
    mapResponseToFormData(activity, buildFormLookups(lookups))
  );
  const reps = lookups.governmentRepresentatives;
  if (!reps?.length) {
    return base;
  }
  const repNameToIdMap = new Map<string, number>();
  reps.forEach((rep) => {
    const name = rep.displayName || rep.name;
    repNameToIdMap.set(name.toLowerCase(), rep.id);
  });
  const representatives =
    activity.representativesAttending?.map((representative) => {
      const repId = repNameToIdMap.get(representative.toLowerCase());
      if (repId != null) return { representativeId: repId };
      return { representativeName: representative };
    }) ?? [];
  return {
    ...base,
    representatives:
      representatives.length > 0 ? representatives : base.representatives,
  };
}
