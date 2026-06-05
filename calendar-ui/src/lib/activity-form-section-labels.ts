/**
 * Section IDs for the activity form. Matches the logical grouping of fields.
 */
export type ActivityFormSectionId =
  | 'overview'
  | 'comms'
  | 'newsRelease'
  | 'reports'
  | 'schedule'
  | 'event'
  | 'sharing'
  | 'venue';

/**
 * User-facing labels for activity form sections. Single source of truth for section titles.
 */
export const ACTIVITY_FORM_SECTION_LABELS: Record<
  ActivityFormSectionId,
  string
> = {
  overview: 'Overview',
  comms: 'Comms',
  newsRelease: 'Release',
  reports: 'Reports',
  schedule: 'Schedule',
  event: 'Event',
  sharing: 'Sharing',
  venue: 'Venue',
};
