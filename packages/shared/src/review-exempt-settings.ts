import type { ActivityFormData } from './schemas/activity.schema';

/**
 * `application_settings.key` for JSON array of admin-configurable review-exempt
 * top-level form field names.
 */
export const ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING =
  'activity_review_exempt_field_keys' as const;

/**
 * When no row exists or JSON is invalid, the server and diff defaults use this
 * list (must match the seed in packages/database/seeds).
 */
export const DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS = [
  'visibility',
  'sharedWithTeamIds',
] as const satisfies ReadonlyArray<keyof ActivityFormData>;

/**
 * Top-level form keys that are always review-exempt (not admin-toggleable).
 * Merged with configurable keys from application settings.
 */
export const ACTIVITY_REVIEW_EXEMPT_CODE_KEYS: ReadonlySet<string> = new Set([
  'summary',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'isAllDay',
  'dateStatusId',
  'timeStatusId',
  'venueStatusId',
  'pitchDate',
]);

/**
 * Admin UI + server allowlist, grouped to mirror {@link ActivityFormBody} section
 * order (left: Overview, Comms; right: Reports, Schedule, Event, Sharing).
 * Keep in sync when form sections or top-level field sets change.
 */
export const ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS = [
  {
    id: 'overview' as const,
    title: 'Overview',
    keys: [
      'title',
      'categoryIds',
      'tagIds',
      'leadTeamId',
      'leadOrgId',
      'significance',
      'isIssue',
      'isConfidential',
      'notes',
      'pitchRequiredStatusId',
    ] as const satisfies ReadonlyArray<keyof ActivityFormData>,
  },
  {
    id: 'comms' as const,
    title: 'Comms',
    keys: [
      'commsContacts',
      'strategy',
      'commsMaterialIds',
      'newsReleaseId',
      'newsReleaseOriginId',
      'newsReleaseDistributionId',
      'translationsRequiredStatusId',
      'translationLanguageIds',
    ] as const satisfies ReadonlyArray<keyof ActivityFormData>,
  },
  {
    id: 'reports' as const,
    title: 'Reports',
    keys: [
      'reportSettings',
      'executiveSummary',
      'lookAheadStatus',
      'lookAheadSection',
    ] as const satisfies ReadonlyArray<keyof ActivityFormData>,
  },
  {
    id: 'schedule' as const,
    title: 'Schedule',
    keys: ['schedulingNotes'] as const satisfies ReadonlyArray<
      keyof ActivityFormData
    >,
  },
  {
    id: 'event' as const,
    title: 'Event',
    keys: [
      'venueAddress',
      'premierRequestedId',
      'representatives',
      'eventPlanners',
    ] as const satisfies ReadonlyArray<keyof ActivityFormData>,
  },
  {
    id: 'sharing' as const,
    title: 'Sharing',
    keys: ['visibility', 'sharedWithTeamIds'] as const satisfies ReadonlyArray<
      keyof ActivityFormData
    >,
  },
] as const;

const CONFIGURABLE_FLAT: string[] = [];
for (const s of ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS) {
  for (const k of s.keys) {
    CONFIGURABLE_FLAT.push(k);
  }
}

export const ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_SET: ReadonlySet<string> =
  new Set(CONFIGURABLE_FLAT);

/** Flat allowlist in stable order (section order) for zod/validation. */
export const ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEYS: readonly string[] =
  CONFIGURABLE_FLAT;

const ZOD_ENUM = ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEYS as [
  string,
  ...string[],
];

/**
 * Merges code-exempt keys with allowlisted configurable keys (typically from DB).
 * Unknown strings are dropped.
 */
export function buildEffectiveReviewExemptKeys(
  configurableFromDb: readonly string[]
): Set<string> {
  const out = new Set<string>(ACTIVITY_REVIEW_EXEMPT_CODE_KEYS);
  for (const k of configurableFromDb) {
    if (ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_SET.has(k)) {
      out.add(k);
    }
  }
  return out;
}

/**
 * For `z.enum` — all configurable keys as a non-empty string tuple.
 */
export const ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_ENUM_TUPLE =
  ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEYS as [string, ...string[]];
