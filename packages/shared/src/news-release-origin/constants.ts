/** Stable `news_release_origins.name` values (seed-aligned). */
export const NEWS_RELEASE_ORIGIN_NAMES = {
  tbd: 'tbd',
  ministryRelease: 'ministry release',
  jointMinistry3rdParty: 'joint ministry 3rd party release',
  jointMinistryFederal: 'joint ministry federal release',
  localGovernment: 'local government release',
  thirdParty: '3rd party release',
  federal: 'federal release',
} as const;

/** Seed ids for `news_release_origins` (see lookup seeds). */
export const NEWS_RELEASE_ORIGIN_IDS = {
  tbd: 1,
  ministryRelease: 2,
  jointMinistry3rdParty: 3,
  jointMinistryFederal: 4,
  localGovernment: 5,
  thirdParty: 6,
  federal: 7,
} as const;

export type NewsReleaseOriginName =
  (typeof NEWS_RELEASE_ORIGIN_NAMES)[keyof typeof NEWS_RELEASE_ORIGIN_NAMES];
