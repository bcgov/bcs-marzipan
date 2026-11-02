import {
  activityStatuses,
  categories,
  cities,
  commsMaterials,
  governmentRepresentatives,
  ministries,
  ministryGroups,
  releaseTypes,
  tags,
  themes,
  translatedLanguages,
  venuePresets,
} from '@corpcal/database/schema';
import type { ReorderableLookupKey } from '@corpcal/shared/schemas';

import type { LookupListOrderColumns } from './lookup-list-order';

/** Label column used for alphabetical mode per reorderable lookup type. */
export const LOOKUP_LIST_ORDER_COLUMNS: Record<
  ReorderableLookupKey,
  LookupListOrderColumns
> = {
  categories: {
    sortOrder: categories.sortOrder,
    id: categories.id,
    labelColumn: categories.displayName,
  },
  cities: {
    sortOrder: cities.sortOrder,
    id: cities.id,
    labelColumn: cities.displayName,
  },
  'comms-materials': {
    sortOrder: commsMaterials.sortOrder,
    id: commsMaterials.id,
    labelColumn: commsMaterials.displayName,
  },
  'release-types': {
    sortOrder: releaseTypes.sortOrder,
    id: releaseTypes.id,
    labelColumn: releaseTypes.displayName,
  },
  'activity-statuses': {
    sortOrder: activityStatuses.sortOrder,
    id: activityStatuses.id,
    labelColumn: activityStatuses.displayName,
  },
  'government-representatives': {
    sortOrder: governmentRepresentatives.sortOrder,
    id: governmentRepresentatives.id,
    labelColumn: governmentRepresentatives.displayName,
  },
  ministries: {
    sortOrder: ministries.sortOrder,
    id: ministries.id,
    labelColumn: ministries.displayName,
  },
  'ministry-groups': {
    sortOrder: ministryGroups.sortOrder,
    id: ministryGroups.id,
    labelColumn: ministryGroups.name,
  },
  tags: {
    sortOrder: tags.sortOrder,
    id: tags.id,
    labelColumn: tags.displayName,
  },
  themes: {
    sortOrder: themes.sortOrder,
    id: themes.id,
    labelColumn: themes.displayName,
  },
  'translation-languages': {
    sortOrder: translatedLanguages.sortOrder,
    id: translatedLanguages.id,
    labelColumn: translatedLanguages.displayName,
  },
  'venue-presets': {
    sortOrder: venuePresets.sortOrder,
    id: venuePresets.id,
    labelColumn: venuePresets.venueName,
  },
};
