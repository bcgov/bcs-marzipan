import type { ActivityFormData } from '@corpcal/shared/schemas';

/**
 * Default form values that match the ActivityFormData type.
 * Used for form initialization and reset (e.g. create flow, start fresh).
 */
export function getDefaultFormValues(): Partial<ActivityFormData> {
  return {
    isAllDay: false,
    isIssue: false,
    isConfidential: false,
    visibility: 'global',
    categoryIds: [],
    tagIds: [],
    commsMaterialIds: [],
    commsContacts: [],
    translationLanguageIds: [],
    representatives: [],
    sharedWithTeamIds: [],
    reportSettings: [],
    activityStatusId: 1,
    dateStatusId: 1,
    timeStatusId: 1,
    pitchRequiredStatusId: 1,
    translationsRequiredStatusId: 1,
    leadTeamId: 0,
    venueStatusId: undefined,
  };
}

/** Stable default values for autosave comparison and reset. */
export const DEFAULT_FORM_VALUES = getDefaultFormValues();
