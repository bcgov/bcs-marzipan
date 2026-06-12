import type { ActivityResponse } from '../schemas/activity-response.schema';
import type { ActivityFormData } from '../schemas/activity.schema';
import { normalizeEventPlannerFormEntries } from './activity-form-event-planner-normalize';
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
 *
 * **Dual role:** calendar-ui `hydrateActivityFormData` also runs this before
 * `applyUiBaselineSentinels`. A semantic change here affects dirty/diff,
 * submit payloads (`prepareActivityFormDataForSubmit`), and edit-form hydration —
 * update `activity-form-hydrate.test.ts` and `ACTIVITY_FORM_FIELD_UPDATES.md` together.
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
    significance:
      isNullishOrEmptyString(data.significance) ||
      isActivityRichTextEffectivelyEmpty(data.significance)
        ? undefined
        : data.significance,
    schedulingNotes: canonOptString(data.schedulingNotes),
    strategy: canonOptString(data.strategy),
    notes: canonOptString(data.notes),
    executiveSummary:
      isNullishOrEmptyString(data.executiveSummary) ||
      isActivityRichTextEffectivelyEmpty(data.executiveSummary)
        ? undefined
        : data.executiveSummary,
    startDate: canonOptString(data.startDate),
    endDate: canonOptString(data.endDate),
    startTime: canonOptString(data.startTime),
    endTime: canonOptString(data.endTime),
    pitchDate: canonOptString(data.pitchDate),
    leadOrgName: canonOptString(data.leadOrgName),
    newsReleaseId: canonOptString(data.newsReleaseId),
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
    eventPlanners: normalizeEventPlannerFormEntries(data.eventPlanners),
    representatives: canonObjectArray(data.representatives),
    commsContacts: canonObjectArray(data.commsContacts),
    reportSettings: canonObjectArray(data.reportSettings),
  };
}

/**
 * Normalizes hydrated form values for create/update API payloads.
 *
 * Applies {@link canonicalizeActivityFormData} so UI-only sentinels (`''`,
 * `EMPTY_RICH_TEXT_DOC` on optional rich fields) do not get persisted when
 * saving unrelated changes, then maps effectively-empty optional nullable
 * fields to `null` for the request body.
 */
export function prepareActivityFormDataForSubmit(
  data: ActivityFormData
): ActivityFormData {
  const c = canonicalizeActivityFormData(data);
  return {
    ...c,
    notes: c.notes ?? null,
    schedulingNotes: c.schedulingNotes ?? null,
    strategy: c.strategy ?? null,
    significance: c.significance ?? null,
    executiveSummary: c.executiveSummary ?? null,
    lookAheadSection: c.lookAheadSection ?? null,
  };
}
