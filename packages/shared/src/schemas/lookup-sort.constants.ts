/** URL path segments for lookup types that support sort mode and manual reorder. */
export const REORDERABLE_LOOKUP_KEYS = [
  'categories',
  'cities',
  'comms-materials',
  'release-types',
  'activity-statuses',
  'government-representatives',
  'ministries',
  'ministry-groups',
  'tags',
  'themes',
  'translation-languages',
  'venue-presets',
] as const;

export type ReorderableLookupKey = (typeof REORDERABLE_LOOKUP_KEYS)[number];

export const LOOKUP_SORT_MODES = ['manual', 'alphabetical'] as const;

export type LookupSortMode = (typeof LOOKUP_SORT_MODES)[number];

export function isReorderableLookupKey(
  key: string
): key is ReorderableLookupKey {
  return (REORDERABLE_LOOKUP_KEYS as readonly string[]).includes(key);
}
