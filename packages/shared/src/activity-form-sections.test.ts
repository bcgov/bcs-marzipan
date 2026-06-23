import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_FORM_SECTION_FIELDS,
  ACTIVITY_FORM_SECTION_IDS,
  ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS,
  getActivityFormSectionFieldKeys,
  getActivityFormSectionFieldKeySet,
} from './activity-form-sections';
import {
  ACTIVITY_REVIEW_EXEMPT_CODE_KEYS,
  ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEYS,
  ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS,
} from './review-exempt-settings';
import { createActivityRequestSchema } from './schemas/activity.schema';
import {
  CLONE_ADVANCED_FIELD_GROUPS,
  CLONE_ADVANCED_FIELD_PATHS,
  CLONE_ADVANCED_SECTIONS,
} from './schemas/clone-activity.schema';

describe('activity-form-sections', () => {
  it('uses unique field keys across sections', () => {
    const keys = getActivityFormSectionFieldKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('accounts for every ActivityFormData key via registry or omitted list', () => {
    const registryKeys = getActivityFormSectionFieldKeySet();
    const omittedKeys = new Set(
      ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS.map(String)
    );
    const schemaKeys = Object.keys(createActivityRequestSchema.shape);

    expect(registryKeys.size + omittedKeys.size).toBe(schemaKeys.length);
    for (const key of schemaKeys) {
      expect(registryKeys.has(key) || omittedKeys.has(key)).toBe(true);
    }
    for (const key of registryKeys) {
      expect(omittedKeys.has(key)).toBe(false);
    }
  });

  it('derives review-exempt sections in form order with Release after Schedule', () => {
    const sectionIds = ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS.map(
      (s) => s.id
    );
    expect(sectionIds).toEqual([
      'overview',
      'comms',
      'reports',
      'schedule',
      'newsRelease',
      'event',
      'sharing',
    ]);
  });

  it('places release fields under newsRelease, not comms', () => {
    const commsKeys =
      ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS.find((s) => s.id === 'comms')
        ?.keys ?? [];
    const releaseKeys =
      ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS.find(
        (s) => s.id === 'newsRelease'
      )?.keys ?? [];

    expect(commsKeys).toEqual([
      'commsContacts',
      'strategy',
      'commsMaterialIds',
    ]);
    expect(releaseKeys).toEqual([
      'newsReleaseId',
      'newsReleaseOriginId',
      'newsReleaseDistributionId',
      'translationsRequiredStatusId',
      'translationLanguageIds',
    ]);
  });

  it('derives review-exempt keys from registry minus code-exempt keys', () => {
    const expected = ACTIVITY_FORM_SECTION_IDS.flatMap((id) =>
      ACTIVITY_FORM_SECTION_FIELDS[id].filter(
        (key) => !ACTIVITY_REVIEW_EXEMPT_CODE_KEYS.has(String(key))
      )
    ).map(String);
    expect([...ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEYS]).toEqual(expected);
  });

  it('derives clone advanced field groups from registry minus clone exclusions', () => {
    expect(CLONE_ADVANCED_SECTIONS).toEqual([
      'overview',
      'comms',
      'reports',
      'schedule',
      'newsRelease',
      'event',
      'sharing',
    ]);
    expect(CLONE_ADVANCED_FIELD_GROUPS).toEqual({
      overview: [
        'tagIds',
        'leadOrgId',
        'leadOrgName',
        'significance',
        'isIssue',
        'isConfidential',
        'notes',
      ],
      comms: ['strategy', 'commsMaterialIds'],
      reports: ['reportSettings'],
      schedule: ['schedulingNotes'],
      newsRelease: ['newsReleaseOriginId', 'newsReleaseDistributionId'],
      event: [
        'venueStatusId',
        'venueAddress',
        'premierRequestedId',
        'representatives',
        'eventPlanners',
      ],
      sharing: ['visibility', 'sharedWithTeamIds'],
    });
    expect(CLONE_ADVANCED_FIELD_PATHS).not.toContain('newsReleaseId');
    expect(CLONE_ADVANCED_FIELD_PATHS).not.toContain(
      'translationsRequiredStatusId'
    );
  });
});
