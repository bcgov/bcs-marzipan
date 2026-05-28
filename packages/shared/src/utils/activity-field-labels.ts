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
 * Title case (each major word capitalized).
 */
export const ACTIVITY_FIELD_LABELS: Partial<
  Record<ActivityFieldLabelKey, string>
> = {
  categoryIds: 'Category',
  title: 'Title',
  summary: 'Summary',
  significance: 'Significance',
  dateStatusId: 'Date Status',
  timeStatusId: 'Time Status',
  venueStatusId: 'Venue Status',
  activityStatusId: 'Activity Status',
  leadTeamId: 'Lead Team',
  leadMinistryId: 'Lead Ministry',
  leadOrgId: 'Lead Organization',
  commsContactLeadId: 'Comms Lead',
  commsContacts: 'Comms Contacts',
  eventPlanners: 'Event Planners',
  tagIds: 'Tags',
  commsMaterialIds: 'Comms Materials',
  translationLanguageIds: 'Translation Languages',
  sharedWithTeamIds: 'Share With',
  visibility: 'Visibility',
  notes: 'Notes',
  strategy: 'Strategy',
  isIssue: 'Issue',
  isAllDay: 'All Day',
  isConfidential: 'Confidential',
  venueAddress: 'Venue Address',
  startDate: 'Start Date',
  endDate: 'End Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  pitchDate: 'Pitch Date',
  executiveSummary: 'Executive Summary',
  schedulingNotes: 'Scheduling Notes',
  lookAheadStatus: 'Look Ahead Status',
  lookAheadSection: 'Look Ahead Section',
  pitchRequiredStatusId: 'Pitch Required',
  translationsRequiredStatusId: 'Translations Required',
  newsReleaseId: 'News Release',
  newsReleaseOriginId: 'News Release Origin',
  newsReleaseDistributionId: 'News Release Distribution',
  premierRequestedId: 'Premier Requested',
  reportSettings: 'Report Settings',
  representatives: 'Representatives',
  // Clone provenance (recorded in history `changes` only)
  clonedFromActivityId: 'Cloned From Activity',
  clonedFromDisplayId: 'Cloned From Display ID',
  clonedToActivityId: 'Cloned To Activity',
  clonedToDisplayId: 'Cloned To Display ID',
  // Venue row nested fields (DB `venue_name`, etc.)
  venueName: 'Venue',
  addressLine1: 'Address',
  addressLine2: 'Address Details',
  city: 'City',
  provinceOrState: 'Province/State',
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
