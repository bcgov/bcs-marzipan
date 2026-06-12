import { describe, expect, it } from 'vitest';

import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

import {
  mergePinnedLookAheadSection,
  NO_MATCHING_LOOK_AHEAD_SECTION,
} from './merge-pinned-look-ahead-section';

describe('mergePinnedLookAheadSection', () => {
  const baseFilters = (): FilterActivitiesQueryParams => ({
    page: 1,
    limit: 20,
  });

  it('uses a sentinel longer than the lookAheadSection column limit', () => {
    expect(NO_MATCHING_LOOK_AHEAD_SECTION.length).toBeGreaterThan(50);
  });

  it('pins the section when the user has no section filter', () => {
    const filters = baseFilters();
    mergePinnedLookAheadSection(filters, 'events');
    expect(filters.lookAheadSectionValues).toEqual(['events']);
  });

  it('intersects when the user filter includes the pinned section', () => {
    const filters = {
      ...baseFilters(),
      lookAheadSectionValues: ['issues', 'events'],
    };
    mergePinnedLookAheadSection(filters, 'events');
    expect(filters.lookAheadSectionValues).toEqual(['events']);
  });

  it('forces no matches when the user filter excludes the pinned section', () => {
    const filters = {
      ...baseFilters(),
      lookAheadSectionValues: ['issues'],
    };
    mergePinnedLookAheadSection(filters, 'events');
    expect(filters.lookAheadSectionValues).toEqual([
      NO_MATCHING_LOOK_AHEAD_SECTION,
    ]);
  });

  it('leaves filters unchanged when pinnedSection is omitted', () => {
    const filters = {
      ...baseFilters(),
      lookAheadSectionValues: ['issues'],
    };
    mergePinnedLookAheadSection(filters, undefined);
    expect(filters.lookAheadSectionValues).toEqual(['issues']);
  });
});
