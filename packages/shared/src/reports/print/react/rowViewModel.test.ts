import { describe, expect, it, vi } from 'vitest';

import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import {
  buildTranslationsLine,
  compareActivitiesForPrint,
  resolveLeadOrgForPrint,
  splitActivityDisplayIdForPrint,
  toPrintRowViewModel,
  TRANSLATIONS_COLLAPSE_AT,
} from './rowViewModel';
import { buildTranslationLanguageLabelResolver } from './translationLanguageDisplayLabels';

const TEST_TRANSLATION_RESOLVER = buildTranslationLanguageLabelResolver([
  { shortcode: 'FR', displayName: 'French' },
  { shortcode: 'PUN', displayName: 'Punjabi' },
  { shortcode: 'SC', displayName: 'Chinese (Simplified)' },
  { shortcode: 'SPA', displayName: 'Spanish' },
]);

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
  flags: [],
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
  const REFERENCE = new Date('2026-05-21T12:00:00.000Z');

  it('sets confidential flag on the row view-model', () => {
    const row = toPrintRowViewModel(
      { ...BASE_ACTIVITY, isConfidential: true },
      { activityBaseUrl: 'http://localhost:3000', variant: 'lookAhead' }
    );
    expect(row.flags.isConfidential).toBe(true);
  });

  it('formats start dates with calendar year unless dateCellStyle is shortNoYear', () => {
    const dated = {
      ...BASE_ACTIVITY,
      startDate: '2026-04-27',
      endDate: null,
    };

    const withYear = toPrintRowViewModel(dated, {
      activityBaseUrl: 'http://localhost:3000',
    });
    expect(withYear.dateTime.startDate).toContain('Apr 27');
    expect(withYear.dateTime.startDate).toContain('2026');

    const noYear = toPrintRowViewModel(dated, {
      activityBaseUrl: 'http://localhost:3000',
      dateCellStyle: 'shortNoYear',
    });
    expect(noYear.dateTime.startDate).toBe('Apr 27');
    expect(noYear.dateTime.startDate).not.toContain('2026');
    expect(noYear.dateTime.endDate).toBe('');
  });

  it('formats look-ahead date ranges with compact rules when dateCellStyle is shortNoYear', () => {
    vi.useFakeTimers();
    vi.setSystemTime(REFERENCE);

    const ranged = {
      ...BASE_ACTIVITY,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    const row = toPrintRowViewModel(ranged, {
      activityBaseUrl: 'http://localhost:3000',
      dateCellStyle: 'shortNoYear',
    });
    expect(row.dateTime.startDate).toBe('Jan 1\u201331');
    expect(row.dateTime.endDate).toBe('');

    vi.useRealTimers();
  });

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

  it('uses an all-day label instead of a formatted start time', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        isAllDay: true,
        startDate: '2026-04-27T00:00:00.000Z',
        startTime: null,
      },
      { activityBaseUrl: 'http://localhost:3000' }
    );

    expect(row.dateTime.startTime).toBe('All day');
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

  it('maps date/time status for look-ahead print variants (Confirmed hidden, else TBC when date/time present)', () => {
    const unsettled = {
      ...BASE_ACTIVITY,
      dateStatus: 'Tentative',
      timeStatus: 'Proposed',
    };

    const lookAhead = toPrintRowViewModel(unsettled, {
      activityBaseUrl: 'http://localhost:3000',
      variant: 'lookAhead',
    });
    expect(lookAhead.dateTime.dateStatus).toBe('TBC');
    expect(lookAhead.dateTime.timeStatus).toBe('TBC');

    const execLa = toPrintRowViewModel(unsettled, {
      activityBaseUrl: 'http://localhost:3000',
      variant: 'execLookAhead',
    });
    expect(execLa.dateTime.dateStatus).toBe('TBC');
    expect(execLa.dateTime.timeStatus).toBe('TBC');

    const confirmed = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        dateStatus: 'Confirmed',
        timeStatus: 'confirmed',
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(confirmed.dateTime.dateStatus).toBe('');
    expect(confirmed.dateTime.timeStatus).toBe('');

    const noDateOrTime = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        startDate: null,
        startTime: null,
        dateStatus: 'Tentative',
        timeStatus: 'Proposed',
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(noDateOrTime.dateTime.startDate).toBe('');
    expect(noDateOrTime.dateTime.startTime).toBe('');
    expect(noDateOrTime.dateTime.dateStatus).toBe('');
    expect(noDateOrTime.dateTime.timeStatus).toBe('');

    const thirty = toPrintRowViewModel(unsettled, {
      activityBaseUrl: 'http://localhost:3000',
      variant: 'thirtySixtyNinety',
    });
    expect(thirty.dateTime.dateStatus).toBe('Tentative');
    expect(thirty.dateTime.timeStatus).toBe('Proposed');
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

  it('omits look-ahead translations when not Release category and no news release origin', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Announcement'],
        newsReleaseOrigin: null,
        translationsRequired: ['French'],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(row.release.translationsLine).toBe('');
  });

  it('includes look-ahead translations when category is Release', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Release'],
        newsReleaseOrigin: null,
        translationsRequired: ['French'],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(row.release.translationsLine).toBe('French');
  });

  it('maps translation shortcodes to display names on look-ahead', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Release'],
        newsReleaseOrigin: null,
        translationsRequired: ['FR', 'PUN'],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
        resolveTranslationLanguageLabel: TEST_TRANSLATION_RESOLVER,
      }
    );
    expect(row.release.translationsLine).toBe('French, Punjabi');
  });

  it('collapses look-ahead translations to a count at four or more', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Release'],
        newsReleaseOrigin: null,
        translationsRequired: ['FR', 'PUN', 'SC', 'SPA'],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
        resolveTranslationLanguageLabel: TEST_TRANSLATION_RESOLVER,
      }
    );
    expect(row.release.translationsLine).toBe('4 translations');
  });

  it('uses TBD on look-ahead when translation status is pending review and no languages', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Release'],
        translationsRequiredStatus: 'Pending review',
        translationsRequired: [],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(row.release.translationsLine).toBe('TBD');
  });

  it('uses TBD when translation status uses internal pending name', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Release'],
        translationsRequiredStatus: 'pending',
        translationsRequired: [],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(row.release.translationsLine).toBe('TBD');
  });

  it('still lists languages on look-ahead when pending review but languages exist', () => {
    const row = toPrintRowViewModel(
      {
        ...BASE_ACTIVITY,
        category: ['Release'],
        translationsRequiredStatus: 'Pending review',
        translationsRequired: ['French'],
      },
      {
        activityBaseUrl: 'http://localhost:3000',
        variant: 'lookAhead',
      }
    );
    expect(row.release.translationsLine).toBe('French');
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

describe('splitActivityDisplayIdForPrint', () => {
  it('splits PREFIX-NUMERIC display ids', () => {
    expect(splitActivityDisplayIdForPrint('MOTT-123456')).toEqual({
      acronym: 'MOTT',
      idForLink: '123456',
    });
    expect(splitActivityDisplayIdForPrint('ACT-000042')).toEqual({
      acronym: 'ACT',
      idForLink: '000042',
    });
  });

  it('puts the whole label in the link when no hyphen', () => {
    expect(splitActivityDisplayIdForPrint('ACT42')).toEqual({
      acronym: '',
      idForLink: 'ACT42',
    });
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
