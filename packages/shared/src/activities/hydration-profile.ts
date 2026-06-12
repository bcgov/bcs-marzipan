import {
  ALL_ACTIVITY_RELATION_KEYS,
  LIST_ACTIVITY_RELATION_KEYS,
  type ActivityRelationKey,
} from './activity-relation-registry';

export interface ActivityHydrationProfile {
  relations: ReadonlySet<ActivityRelationKey>;
  includeCanEdit?: boolean;
  includeFlags?: boolean;
  includeReviewDiff?: boolean;
}

export function createHydrationProfile(
  relations: Iterable<ActivityRelationKey>,
  options?: Omit<ActivityHydrationProfile, 'relations'>
): ActivityHydrationProfile {
  return {
    relations: new Set(relations),
    ...options,
  };
}

export function unionHydrationProfiles(
  ...profiles: ActivityHydrationProfile[]
): ActivityHydrationProfile {
  const relations = new Set<ActivityRelationKey>();
  let includeCanEdit = false;
  let includeFlags = false;
  let includeReviewDiff = false;

  for (const profile of profiles) {
    for (const key of profile.relations) {
      relations.add(key);
    }
    includeCanEdit ||= profile.includeCanEdit === true;
    includeFlags ||= profile.includeFlags === true;
    includeReviewDiff ||= profile.includeReviewDiff === true;
  }

  return {
    relations,
    ...(includeCanEdit ? { includeCanEdit: true } : {}),
    ...(includeFlags ? { includeFlags: true } : {}),
    ...(includeReviewDiff ? { includeReviewDiff: true } : {}),
  };
}

export const HYDRATION_PROFILES = {
  detail: createHydrationProfile(ALL_ACTIVITY_RELATION_KEYS, {
    includeCanEdit: true,
    includeFlags: true,
    includeReviewDiff: true,
  }),
  list: createHydrationProfile(LIST_ACTIVITY_RELATION_KEYS, {
    includeCanEdit: true,
    includeFlags: true,
  }),
  /** Base report profile; expanded per request via resolveReportHydrationProfile. */
  report: createHydrationProfile([]),
} as const satisfies Record<string, ActivityHydrationProfile>;

export function profileIncludesRelation(
  profile: ActivityHydrationProfile,
  key: ActivityRelationKey
): boolean {
  return profile.relations.has(key);
}
