import { describe, expect, it } from 'vitest';

import {
  LIST_ACTIVITY_RELATION_KEYS,
  LIST_FILTER_RELATION_KEYS,
  LIST_TABLE_DISPLAY_RELATION_KEYS,
  relationsForQueryFilters,
  relationsForReportFieldKeys,
  relationsForSearchKeyword,
  SEARCH_ACTIVITY_RELATION_KEYS,
  unionActivityRelationKeys,
} from './activity-relation-registry';
import {
  HYDRATION_PROFILES,
  profileIncludesRelation,
} from './hydration-profile';
import { resolveReportHydrationProfile } from './resolve-report-hydration-profile';

describe('activity-relation-registry', () => {
  it('maps report field keys to relation fetchers', () => {
    const relations = relationsForReportFieldKeys([
      'category',
      'tags',
      'event_lead',
      'leadMinistry',
    ]);
    expect(relations.has('categories')).toBe(true);
    expect(relations.has('tags')).toBe(true);
    expect(relations.has('commsContacts')).toBe(true);
    expect(relations.has('leadMinistry')).toBe(true);
    expect(relations.has('leadMinistryAbbreviation')).toBe(true);
  });

  it('maps active query filters to relations', () => {
    const relations = relationsForQueryFilters({
      tagIds: [1],
      activityStatusIds: [2],
    });
    expect(relations.has('tags')).toBe(true);
    expect(relations.has('activityStatus')).toBe(true);
  });

  it('includes search relations when keyword is non-empty', () => {
    expect(relationsForSearchKeyword('').size).toBe(0);
    expect(relationsForSearchKeyword('briefing').has('commsContacts')).toBe(
      true
    );
  });
});

describe('hydration-profile', () => {
  it('LIST_ACTIVITY_RELATION_KEYS unions search, filter, and display sets', () => {
    const expected = unionActivityRelationKeys(
      SEARCH_ACTIVITY_RELATION_KEYS,
      LIST_FILTER_RELATION_KEYS,
      LIST_TABLE_DISPLAY_RELATION_KEYS
    );
    expect(LIST_ACTIVITY_RELATION_KEYS).toEqual(expected);
  });

  it('list profile covers all list relation keys', () => {
    for (const key of LIST_ACTIVITY_RELATION_KEYS) {
      expect(profileIncludesRelation(HYDRATION_PROFILES.list, key)).toBe(true);
    }
  });

  it('list profile covers search and filter relation keys', () => {
    for (const key of SEARCH_ACTIVITY_RELATION_KEYS) {
      expect(profileIncludesRelation(HYDRATION_PROFILES.list, key)).toBe(true);
    }
    for (const key of LIST_FILTER_RELATION_KEYS) {
      expect(profileIncludesRelation(HYDRATION_PROFILES.list, key)).toBe(true);
    }
  });

  it('list profile covers table display relations', () => {
    for (const key of LIST_TABLE_DISPLAY_RELATION_KEYS) {
      expect(profileIncludesRelation(HYDRATION_PROFILES.list, key)).toBe(true);
    }
  });

  it('detail profile includes all relations', () => {
    expect(HYDRATION_PROFILES.detail.relations.size).toBeGreaterThan(
      HYDRATION_PROFILES.list.relations.size
    );
  });
});

describe('resolveReportHydrationProfile', () => {
  it('unions display fields, filters, and search', () => {
    const profile = resolveReportHydrationProfile({
      effectiveFields: ['summary', 'commsContact'],
      query: { tagIds: [5] },
    });
    expect(profileIncludesRelation(profile, 'commsContacts')).toBe(true);
    expect(profileIncludesRelation(profile, 'tags')).toBe(true);
    expect(profileIncludesRelation(profile, 'activityStatus')).toBe(true);
  });

  it('always includes keyword-search relations without search param', () => {
    const profile = resolveReportHydrationProfile({
      effectiveFields: ['title'],
      query: {},
    });
    for (const key of SEARCH_ACTIVITY_RELATION_KEYS) {
      expect(profileIncludesRelation(profile, key)).toBe(true);
    }
  });
});
