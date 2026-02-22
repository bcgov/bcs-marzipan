import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import { mapResponseToFormData } from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';

function buildFormLookups(
  lookups: Pick<
    FormLookupData,
    'categories' | 'commsMaterials' | 'translationLanguages'
  >
): Parameters<typeof mapResponseToFormData>[1] {
  return {
    categoryNameToId: (name: string) =>
      lookups.categories.find((c) => c.name === name || c.displayName === name)
        ?.id,
    commsMaterialNameToId: (name: string) =>
      lookups.commsMaterials.find(
        (m) => m.name === name || m.displayName === name
      )?.id,
    translationLanguageNameToId: (name: string) =>
      lookups.translationLanguages.find(
        (l) => l.name === name || l.displayName === name
      )?.id,
  };
}

/**
 * Maps API ActivityResponse to ActivityFormData for the form.
 */
export function activityToFormData(
  activity: ActivityResponse,
  lookups: FormLookupData
): ActivityFormData {
  const base = mapResponseToFormData(activity, buildFormLookups(lookups));
  const reps = lookups.governmentRepresentatives;
  if (!reps?.length) {
    return {
      ...base,
      commsContactLeadId:
        activity.commsContacts?.find((c) => c.isLead)?.userId ?? null,
    };
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
  const commsContactLeadId =
    activity.commsContacts?.find((c) => c.isLead)?.userId ?? null;
  return {
    ...base,
    representatives:
      representatives.length > 0 ? representatives : base.representatives,
    commsContactLeadId,
  };
}
