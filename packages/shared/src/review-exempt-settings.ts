import {
  ACTIVITY_FORM_SECTION_FIELDS,
  ACTIVITY_FORM_SECTION_IDS,
  ACTIVITY_FORM_SECTION_LABELS,
  type ActivityFormSectionId,
} from './activity-form-sections';
import type { ActivityFormData } from './schemas/activity.schema';

export type ReviewExemptConfigurableSection = {
  readonly id: ActivityFormSectionId;
  readonly title: string;
  readonly keys: readonly (keyof ActivityFormData)[];
};

/**
 * `application_settings.key` for JSON array of admin-configurable review-exempt
 * top-level form field names.
 */
export const ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING =
  'activity_review_exempt_field_keys' as const;

/**
 * When no row exists or JSON is invalid, the server and diff defaults use this
 * list (must match the config seed in packages/database/config-data).
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
 * Admin UI + server allowlist, grouped from {@link ACTIVITY_FORM_SECTION_FIELDS}.
 * Omits {@link ACTIVITY_REVIEW_EXEMPT_CODE_KEYS}. See `docs/ACTIVITY_FORM_SECTIONS.md`.
 */
export const ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS: readonly ReviewExemptConfigurableSection[] =
  ACTIVITY_FORM_SECTION_IDS.map((id) => ({
    id,
    title: ACTIVITY_FORM_SECTION_LABELS[id],
    keys: ACTIVITY_FORM_SECTION_FIELDS[id].filter(
      (key) => !ACTIVITY_REVIEW_EXEMPT_CODE_KEYS.has(String(key))
    ),
  })).filter((section) => section.keys.length > 0);

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
