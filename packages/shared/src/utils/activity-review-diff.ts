import type { ActivityFormData } from '../schemas/activity.schema';
import { canonicalizeActivityFormData } from './activity-form-canonicalize';
import { normalizeVenueAddressForForm } from './activity-form-mapper';
import { EMPTY_RICH_TEXT_DOC } from './activity-rich-text';
import { isDeepEqual } from './isDeepEqual';

/**
 * Fields excluded from the review diff: audit/system columns that are never
 * user-editable or are set exclusively by the backend.
 */
const EXCLUDED_FIELDS: ReadonlySet<string> = new Set([
  'activityStatusId',
  'markAsReviewed',
  'activityHistoryNotes',
  'commsContactLeadId',
  'leadMinistryId',
]);

/**
 * Top-level {@link ActivityFormData} keys that editors may change without
 * counting as a "review impact": they do not appear in
 * {@link diffReviewFields} output and do not flip a Reviewed activity to
 * Changed on save. Editors still see RHF dirty state and "Changed" badges for
 * these fields; the exemption is purely about review workflow.
 *
 * Extend this set when product expands the rule to additional fields.
 */
export const ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS: ReadonlySet<string> = new Set([
  'visibility',
  'sharedWithTeamIds',
]);

/**
 * Canonical empty baseline representing a brand-new form with no data.
 * Used when no prior Reviewed snapshot exists (e.g. New activities).
 */
export function getEmptyReviewBaseline(): ActivityFormData {
  return canonicalizeActivityFormData({
    title: '',
    summary: EMPTY_RICH_TEXT_DOC,
    dateStatusId: 0,
    timeStatusId: 0,
    isIssue: false,
    isAllDay: false,
    isConfidential: false,
    visibility: 'global',
    leadTeamId: 0,
    categoryIds: [],
    tagIds: [],
    commsMaterialIds: [],
    translationLanguageIds: [],
    sharedWithTeamIds: [],
    venueAddress: normalizeVenueAddressForForm(null),
    commsContacts: [],
    eventPlanners: [],
    representatives: [],
    reportSettings: [],
  } as ActivityFormData);
}

/**
 * Builds the storable snapshot from form data by canonicalizing it.
 * The result is a plain object safe for JSONB storage.
 */
export function buildReviewSnapshot(
  formData: ActivityFormData
): ActivityFormData {
  return canonicalizeActivityFormData(formData);
}

/** Sort an array of numbers for stable comparison. */
function sortedIds(arr: unknown): number[] {
  if (!Array.isArray(arr)) return [];
  const list = arr as readonly unknown[];
  return list
    .filter((x): x is number => typeof x === 'number')
    .sort((a, b) => a - b);
}

/**
 * String key for sorting unknown snapshot values without String(object).
 * Primitives use explicit rules; other values use JSON for stable tie-breaks.
 */
function sortKeyToString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  return JSON.stringify(v);
}

function compareSortKey(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (a == null && b == null) return 0;
  if (a == null || a === undefined) return -1;
  if (b == null || b === undefined) return 1;
  if (typeof a === 'boolean' && typeof b === 'boolean')
    return Number(a) - Number(b);
  return sortKeyToString(a).localeCompare(sortKeyToString(b));
}

/** Sort object arrays by a stable key for order-independent comparison. */
function sortObjectArray<T extends Record<string, unknown>>(
  arr: unknown,
  key: string
): T[] {
  if (!Array.isArray(arr)) return [];
  return (arr as readonly T[]).slice().sort((a, b) => {
    return compareSortKey(a[key], b[key]);
  });
}

/**
 * Compares two canonicalized snapshots and returns the list of dotted field
 * paths that differ. These paths align with RHF field names used in the UI.
 *
 * ID arrays are compared order-independently; object arrays (commsContacts,
 * eventPlanners, representatives, reportSettings) are sorted by their primary
 * key before comparison.
 */
export function diffReviewFields(
  current: ActivityFormData,
  baseline: ActivityFormData
): string[] {
  const changed: string[] = [];
  const currentCanon = canonicalizeActivityFormData(current);
  const baselineCanon = canonicalizeActivityFormData(baseline);

  const allKeys = new Set([
    ...Object.keys(currentCanon),
    ...Object.keys(baselineCanon),
  ]);

  for (const key of allKeys) {
    if (EXCLUDED_FIELDS.has(key)) continue;
    if (ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS.has(key)) continue;

    const curVal = (currentCanon as Record<string, unknown>)[key];
    const baseVal = (baselineCanon as Record<string, unknown>)[key];

    if (key === 'venueAddress') {
      diffVenueAddress(curVal, baseVal, changed);
      continue;
    }

    if (isIdArrayField(key)) {
      if (!isDeepEqual(sortedIds(curVal), sortedIds(baseVal))) {
        changed.push(key);
      }
      continue;
    }

    if (isObjectArrayField(key)) {
      const sortKey = OBJECT_ARRAY_SORT_KEYS[key] ?? 'userId';
      if (
        !isDeepEqual(
          sortObjectArray(curVal, sortKey),
          sortObjectArray(baseVal, sortKey)
        )
      ) {
        changed.push(key);
      }
      continue;
    }

    if (!isDeepEqual(curVal, baseVal)) {
      changed.push(key);
    }
  }

  return changed;
}

const ID_ARRAY_FIELDS: ReadonlySet<string> = new Set([
  'categoryIds',
  'tagIds',
  'commsMaterialIds',
  'translationLanguageIds',
  'sharedWithTeamIds',
]);

const OBJECT_ARRAY_SORT_KEYS: Record<string, string> = {
  commsContacts: 'userId',
  eventPlanners: 'eventPlannerId',
  representatives: 'representativeName',
  reportSettings: 'reportId',
};

function isIdArrayField(key: string): boolean {
  return ID_ARRAY_FIELDS.has(key);
}

function isObjectArrayField(key: string): boolean {
  return key in OBJECT_ARRAY_SORT_KEYS;
}

const VENUE_ADDRESS_KEYS = [
  'venueName',
  'addressLine1',
  'addressLine2',
  'city',
  'provinceOrState',
  'country',
] as const;

function diffVenueAddress(
  curVal: unknown,
  baseVal: unknown,
  changed: string[]
): void {
  const cur = (curVal ?? {}) as Record<string, unknown>;
  const base = (baseVal ?? {}) as Record<string, unknown>;
  for (const subKey of VENUE_ADDRESS_KEYS) {
    if (!isDeepEqual(cur[subKey], base[subKey])) {
      changed.push(`venueAddress.${subKey}`);
    }
  }
}
