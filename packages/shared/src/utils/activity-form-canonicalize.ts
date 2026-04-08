import type { ActivityResponse } from '../schemas/activity-response.schema';
import type { ActivityFormData } from '../schemas/activity.schema';
import { normalizeVenueAddressForForm } from './activity-form-mapper';
import {
  EMPTY_RICH_TEXT_DOC,
  isActivityRichTextEffectivelyEmpty,
} from './activity-rich-text';

function isNullishOrEmptyString(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

/** Empty optional text → `undefined` so `''`, `null`, and missing match RHF + compare. */
function canonOptString(v: unknown): string | undefined {
  if (isNullishOrEmptyString(v)) return undefined;
  if (typeof v === 'string') return v;
  return undefined;
}

/** Empty optional number list → `[]` so `undefined` and `[]` match. */
function canonIdArray(v: unknown): number[] {
  if (!Array.isArray(v) || v.length === 0) return [];
  return v.filter((x): x is number => typeof x === 'number');
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Keep only plain objects; drop null, arrays, and primitives so compare/dirty stays stable. */
function canonObjectArray<T extends Record<string, unknown>>(v: unknown): T[] {
  if (!Array.isArray(v) || v.length === 0) return [];
  const out: T[] = [];
  for (const item of v) {
    if (isPlainRecord(item)) {
      out.push(item as T);
    }
  }
  return out;
}

/**
 * Normalizes activity form values for consistent dirty/compare semantics:
 * - optional strings: `null` / `''` / `undefined` → `undefined`
 * - optional ID arrays: missing / `undefined` / `[]` → `[]`
 * - optional object arrays: missing / empty → `[]`
 * - venueAddress: full null-key object (see {@link normalizeVenueAddressForForm})
 *
 * Use after mapping API → form and when diffing `initialFormDataRef` vs `getValues()`.
 */
export function canonicalizeActivityFormData(
  data: ActivityFormData
): ActivityFormData {
  return {
    ...data,
    summary:
      isNullishOrEmptyString(data.summary) ||
      isActivityRichTextEffectivelyEmpty(data.summary)
        ? EMPTY_RICH_TEXT_DOC
        : data.summary,
    significance: isNullishOrEmptyString(data.significance)
      ? undefined
      : data.significance,
    schedulingNotes: canonOptString(
      data.schedulingNotes
    ) as ActivityFormData['schedulingNotes'],
    strategy: canonOptString(data.strategy) as ActivityFormData['strategy'],
    notes: canonOptString(data.notes) as ActivityFormData['notes'],
    executiveSummary:
      isNullishOrEmptyString(data.executiveSummary) ||
      isActivityRichTextEffectivelyEmpty(data.executiveSummary)
        ? undefined
        : data.executiveSummary,
    startDate: canonOptString(data.startDate) as ActivityFormData['startDate'],
    endDate: canonOptString(data.endDate) as ActivityFormData['endDate'],
    startTime: canonOptString(data.startTime) as ActivityFormData['startTime'],
    endTime: canonOptString(data.endTime) as ActivityFormData['endTime'],
    pitchDate: canonOptString(data.pitchDate) as ActivityFormData['pitchDate'],
    leadOrgName: canonOptString(
      data.leadOrgName
    ) as ActivityFormData['leadOrgName'],
    newsReleaseId: canonOptString(
      data.newsReleaseId
    ) as ActivityFormData['newsReleaseId'],
    lookAheadStatus:
      data.lookAheadStatus === null || data.lookAheadStatus === undefined
        ? undefined
        : data.lookAheadStatus,
    lookAheadSection:
      data.lookAheadSection === null || data.lookAheadSection === undefined
        ? undefined
        : data.lookAheadSection,
    categoryIds: canonIdArray(data.categoryIds),
    tagIds: canonIdArray(data.tagIds),
    commsMaterialIds: canonIdArray(data.commsMaterialIds),
    translationLanguageIds: canonIdArray(data.translationLanguageIds),
    sharedWithTeamIds: canonIdArray(data.sharedWithTeamIds),
    /** Align with `mapResponseToFormData` (`?? undefined`); `null` in RHF would stay dirty vs reset. */
    venueStatusId:
      data.venueStatusId === null || data.venueStatusId === undefined
        ? undefined
        : data.venueStatusId,
    venueAddress: normalizeVenueAddressForForm(
      data.venueAddress as ActivityResponse['venueAddress']
    ),
    eventPlanners: canonObjectArray(data.eventPlanners),
    representatives: canonObjectArray(data.representatives),
    commsContacts: canonObjectArray(data.commsContacts),
    reportSettings: canonObjectArray(data.reportSettings),
  };
}
