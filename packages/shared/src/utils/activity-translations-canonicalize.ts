import type { ActivityFormData } from '../schemas/activity.schema';

export type TranslationStatusLookupIds = {
  tbdId: number;
  requiredId: number;
  noTranslationsId: number;
};

function dedupeSortedLanguageIds(ids: number[] | undefined): number[] {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const unique = [...new Set(ids.filter((x) => typeof x === 'number'))];
  unique.sort((a, b) => a - b);
  return unique;
}

export type CanonicalizeTranslationFieldsOptions = {
  /**
   * When false, `translationsRequiredStatusId` may stay `null` with empty languages
   * (translations block not applicable after comms cleanup).
   */
  translationWorkflowActive: boolean;
};

/**
 * Aligns translation status and language IDs before persist (client submit + service).
 */
export function canonicalizeTranslationFields(
  data: Pick<
    ActivityFormData,
    'translationsRequiredStatusId' | 'translationLanguageIds'
  >,
  lookupIds: TranslationStatusLookupIds | undefined,
  options: CanonicalizeTranslationFieldsOptions
): Pick<
  ActivityFormData,
  'translationsRequiredStatusId' | 'translationLanguageIds'
> {
  const languageIds = dedupeSortedLanguageIds(data.translationLanguageIds);
  const statusId = data.translationsRequiredStatusId ?? null;

  if (!options.translationWorkflowActive) {
    return {
      translationsRequiredStatusId: null,
      translationLanguageIds: [],
    };
  }

  if (lookupIds == null) {
    return {
      translationsRequiredStatusId: statusId,
      translationLanguageIds: languageIds,
    };
  }

  const { tbdId, requiredId, noTranslationsId } = lookupIds;

  if (statusId === noTranslationsId) {
    return {
      translationsRequiredStatusId: noTranslationsId,
      translationLanguageIds: [],
    };
  }

  if (statusId === tbdId && languageIds.length === 0) {
    return {
      translationsRequiredStatusId: tbdId,
      translationLanguageIds: [],
    };
  }

  if (languageIds.length > 0) {
    return {
      translationsRequiredStatusId: requiredId,
      translationLanguageIds: languageIds,
    };
  }

  if (statusId === tbdId) {
    return {
      translationsRequiredStatusId: tbdId,
      translationLanguageIds: [],
    };
  }

  if (statusId === requiredId || statusId == null) {
    return {
      translationsRequiredStatusId: tbdId,
      translationLanguageIds: [],
    };
  }

  return {
    translationsRequiredStatusId: tbdId,
    translationLanguageIds: [],
  };
}

/** Whether selected comms materials enable the translation workflow block. */
export function activityTranslationWorkflowActive(
  commsMaterialIds: number[] | undefined,
  flagsById: ReadonlyMap<number, { allowsTranslation?: boolean }> | undefined
): boolean {
  const ids = commsMaterialIds ?? [];
  if (flagsById === undefined) {
    return false;
  }
  return ids.some((id) => flagsById.get(id)?.allowsTranslation === true);
}
