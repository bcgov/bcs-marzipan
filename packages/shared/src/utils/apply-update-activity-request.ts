import type {
  ActivityFormData,
  UpdateActivityRequest,
} from '../schemas/activity.schema';

/**
 * Keys on {@link UpdateActivityRequest} that are workflow intents rather than
 * form fields. They must never be merged into the form-data representation
 * used for review-diff comparisons.
 */
const NON_FORM_DTO_KEYS: ReadonlySet<string> = new Set([
  'markAsReviewed',
  'markAsCompleted',
]);

/**
 * Applies a partial {@link UpdateActivityRequest} on top of a baseline
 * {@link ActivityFormData} and returns the resulting post-update form shape.
 *
 * Used server-side to diff "before" and "after" form representations with
 * {@link diffReviewFields} using identical normalisation rules, without
 * needing a second database round-trip to re-hydrate the updated row.
 *
 * Only own DTO keys whose value is not `undefined` overwrite the baseline.
 * Workflow-intent keys ({@link NON_FORM_DTO_KEYS}) are ignored.
 */
export function applyUpdateActivityRequestToFormData(
  base: ActivityFormData,
  dto: UpdateActivityRequest
): ActivityFormData {
  const merged: Record<string, unknown> = { ...base };
  for (const key of Object.keys(dto)) {
    if (NON_FORM_DTO_KEYS.has(key)) continue;
    const value = (dto as Record<string, unknown>)[key];
    if (value === undefined) continue;
    merged[key] = value;
  }
  return merged as ActivityFormData;
}
