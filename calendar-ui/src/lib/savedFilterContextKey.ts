/**
 * Stable context key builder for saved filters.
 * Keys must be consistent between save and load so filters are scoped correctly.
 */

export type ActivityListTab =
  | 'all'
  | 'my-activities'
  | 'shared-with-me'
  | 'ministry'
  | 'recent';

export function buildSavedFilterContextKey(
  tab: ActivityListTab,
  leadTeamId?: number | null
): string {
  if (tab === 'ministry' && leadTeamId != null) {
    return `ministry:team:${leadTeamId}`;
  }
  return tab;
}
