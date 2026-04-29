import { describe, expect, it } from 'vitest';

import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import {
  buildTranslationsLine,
  compareActivitiesForPrint,
  resolveLeadOrgForPrint,
  toPrintRowViewModel,
  TRANSLATIONS_COLLAPSE_AT,
} from './rowViewModel';

const BASE_ACTIVITY: ActivityResponse = {
  id: 42,
  displayId: 'ACT-42',
  isIssue: false,
  isConfidential: false,
  title: 'Example activity',
  summary: 'plain summary',
  significance: null,
  leadOrgId: null,
  leadOrgName: null,
  isAllDay: false,
  startDate: '2026-04-27T00:00:00.000Z',
  endDate: null,
  dateStatusId: undefined,
  startTime: '09:30',
  endTime: null,
  timeStatusId: undefined,
  venueStatusId: null,
  schedulingNotes: null,
  strategy: null,
  newsReleaseOriginId: null,
  newsReleaseId: null,
  newsReleaseDistributionId: null,
  executiveSummary: null,
  lookAheadStatus: 'none',
  lookAheadSection: 'events',
  notes: null,
  pitchDate: null,
  pitchRequiredStatusId: null,
  translationsRequiredStatusId: null,
  premierRequestedId: null,
  visibility: 'global',
  leadTeamId: 1,
  leadMinistryId: 1,
  activityStatusId: 1,
  createdBy: 1,
  lastUpdatedBy: 1,
  createdDateTime: '2026-04-20T00:00:00.000Z',
  lastUpdatedDateTime: '2026-04-20T09:15:00.000Z',
  category: [],
  tags: [],
  commsMaterials: [],
  translationsRequired: [],
  representativesAttending: [],
  sharedWith: [],
  commsContacts: [],
  leadOrg: null,
  eventPlannerDetails: [],
  eventPlanners: [],
  eventPlannerLeadIds: [],
  dateStatus: undefined,
  timeStatus: undefined,
  venueStatus: null,
  activityStatus: 'active',
  newsReleaseOrigin: null,
  newsReleaseDistribution: null,
  premierRequested: null,
  pitchRequiredStatus: null,
  translationsRequiredStatus: null,
  leadMinistry: 'Education and Child Care',
  leadMinistryAbbreviation: 'ECC',
  leadTeamDisplayName: null,
  venueAddress: null,
  reportSettings: [],
};

describe('buildTranslationsLine', () => {
  it('returns explicit none for empty / missing lists', () => {
    expect(buildTranslationsLine(null)).toBe('Translations: none');
    expect(buildTranslationsLine(undefined)).toBe('Translations: none');
    expect(buildTranslationsLine([])).toBe('Translations: none');
  });

  it('lists languages when fewer than the collapse threshold', () => {
    expect(buildTranslationsLine(['French', 'Punjabi'])).toBe(
      'Translations: French, Punjabi'
    );
    expect(buildTranslationsLine(['French', 'Punjabi', 'Chinese'])).toBe(
      'Translations: French, Punjabi, Chinese'
    );
  });

  it('collapses to a count at or above the threshold', () => {
    const four = ['French', 'Punjabi', 'Chinese', 'Spanish'];
    expect(four.length).toBe(TRANSLATIONS_COLLAPSE_AT);
    expect(buildTranslationsLine(four)).toBe('Translations: 4 languages');

    const five = [...four, 'German'];
    expect(buildTranslationsLine(five)).toBe('Translations: 5 languages');
  });
});

describe('toPrintRowViewModel', () => {
  it('maps core fields, resolving lead preference order and absolute href', () => {
    const row = toPrintRowViewModel(BASE_ACTIVITY, {
      activityBaseUrl: 'https://corpcal.example.gov.bc.ca/',
    });

    expect(row.activityId).toBe(42);
    expect(row.title).toBe('Example activity');
    expect(row.lead.ministryOrTeam).toBe('ECC');
    expect(row.activityLink.label).toBe('ACT-42');
    expect(row.activityLink.href).toBe(
      'https://corpcal.example.gov.bc.ca/activity/42'
    );
    expect(row.dateTime.startTime).toBe('9:30 am');
    expect(row.dateTime.lookAheadStatus).toBeNull();
  });

  it('falls back from ministry abbreviation to full ministry to team display name', () => {
    const onlyTeam = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        leadMinistry: null,
        leadMinistryAbbreviation: null,
        leadTeamDisplayName: 'Corporate Communications',
      },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(onlyTeam.lead.ministryOrTeam).toBe('Corporate Communications');

    const noLead = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        leadMinistry: null,
        leadMinistryAbbreviation: null,
        leadTeamDisplayName: null,
      },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(noLead.lead.ministryOrTeam).toBeNull();
  });

  it('normalises look-ahead status to badge variants', () => {
    const asNew = toPrintRowViewModel(
      { ...BASE_ACTIVITY, lookAheadStatus: 'new' },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(asNew.dateTime.lookAheadStatus).toBe('new');

    const asChanged = toPrintRowViewModel(
      { ...BASE_ACTIVITY, lookAheadStatus: 'changed' },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(asChanged.dateTime.lookAheadStatus).toBe('changed');
  });

  it('derives FYI flag from the category list', () => {
    const fyi = toPrintRowViewModel(
      { ...BASE_ACTIVITY, category: ['Announcement', 'FYI'] },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(fyi.flags.isFyi).toBe(true);
  });

  it('collapses translations when 4 or more are required', () => {
    const many = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        translationsRequired: ['French', 'Punjabi', 'Chinese', 'Spanish'],
      },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(many.release.translationsLine).toBe('Translations: 4 languages');
  });

  it('fills the activity URL with numeric id when displayId is absent', () => {
    const row = toPrintRowViewModel(
      { ...BASE_ACTIVITY, displayId: null },
      { activityBaseUrl: 'http://localhost:3000' }
    );
    expect(row.activityLink.label).toBe('ACT-42');
    expect(row.activityLink.href).toBe('http://localhost:3000/activity/42');
  });

  it('omits lead org when it matches ministry, team, or ministry abbreviation', () => {
    expect(
      resolveLeadOrgForPrint({
        ...BASE_ACTIVITY,
        leadOrg: 'Education and Child Care',
        leadMinistry: 'Education and Child Care',
      })
    ).toBeNull();
    expect(
      resolveLeadOrgForPrint({
        ...BASE_ACTIVITY,
        leadOrg: 'ECC',
        leadMinistryAbbreviation: 'ECC',
        leadMinistry: 'Education and Child Care',
      })
    ).toBeNull();
    expect(
      resolveLeadOrgForPrint({
        ...BASE_ACTIVITY,
        leadOrg: 'Communications team',
        leadMinistry: null,
        leadMinistryAbbreviation: null,
        leadTeamDisplayName: 'Communications team',
      })
    ).toBeNull();
    expect(
      resolveLeadOrgForPrint({
        ...BASE_ACTIVITY,
        leadOrg: 'External partner org',
        leadMinistry: 'Housing',
      })
    ).toBe('External partner org');
  });
});

describe('compareActivitiesForPrint', () => {
  it('sorts by startTime then by title', () => {
    const a: ActivityResponse = {
      ...BASE_ACTIVITY,
      id: 1,
      startTime: '09:00',
      title: 'Beta',
    };
    const b: ActivityResponse = {
      ...BASE_ACTIVITY,
      id: 2,
      startTime: '08:00',
      title: 'Alpha',
    };
    const c: ActivityResponse = {
      ...BASE_ACTIVITY,
      id: 3,
      startTime: '09:00',
      title: 'Alpha',
    };
    const sorted = [a, b, c].sort(compareActivitiesForPrint);
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1]);
  });
});
