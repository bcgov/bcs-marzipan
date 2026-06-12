import type { ActivityFormData } from './schemas/activity.schema';

/**
 * Canonical activity form section registry.
 *
 * Single source of truth for section order, labels, and top-level field membership.
 * Mirrors `ActivityFormBody` in calendar-ui and the `Activity*Section` components.
 *
 * Downstream consumers derive their groupings from here:
 * - Review-exempt admin UI — `ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS` in
 *   `review-exempt-settings.ts` (filters out code-exempt keys).
 * - Clone modal advanced options — `CLONE_ADVANCED_*` in `clone-activity.schema.ts`
 *   (filters out clone-specific exclusions).
 *
 * When the form changes, update this file first, then the matching section component
 * in `calendar-ui/src/components/activity/ActivityFormSections/`. See
 * `packages/shared/docs/ACTIVITY_FORM_SECTIONS.md`.
 */

/** Section order as rendered in the activity form (left column, then right). */
export const ACTIVITY_FORM_SECTION_IDS = [
  'overview',
  'comms',
  'reports',
  'schedule',
  'newsRelease',
  'event',
  'sharing',
] as const;

export type ActivityFormSectionId = (typeof ACTIVITY_FORM_SECTION_IDS)[number];

/** User-facing section titles. */
export const ACTIVITY_FORM_SECTION_LABELS: Record<
  ActivityFormSectionId,
  string
> = {
  overview: 'Overview',
  comms: 'Comms',
  reports: 'Reports',
  schedule: 'Schedule',
  newsRelease: 'Release',
  event: 'Event',
  sharing: 'Sharing',
};

/**
 * Top-level `ActivityFormData` keys owned by each section.
 * Include code-exempt or clone-excluded keys here for completeness; consumers filter.
 */
export const ACTIVITY_FORM_SECTION_FIELDS: Record<
  ActivityFormSectionId,
  readonly (keyof ActivityFormData)[]
> = {
  overview: [
    'title',
    'categoryIds',
    'tagIds',
    'leadTeamId',
    'leadOrgId',
    'leadOrgName',
    'significance',
    'isIssue',
    'isConfidential',
    'summary',
    'notes',
    'pitchRequiredStatusId',
    'pitchDate',
  ],
  comms: ['commsContacts', 'strategy', 'commsMaterialIds'],
  reports: [
    'reportSettings',
    'executiveSummary',
    'lookAheadStatus',
    'lookAheadSection',
  ],
  schedule: [
    'startDate',
    'endDate',
    'startTime',
    'endTime',
    'isAllDay',
    'dateStatusId',
    'timeStatusId',
    'schedulingNotes',
  ],
  newsRelease: [
    'newsReleaseId',
    'newsReleaseOriginId',
    'newsReleaseDistributionId',
    'translationsRequiredStatusId',
    'translationLanguageIds',
  ],
  event: [
    'venueStatusId',
    'venueAddress',
    'premierRequestedId',
    'representatives',
    'eventPlanners',
  ],
  sharing: ['visibility', 'sharedWithTeamIds'],
};

/**
 * Top-level `ActivityFormData` keys intentionally omitted from the section registry.
 * System-owned, derived, or UI-only convenience fields — not grouped in the form.
 */
export const ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS = [
  'activityStatusId',
  'markAsCompleted',
  'markAsReviewed',
  'activityHistoryNotes',
  'commsContactLeadId',
  'leadMinistryId',
] as const satisfies readonly (keyof ActivityFormData)[];

/** Flat list of all section field keys in section order (each key appears at most once). */
export function getActivityFormSectionFieldKeys(): readonly string[] {
  const keys: string[] = [];
  for (const id of ACTIVITY_FORM_SECTION_IDS) {
    for (const key of ACTIVITY_FORM_SECTION_FIELDS[id]) {
      keys.push(String(key));
    }
  }
  return keys;
}

/** Set of all keys listed in {@link ACTIVITY_FORM_SECTION_FIELDS}. */
export function getActivityFormSectionFieldKeySet(): ReadonlySet<string> {
  return new Set(getActivityFormSectionFieldKeys());
}
