import { TRANSLATION_REQUIRED_LOOKUP_NAME } from '@corpcal/shared';
import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';

export function resolveTranslationRequiredStatusId(
  statuses: TranslationRequiredStatusLookupItem[],
  lookupName: string = TRANSLATION_REQUIRED_LOOKUP_NAME
): number | undefined {
  return statuses.find((status) => status.name === lookupName)?.id;
}
