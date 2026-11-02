import {
  activityStatuses,
  categories,
  cities,
  commsMaterials,
  governmentRepresentatives,
  ministries,
  ministryGroups,
  tags,
  themes,
  translatedLanguages,
  venuePresets,
} from '@corpcal/database/schema';
import {
  isReorderableLookupKey,
  REORDERABLE_LOOKUP_KEYS,
  type ReorderableLookupKey,
} from '@corpcal/shared/schemas';

/** Lookup tables whose `sortOrder` admins can set; keys match the `/lookups/<key>` URL segment. */
// Every table here has id, sortOrder, lastUpdatedBy and lastUpdatedDateTime; typed as one for a shared update.
export const REORDERABLE_LOOKUP_TABLES = {
  categories,
  cities,
  'comms-materials': commsMaterials,
  'activity-statuses': activityStatuses,
  'government-representatives': governmentRepresentatives,
  ministries,
  'ministry-groups': ministryGroups,
  tags,
  themes,
  'translation-languages': translatedLanguages,
  'venue-presets': venuePresets,
} as unknown as Record<ReorderableLookupKey, typeof cities>;

export const REORDERABLE_LOOKUPS = [...REORDERABLE_LOOKUP_KEYS];

export function isReorderableLookup(
  entity: string
): entity is ReorderableLookupKey {
  return isReorderableLookupKey(entity);
}
