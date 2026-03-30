import type { MapResponseToFormDataLookups } from './activity-form-mapper';

/** Minimal row shape for name-to-ID resolution (categories, comms materials, teams). */
export interface NameIdRow {
  id: number;
  name: string;
  displayName?: string | null;
}

/** Extended row shape for translation languages (also matches by shortcode). */
export interface TranslationLanguageRow extends NameIdRow {
  shortcode?: string | null;
}

export interface ReviewDiffLookupRows {
  categories: readonly NameIdRow[];
  commsMaterials: readonly NameIdRow[];
  translationLanguages: readonly TranslationLanguageRow[];
  sharedWithTeams?: readonly NameIdRow[];
}

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function nameIdResolver(
  rows: readonly NameIdRow[]
): (name: string) => number | undefined {
  return (name: string) => {
    const key = normalizeForMatch(name);
    return rows.find(
      (r) =>
        normalizeForMatch(r.name) === key ||
        (r.displayName != null && normalizeForMatch(r.displayName) === key)
    )?.id;
  };
}

/**
 * Builds {@link MapResponseToFormDataLookups} from raw lookup rows.
 *
 * Uses the same trim/lowercase matching rules as the client-side
 * `buildFormLookups` in `calendar-ui`, so review-diff snapshots and
 * the client form hydration resolve names to IDs identically.
 */
export function buildReviewDiffLookups(
  rows: ReviewDiffLookupRows
): MapResponseToFormDataLookups {
  return {
    categoryNameToId: nameIdResolver(rows.categories),
    commsMaterialNameToId: nameIdResolver(rows.commsMaterials),
    translationLanguageNameToId: (value: string) => {
      const key = normalizeForMatch(value);
      return rows.translationLanguages.find(
        (l) =>
          (l.shortcode != null && normalizeForMatch(l.shortcode) === key) ||
          normalizeForMatch(l.name) === key ||
          (l.displayName != null && normalizeForMatch(l.displayName) === key)
      )?.id;
    },
    sharedWithTeamNameToId: rows.sharedWithTeams?.length
      ? nameIdResolver(rows.sharedWithTeams)
      : undefined,
  };
}
