import { describe, expect, it } from 'vitest';

import { NEWS_RELEASE_ORIGIN_IDS } from './constants';
import { inferNewsReleaseOriginId } from './infer-news-release-origin-id';
import type { NewsReleaseOriginInferenceOrg } from './resolve-form-organizations';

function org(
  partial: Partial<NewsReleaseOriginInferenceOrg> &
    Pick<NewsReleaseOriginInferenceOrg, 'isLead'>
): NewsReleaseOriginInferenceOrg {
  return {
    organizationId: null,
    organizationName: null,
    jurisdiction: null,
    organizationTypeId: null,
    ...partial,
  };
}

describe('inferNewsReleaseOriginId', () => {
  it('returns TBD when no organizations', () => {
    expect(inferNewsReleaseOriginId([])).toBe(NEWS_RELEASE_ORIGIN_IDS.tbd);
  });

  it('returns TBD when no lead organization', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 2,
          isLead: false,
          jurisdiction: 'bcgov',
          organizationTypeId: 1,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.tbd);
  });

  it('returns ministry release for bcgov ministry lead only', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 2,
          isLead: true,
          jurisdiction: 'bcgov',
          organizationTypeId: 1,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.ministryRelease);
  });

  it('returns 3rd party for bcgov non-ministry lead only', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 26,
          isLead: true,
          jurisdiction: 'bcgov',
          organizationTypeId: 4,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.thirdParty);
  });

  it('returns joint federal when a joint org is federal', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 2,
          isLead: true,
          jurisdiction: 'bcgov',
          organizationTypeId: 1,
        }),
        org({
          organizationId: 56,
          isLead: false,
          jurisdiction: 'federal',
          organizationTypeId: 2,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.jointMinistryFederal);
  });

  it('returns joint federal when the lead org is federal and a joint is present', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 56,
          isLead: true,
          jurisdiction: 'federal',
          organizationTypeId: 2,
        }),
        org({
          organizationId: 2,
          isLead: false,
          jurisdiction: 'bcgov',
          organizationTypeId: 1,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.jointMinistryFederal);
  });

  it('returns joint 3rd party when joints exist and no federal org is involved', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 2,
          isLead: true,
          jurisdiction: 'bcgov',
          organizationTypeId: 1,
        }),
        org({
          organizationId: 64,
          isLead: false,
          jurisdiction: 'local_government',
          organizationTypeId: 7,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.jointMinistry3rdParty);
  });

  it('returns 3rd party for freeform lead name without catalog id', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: null,
          organizationName: 'Partner org',
          isLead: true,
          jurisdiction: null,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.thirdParty);
  });

  it('returns federal for federal lead only', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 56,
          isLead: true,
          jurisdiction: 'federal',
          organizationTypeId: 2,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.federal);
  });

  it('returns local government for local government lead only', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 64,
          isLead: true,
          jurisdiction: 'local_government',
          organizationTypeId: 7,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.localGovernment);
  });

  it('returns 3rd party for provincial lead only', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 99,
          isLead: true,
          jurisdiction: 'provincial',
          organizationTypeId: 2,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.thirdParty);
  });

  it('returns 3rd party for other jurisdiction when no rule matches', () => {
    expect(
      inferNewsReleaseOriginId([
        org({
          organizationId: 100,
          isLead: true,
          jurisdiction: 'other',
          organizationTypeId: 4,
        }),
      ])
    ).toBe(NEWS_RELEASE_ORIGIN_IDS.thirdParty);
  });
});
