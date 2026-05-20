import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  normalizeReportSettings,
  prepareActivityFormDataForSubmit,
} from '@corpcal/shared/utils';

function toUndefinedIfEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

export type CreatePayloadOptions = {
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
  return buildPayloadFromPrepared(
    prepareActivityFormDataForSubmit(data),
    prepareActivityFormDataForSubmit(formValues),
    options
  );
}

export type UpdatePayloadOptions = {
  markAsReviewed?: boolean;
  markAsCompleted?: boolean;
};

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
  const prepared = prepareActivityFormDataForSubmit(data);
  const preparedFormValues = prepareActivityFormDataForSubmit(formValues);
  const normalizedReportSettings = normalizeReportSettings(
    preparedFormValues.reportSettings
  );
  const { markAsReviewed, markAsCompleted } = options ?? {};
  const payload: Record<string, unknown> = {
    ...buildPayloadFromPrepared(prepared, preparedFormValues),
    reportSettings: normalizedReportSettings,
  };
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
