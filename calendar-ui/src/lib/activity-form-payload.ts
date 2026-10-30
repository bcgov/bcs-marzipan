import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  prepareActivityFormDataForSubmit,
  type CommsMaterialReleaseFlagsById,
} from '@corpcal/shared/utils';

function toUndefinedIfEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

export type ActivityFormPayloadOptions = {
  /** Lookup ID for translation_required_statuses.name === 'required'. */
  requiredTranslationStatusId?: number;
  commsMaterialReleaseFlagsById?: CommsMaterialReleaseFlagsById;
};

export type CreatePayloadOptions = ActivityFormPayloadOptions & {
  markAsReviewed?: boolean;
};

function buildPayloadFromPrepared(
  prepared: ActivityFormData,
  preparedFormValues: ActivityFormData,
  options?: CreatePayloadOptions
): Record<string, unknown> {
  const { markAsReviewed } = options ?? {};
  const { activityStatusId: _omit, ...rest } = prepared;
  const payload: Record<string, unknown> = {
    ...rest,
    startDate: prepared.startDate ?? null,
    endDate: prepared.endDate ?? null,
    startTime: prepared.startTime ?? null,
    endTime: prepared.endTime ?? null,
    lookAheadSection: prepared.lookAheadSection ?? null,
    newsReleaseOriginId: prepared.newsReleaseOriginId ?? null,
    newsReleaseDistributionId: prepared.newsReleaseDistributionId ?? null,
    premierRequestedId: prepared.premierRequestedId ?? null,
    categoryIds: toUndefinedIfEmpty(preparedFormValues.categoryIds),
    tagIds: toUndefinedIfEmpty(preparedFormValues.tagIds),
    commsMaterialIds: toUndefinedIfEmpty(preparedFormValues.commsMaterialIds),
    translationLanguageIds: toUndefinedIfEmpty(
      preparedFormValues.translationLanguageIds
    ),
    representatives: toUndefinedIfEmpty(preparedFormValues.representatives),
    sharedWithTeamIds: toUndefinedIfEmpty(preparedFormValues.sharedWithTeamIds),
    commsContacts: toUndefinedIfEmpty(preparedFormValues.commsContacts),
  };
  if (markAsReviewed !== undefined) {
    payload.markAsReviewed = markAsReviewed;
  }
  return payload;
}

/**
 * Builds the request payload for creating an activity from form values.
 * Backend sets activityStatusId from markAsReviewed + role; do not send activityStatusId.
 */
export function buildPayloadForCreate(
  data: ActivityFormData,
  formValues: ActivityFormData,
  options?: CreatePayloadOptions
): Record<string, unknown> {
  const { markAsReviewed, ...prepareOptions } = options ?? {};
  return buildPayloadFromPrepared(
    prepareForSubmit(data, prepareOptions),
    prepareForSubmit(formValues, prepareOptions),
    { markAsReviewed }
  );
}

export type UpdatePayloadOptions = ActivityFormPayloadOptions & {
  markAsReviewed?: boolean;
  markAsCompleted?: boolean;
  /**
   * Include representatives in PATCH payload. When false, representatives are
   * omitted so unrelated saves do not send implicit clears.
   */
  includeRepresentatives?: boolean;
  /**
   * Include sharedWithTeamIds in PATCH payload, even when cleared to `[]`.
   * Without this, an intentional clear-to-empty is dropped by
   * `toUndefinedIfEmpty` and the backend treats the field as untouched.
   */
  includeSharedWithTeamIds?: boolean;
};

function prepareForSubmit(
  data: ActivityFormData,
  options?: ActivityFormPayloadOptions
): ActivityFormData {
  return prepareActivityFormDataForSubmit(data, {
    requiredTranslationStatusId: options?.requiredTranslationStatusId,
    commsMaterialReleaseFlagsById: options?.commsMaterialReleaseFlagsById,
  });
}

/**
 * Builds the request payload for updating an activity from form values.
 * Includes commsContacts when present on the form.
 * Backend computes activityStatusId from markAsReviewed/markAsCompleted + role; do not send activityStatusId.
 */
export function buildPayloadForUpdate(
  data: ActivityFormData,
  formValues: ActivityFormData,
  options?: UpdatePayloadOptions
): Record<string, unknown> {
  const {
    markAsReviewed,
    markAsCompleted,
    includeRepresentatives = true,
    includeSharedWithTeamIds = true,
    ...prepareOptions
  } = options ?? {};
  const prepared = prepareForSubmit(data, prepareOptions);
  const preparedFormValues = prepareForSubmit(formValues, prepareOptions);
  const payload: Record<string, unknown> = {
    ...buildPayloadFromPrepared(prepared, preparedFormValues),
  };
  if (includeRepresentatives) {
    // Include representatives when this update should persist representative edits,
    // including intentional clear-all (`[]`). Callers should set
    // `includeRepresentatives: false` for share/visibility-only saves to avoid implicit clears.
    payload.representatives = preparedFormValues.representatives ?? [];
  } else {
    delete payload.representatives;
  }
  if (includeSharedWithTeamIds) {
    // Send the cleared array as-is so removing the last shared team actually
    // persists; buildPayloadFromPrepared's toUndefinedIfEmpty would otherwise
    // turn `[]` into `undefined`, which the backend treats as "no change".
    payload.sharedWithTeamIds = preparedFormValues.sharedWithTeamIds ?? [];
  } else {
    delete payload.sharedWithTeamIds;
  }
  if (markAsReviewed !== undefined) {
    payload.markAsReviewed = markAsReviewed;
  }
  if (markAsCompleted !== undefined) {
    payload.markAsCompleted = markAsCompleted;
  }
  return payload;
}

/**
 * Minimal PATCH body to mark an activity reviewed (no field changes).
 * Backend sets status from `markAsReviewed` + `activities.review` permission.
 */
export function buildMarkReviewedOnlyPayload(activityHistoryNotes?: string): {
  markAsReviewed: true;
  activityHistoryNotes?: string;
} {
  return {
    markAsReviewed: true,
    ...(activityHistoryNotes ? { activityHistoryNotes } : {}),
  };
}
