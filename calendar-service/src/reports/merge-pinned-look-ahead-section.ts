import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

/** Sentinel longer than activities.lookAheadSection varchar(50); forces empty intersection. */
export const NO_MATCHING_LOOK_AHEAD_SECTION =
  '__no_matching_look_ahead_section_impossible_value__';

/** Intersect admin-pinned look-ahead section with user section filter. */
export function mergePinnedLookAheadSection(
  filters: FilterActivitiesQueryParams,
  pinnedSection: string | undefined
): void {
  if (!pinnedSection) return;
  const userSections = filters.lookAheadSectionValues;
  if (userSections != null && userSections.length > 0) {
    filters.lookAheadSectionValues = userSections.includes(pinnedSection)
      ? [pinnedSection]
      : [NO_MATCHING_LOOK_AHEAD_SECTION];
  } else {
    filters.lookAheadSectionValues = [pinnedSection];
  }
}
