import { describe, expect, it } from 'vitest';

import { createMockActivityResponse } from '@corpcal/shared/test-utils';
import { EMPTY_RICH_TEXT_DOC } from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';
import { hydrateActivityFormData } from './activity-form-hydrate';

const mockLookups: FormLookupData = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  pitchStatuses: [],
  pitchRequiredStatuses: [],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [],
  premierRequested: [],
  newsReleaseOrigins: [],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

describe('hydrateActivityFormData', () => {
  it('uses UI sentinels for empty optional text and rich text fields', () => {
    const activity = createMockActivityResponse({
      notes: null,
      schedulingNotes: null,
      strategy: null,
      significance: null,
      executiveSummary: null,
      summary: '',
    });

    const data = hydrateActivityFormData(activity, mockLookups);

    expect(data.notes).toBe('');
    expect(data.schedulingNotes).toBe('');
    expect(data.strategy).toBe('');
    expect(data.significance).toBe(EMPTY_RICH_TEXT_DOC);
    expect(data.executiveSummary).toBe(EMPTY_RICH_TEXT_DOC);
    expect(data.summary).toBe(EMPTY_RICH_TEXT_DOC);
  });
});
