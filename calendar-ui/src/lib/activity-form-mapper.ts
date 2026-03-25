import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import { mapResponseToFormData } from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function buildFormLookups(
  lookups: Pick<
    FormLookupData,
    'categories' | 'commsMaterials' | 'translationLanguages' | 'sharedWithTeams'
  >
): Parameters<typeof mapResponseToFormData>[1] {
  return {
    categoryNameToId: (name: string) => {
      const key = normalizeForMatch(name);
      return lookups.categories.find(
        (c) =>
          normalizeForMatch(c.name) === key ||
          (c.displayName != null && normalizeForMatch(c.displayName) === key)
      )?.id;
    },
    commsMaterialNameToId: (name: string) => {
      const key = normalizeForMatch(name);
      return lookups.commsMaterials.find(
        (m) =>
          normalizeForMatch(m.name) === key ||
          (m.displayName != null && normalizeForMatch(m.displayName) === key)
      )?.id;
    },
    translationLanguageNameToId: (value: string) => {
      const key = normalizeForMatch(value);
      return lookups.translationLanguages.find(
        (l) =>
          (l.shortcode != null && normalizeForMatch(l.shortcode) === key) ||
          normalizeForMatch(l.name) === key ||
          (l.displayName != null && normalizeForMatch(l.displayName) === key)
      )?.id;
    },
    sharedWithTeamNameToId: lookups.sharedWithTeams?.length
      ? (name: string) => {
          const key = normalizeForMatch(name);
          return lookups.sharedWithTeams?.find(
            (t) =>
              normalizeForMatch(t.name) === key ||
              (t.displayName != null &&
                normalizeForMatch(t.displayName) === key)
          )?.id;
        }
      : undefined,
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
