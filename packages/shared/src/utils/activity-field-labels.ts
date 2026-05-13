import type {
  ActivityFormData,
  VenueAddressBase,
} from '../schemas/activity.schema';

/**
 * History-only keys used for clone provenance (not part of ActivityFormData).
 * Recorded in `activityHistory.changes` to link a source and its clone.
 */
export type CloneProvenanceFieldKey =
  | 'clonedFromActivityId'
  | 'clonedFromDisplayId'
  | 'clonedToActivityId'
  | 'clonedToDisplayId';

/**
 * Keys that can have a display label (form fields + nested venue address fields +
 * clone provenance fields). Typed so new ActivityFormData keys get a compile-time
 * nudge to add a label.
 */
export type ActivityFieldLabelKey =
  | keyof ActivityFormData
  | keyof VenueAddressBase
  | CloneProvenanceFieldKey;

/**
 * Form/API field keys that are required on create (matches createActivityRequestSchema
 * and comms lead rule). Visibility is omitted — it defaults to global in the schema.
 * Use for required indicators in the UI; keep in sync when validation changes.
 */
export const ACTIVITY_CREATE_REQUIRED_FIELD_KEYS = [
  'categoryIds',
  'title',
  'summary',
  'leadTeamId',
  'dateStatusId',
  'timeStatusId',
  'commsContacts',
] as const satisfies readonly (keyof ActivityFormData)[];

/**
 * User-facing labels for activity form/history field names.
 * Single source of truth for form validation messages, history changelog, confirm modals, etc.
 * Sentence case.
 */
export const ACTIVITY_FIELD_LABELS: Partial<
  Record<ActivityFieldLabelKey, string>
> = {
  categoryIds: 'Category',
  title: 'Title',
  summary: 'Summary',
  significance: 'Significance',
  dateStatusId: 'Date status',
  timeStatusId: 'Time status',
  venueStatusId: 'Venue status',
  activityStatusId: 'Activity status',
  leadTeamId: 'Lead team',
  leadMinistryId: 'Lead ministry',
  leadOrgId: 'Lead organization',
  leadOrgName: 'Lead organization name',
  commsContactLeadId: 'Comms lead',
  commsContacts: 'Comms contacts',
  eventPlanners: 'Event planners',
  tagIds: 'Tags',
  commsMaterialIds: 'Comms materials',
  translationLanguageIds: 'Translation languages',
  sharedWithTeamIds: 'Share with',
  visibility: 'Visibility',
  notes: 'Notes',
  strategy: 'Strategy',
  isIssue: 'Issue',
  isAllDay: 'All day',
  isConfidential: 'Confidential',
  venueAddress: 'Venue address',
  startDate: 'Start date',
  endDate: 'End date',
  startTime: 'Start time',
  endTime: 'End time',
  pitchDate: 'Pitch date',
  executiveSummary: 'Executive summary',
  schedulingNotes: 'Scheduling notes',
  lookAheadStatus: 'Look ahead status',
  lookAheadSection: 'Look ahead section',
  pitchRequiredStatusId: 'Pitch required',
  translationsRequiredStatusId: 'Translations required',
  newsReleaseId: 'News release',
  newsReleaseOriginId: 'News release origin',
  newsReleaseDistributionId: 'News release distribution',
  premierRequestedId: 'Premier requested',
  reportSettings: 'Report settings',
  representatives: 'Representatives',
  // Clone provenance (recorded in history `changes` only)
  clonedFromActivityId: 'Cloned from activity',
  clonedFromDisplayId: 'Cloned from display ID',
  clonedToActivityId: 'Cloned to activity',
  clonedToDisplayId: 'Cloned to display ID',
  // Venue row nested fields (DB `venue_name`, etc.)
  venueName: 'Venue',
  addressLine1: 'Address',
  addressLine2: 'Address details',
  city: 'City',
  provinceOrState: 'Province/state',
  country: 'Country',
};

function sentenceCaseFromFieldName(field: string): string {
  const spaced = field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Maps an activity field name to a user-friendly label.
 * Use for form validation messages, history/changelog display, confirm modals, and anywhere
 * activity field names are shown in the app.
 *
 * @param fieldName - Field key (e.g. from ActivityFormData or path like "venueAddress.addressLine1";
 *   use `venueName` for the venue display name field, `venueAddress` for the whole row)
 * @returns Label from map, or sentence-case fallback from the last path segment
 */
export function getActivityFieldLabel(fieldName: string): string {
  if (!fieldName || typeof fieldName !== 'string') return '';
  const key = fieldName.split('.').pop() ?? fieldName;
  const label =
    ACTIVITY_FIELD_LABELS[key as ActivityFieldLabelKey] ??
    sentenceCaseFromFieldName(key);
  return label;
}
