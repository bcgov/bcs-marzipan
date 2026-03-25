import type { ActivityFormData } from '@corpcal/shared/schemas';
import { normalizeReportSettings } from '@corpcal/shared/utils';

function toUndefinedIfEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

export type CreatePayloadOptions = {
  markAsReviewed?: boolean;
};

/**
 * Builds the request payload for creating an activity from form values.
 * Backend sets activityStatusId from markAsReviewed + role; do not send activityStatusId.
 */
export function buildPayloadForCreate(
  data: ActivityFormData,
  formValues: ActivityFormData,
  options?: CreatePayloadOptions
): Record<string, unknown> {
  const { markAsReviewed } = options ?? {};
  const { activityStatusId: _omit, ...rest } = data;
  const payload: Record<string, unknown> = {
    ...rest,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    startTime: data.startTime ?? null,
    endTime: data.endTime ?? null,
    categoryIds: toUndefinedIfEmpty(formValues.categoryIds),
    tagIds: toUndefinedIfEmpty(formValues.tagIds),
    commsMaterialIds: toUndefinedIfEmpty(formValues.commsMaterialIds),
    translationLanguageIds: toUndefinedIfEmpty(
      formValues.translationLanguageIds
    ),
    representatives: toUndefinedIfEmpty(formValues.representatives),
    sharedWithTeamIds: toUndefinedIfEmpty(formValues.sharedWithTeamIds),
    commsContacts: toUndefinedIfEmpty(formValues.commsContacts),
  };
  if (markAsReviewed !== undefined) {
    payload.markAsReviewed = markAsReviewed;
  }
  return payload;
}

export type UpdatePayloadOptions = {
  markAsReviewed?: boolean;
};

/**
 * Builds the request payload for updating an activity from form values.
 * Includes commsContacts and normalized reportSettings.
 * Backend computes activityStatusId from markAsReviewed + role; do not send activityStatusId.
 */
export function buildPayloadForUpdate(
  data: ActivityFormData,
  formValues: ActivityFormData,
  options?: UpdatePayloadOptions
): Record<string, unknown> {
  const normalizedReportSettings = normalizeReportSettings(
    formValues.reportSettings
  );
  const { markAsReviewed } = options ?? {};
  const payload: Record<string, unknown> = {
    ...buildPayloadForCreate(data, formValues),
    reportSettings: normalizedReportSettings,
  };
  if (markAsReviewed !== undefined) {
    payload.markAsReviewed = markAsReviewed;
  }
  return payload;
}
