import { describe, expect, it } from 'vitest';

import { NEWS_RELEASE_ORIGIN_IDS } from './constants';
import { inferNewsReleaseOriginId } from './infer-news-release-origin-id';
import type { NewsReleaseOriginInferenceOrg } from './resolve-form-organizations';

describe('inferNewsReleaseOriginId', () => {
  it('returns TBD when no lead org', () => {
    expect(inferNewsReleaseOriginId([])).toBe(NEWS_RELEASE_ORIGIN_IDS.tbd);
  });

  it('returns ministry release for bcgov ministry lead', () => {
    const orgs: NewsReleaseOriginInferenceOrg[] = [
      {
        organizationId: 2,
        organizationName: null,
        isLead: true,
        jurisdiction: 'bcgov',
        organizationTypeId: 1,
      },
    ];
    expect(inferNewsReleaseOriginId(orgs)).toBe(
      NEWS_RELEASE_ORIGIN_IDS.ministryRelease
    );
  });

  it('returns 3rd party for bcgov non-ministry lead', () => {
    const orgs: NewsReleaseOriginInferenceOrg[] = [
      {
        organizationId: 26,
        organizationName: null,
        isLead: true,
        jurisdiction: 'bcgov',
        organizationTypeId: 4,
      },
    ];
    expect(inferNewsReleaseOriginId(orgs)).toBe(
      NEWS_RELEASE_ORIGIN_IDS.thirdParty
    );
  });

  it('returns joint federal when federal is in joints', () => {
    const orgs: NewsReleaseOriginInferenceOrg[] = [
      {
        organizationId: 2,
        organizationName: null,
        isLead: true,
        jurisdiction: 'bcgov',
        organizationTypeId: 1,
      },
      {
        organizationId: 56,
        organizationName: null,
        isLead: false,
        jurisdiction: 'federal',
        organizationTypeId: 2,
      },
    ];
    expect(inferNewsReleaseOriginId(orgs)).toBe(
      NEWS_RELEASE_ORIGIN_IDS.jointMinistryFederal
    );
  });
});
