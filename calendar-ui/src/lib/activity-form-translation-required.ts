import {
  TBD_LOOKUP_NAME,
  TRANSLATION_NO_TRANSLATIONS_LOOKUP_NAME,
  TRANSLATION_NOT_REQUIRED_LOOKUP_NAME,
  TRANSLATION_REQUIRED_LOOKUP_NAME,
} from '@corpcal/shared';
import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';
import type { TranslationStatusLookupIds } from '@corpcal/shared/utils';

export function resolveTranslationRequiredStatusId(
  statuses: TranslationRequiredStatusLookupItem[],
  lookupName: string = TRANSLATION_REQUIRED_LOOKUP_NAME
): number | undefined {
  return statuses.find((status) => status.name === lookupName)?.id;
}

export function resolveTranslationStatusLookupIds(
  statuses: TranslationRequiredStatusLookupItem[]
): TranslationStatusLookupIds | undefined {
  const tbdId = statuses.find((s) => s.name === TBD_LOOKUP_NAME)?.id;
  const requiredId = statuses.find(
    (s) => s.name === TRANSLATION_REQUIRED_LOOKUP_NAME
  )?.id;
  const noTranslationsId =
    statuses.find((s) => s.name === TRANSLATION_NO_TRANSLATIONS_LOOKUP_NAME)
      ?.id ??
    statuses.find((s) => s.name === TRANSLATION_NOT_REQUIRED_LOOKUP_NAME)?.id;

  if (tbdId == null || requiredId == null || noTranslationsId == null) {
    return undefined;
  }

  return { tbdId, requiredId, noTranslationsId };
}

/** UI-only combobox sentinel (not persisted). */
export const TRANSLATION_COMBO_SENTINEL_NONE =
  '__translation_no_translations__' as const;

export type TranslationComboboxSentinel =
  typeof TRANSLATION_COMBO_SENTINEL_NONE;

export function isTranslationComboboxSentinel(
  value: string
): value is TranslationComboboxSentinel {
  return value === TRANSLATION_COMBO_SENTINEL_NONE;
}

export function translationFieldsToComboboxValues(
  translationsRequiredStatusId: number | null | undefined,
  translationLanguageIds: number[] | undefined,
  lookupIds: TranslationStatusLookupIds | undefined
): string[] {
  const languageIds = translationLanguageIds ?? [];
  if (languageIds.length > 0) {
    return languageIds.map(String);
  }
  if (
    lookupIds != null &&
    translationsRequiredStatusId === lookupIds.noTranslationsId
  ) {
    return [TRANSLATION_COMBO_SENTINEL_NONE];
  }
  return [];
}

export function normalizeTranslationComboboxValues(
  selectedValues: string[]
): string[] {
  if (selectedValues.includes(TRANSLATION_COMBO_SENTINEL_NONE)) {
    return [TRANSLATION_COMBO_SENTINEL_NONE];
  }
  const languageValues = selectedValues.filter(
    (v) => !isTranslationComboboxSentinel(v)
  );
  if (languageValues.length > 0) {
    return languageValues;
  }
  return [];
}

export function comboboxValuesToTranslationFields(
  selectedValues: string[],
  lookupIds: TranslationStatusLookupIds
): {
  translationsRequiredStatusId: number;
  translationLanguageIds: number[];
} {
  const languageIds = selectedValues
    .filter((v) => !isTranslationComboboxSentinel(v))
    .map((v) => Number(v))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (languageIds.length > 0) {
    return {
      translationsRequiredStatusId: lookupIds.requiredId,
      translationLanguageIds: languageIds,
    };
  }
  if (selectedValues.includes(TRANSLATION_COMBO_SENTINEL_NONE)) {
    return {
      translationsRequiredStatusId: lookupIds.noTranslationsId,
      translationLanguageIds: [],
    };
  }
  return {
    translationsRequiredStatusId: lookupIds.tbdId,
    translationLanguageIds: [],
  };
}
