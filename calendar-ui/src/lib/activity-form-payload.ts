import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  normalizeReportSettings,
  prepareActivityFormDataForSubmit,
} from '@corpcal/shared/utils';

function toUndefinedIfEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

export type ActivityFormPayloadOptions = {
  /** Lookup ID for translation_required_statuses.name === 'required'. */
  requiredTranslationStatusId?: number;
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
  const { requiredTranslationStatusId, ...createOptions } = options ?? {};
  return buildPayloadFromPrepared(
    prepareForSubmit(data, requiredTranslationStatusId),
    prepareForSubmit(formValues, requiredTranslationStatusId),
    createOptions
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
};

function prepareForSubmit(
  data: ActivityFormData,
  requiredTranslationStatusId: number | undefined
): ActivityFormData {
  return prepareActivityFormDataForSubmit(data, {
    requiredTranslationStatusId,
  });
}

/**
 * Builds the request payload for updating an activity from form values.
 * Includes commsContacts and normalized reportSettings.
 * Backend computes activityStatusId from markAsReviewed/markAsCompleted + role; do not send activityStatusId.
 */
export function buildPayloadForUpdate(
  data: ActivityFormData,
  formValues: ActivityFormData,
  options?: UpdatePayloadOptions
): Record<string, unknown> {
  const {
    requiredTranslationStatusId,
    markAsReviewed,
    markAsCompleted,
    includeRepresentatives = true,
  } = options ?? {};
  const prepared = prepareForSubmit(data, requiredTranslationStatusId);
  const preparedFormValues = prepareForSubmit(
    formValues,
    requiredTranslationStatusId
  );
  const normalizedReportSettings = normalizeReportSettings(
    preparedFormValues.reportSettings
  );
  const payload: Record<string, unknown> = {
    ...buildPayloadFromPrepared(prepared, preparedFormValues),
    reportSettings: normalizedReportSettings,
  };
if (includeRepresentatives) {
    // Include representatives when this update should persist representative edits,
    // including intentional clear-all (`[]`). Callers should set
    // `includeRepresentatives: false` for share/visibility-only saves to avoid implicit clears.
    payload.representatives = preparedFormValues.representatives ?? [];
  }
  } else {
    delete payload.representatives;
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
