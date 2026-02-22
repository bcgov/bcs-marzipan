import type { ActivityFormData } from '@corpcal/shared/schemas';
import { normalizeReportSettings } from '@corpcal/shared/utils';

function toUndefinedIfEmpty<T>(arr: T[] | undefined): T[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr;
}

/**
 * Builds the request payload for creating an activity from form values.
 */
export function buildPayloadForCreate(
  data: ActivityFormData,
  formValues: ActivityFormData
): Record<string, unknown> {
  return {
    ...data,
    activityStatusId: data.activityStatusId,
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
  };
}

/**
 * Builds the request payload for updating an activity from form values.
 * Includes commsContacts (from commsContactLeadId) and normalized reportSettings.
 */
export function buildPayloadForUpdate(
  data: ActivityFormData,
  formValues: ActivityFormData
): Record<string, unknown> {
  const normalizedReportSettings = normalizeReportSettings(
    formValues.reportSettings
  );
  return {
    ...buildPayloadForCreate(data, formValues),
    commsContacts: formValues.commsContactLeadId
      ? [
          {
            userId: Number(formValues.commsContactLeadId),
            isLead: true,
          },
        ]
      : undefined,
    reportSettings: normalizedReportSettings,
  };
}
