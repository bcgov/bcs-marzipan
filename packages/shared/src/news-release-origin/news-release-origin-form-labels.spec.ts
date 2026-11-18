import { describe, expect, it } from 'vitest';

import type { OrganizationDetail } from '../schemas/activity-response.schema';
import { NEWS_RELEASE_ORIGIN_NAMES } from './constants';
import { formatNewsReleaseOriginFormLabel } from './news-release-origin-form-labels';

function ministryLead(abbrev: string): OrganizationDetail {
  return {
    name: 'Ministry of Example',
    abbreviation: abbrev,
    isLead: true,
    jurisdiction: 'bcgov',
    organizationTypeId: 1,
  };
}

describe('formatNewsReleaseOriginFormLabel', () => {
  it('joint 3rd party uses joint placeholder when no joint orgs', () => {
    const label = formatNewsReleaseOriginFormLabel(
      {
        id: 3,
        name: NEWS_RELEASE_ORIGIN_NAMES.jointMinistry3rdParty,
        displayName: 'Joint ministry / 3rd party release',
      },
      [ministryLead('AGR')]
    );
    expect(label).toBe('Joint AGR / 3rd party release');
  });

  it('joint federal uses Federal placeholder when no joint orgs', () => {
    const label = formatNewsReleaseOriginFormLabel(
      {
        id: 4,
        name: NEWS_RELEASE_ORIGIN_NAMES.jointMinistryFederal,
        displayName: 'Joint ministry / Federal release',
      },
      [ministryLead('EDU')]
    );
    expect(label).toBe('Joint EDU / Federal release');
  });

  it('joint 3rd party uses ministry placeholder when no lead org', () => {
    const label = formatNewsReleaseOriginFormLabel(
      {
        id: 3,
        name: NEWS_RELEASE_ORIGIN_NAMES.jointMinistry3rdParty,
        displayName: 'Joint ministry / 3rd party release',
      },
      []
    );
    expect(label).toBe('Joint ministry / 3rd party release');
  });
});
