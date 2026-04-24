import { z } from 'zod';

import type { ActivityFormData } from './activity.schema';

/**
 * Clone Activity Schemas
 *
 * Defines the request contract for cloning an existing activity into a new
 * draft. The clone endpoint takes a source activity id (from the URL) and a
 * small body that captures the fields the user re-enters in the clone modal
 * plus an explicit inventory of which other source fields to copy.
 */

// ============================================================================
// Title prefix helpers
// ============================================================================

/**
 * Prefix prepended to the source title when opening the clone modal so users
 * can immediately identify cloned drafts. The space is intentional so the
 * final title reads naturally (e.g. "CLONED Budget announcement").
 */
export const CLONE_TITLE_PREFIX = 'CLONED ' as const;

/** Matches the `title` max length in `activityCoreFieldsSchema`. */
export const CLONE_TITLE_MAX_LENGTH = 255;

/**
 * Builds the default title for a clone. When the prefix plus source title
 * exceeds the server-side 255 char cap we truncate the source title (rather
 * than failing validation). Re-cloning stacks prefixes; the same truncation
 * rule applies to the combined string.
 */
export function buildClonedTitle(
  sourceTitle: string | null | undefined
): string {
  const source = (sourceTitle ?? '').trim();
  const combined = `${CLONE_TITLE_PREFIX}${source}`;
  if (combined.length <= CLONE_TITLE_MAX_LENGTH) {
    return combined;
  }
  const available = CLONE_TITLE_MAX_LENGTH - CLONE_TITLE_PREFIX.length;
  if (available <= 0) {
    return CLONE_TITLE_PREFIX.slice(0, CLONE_TITLE_MAX_LENGTH);
  }
  return `${CLONE_TITLE_PREFIX}${source.slice(0, available)}`;
}

// ============================================================================
// Field path inventories
// ============================================================================

/**
 * Schedule fields rendered directly in the clone modal. Users enter these
 * explicitly; they are never copied from the source activity.
 */
export const CLONE_MODAL_SCHEDULE_FIELD_KEYS = [
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'isAllDay',
  'dateStatusId',
  'timeStatusId',
] as const satisfies readonly (keyof ActivityFormData)[];

export type CloneModalScheduleFieldKey =
  (typeof CLONE_MODAL_SCHEDULE_FIELD_KEYS)[number];

/**
 * Source fields that must never be carried over to a clone. Mirrors the
 * scopes listed in the product spec: look ahead, pitch, translations, and
 * pitchDate are always reset to their create-time defaults.
 */
export const CLONE_NEVER_COPIED_FIELD_KEYS = [
  'lookAheadStatus',
  'lookAheadSection',
  'executiveSummary',
  'pitchRequiredStatusId',
  'pitchDate',
  'translationsRequiredStatusId',
  'translationLanguageIds',
] as const satisfies readonly (keyof ActivityFormData)[];

export type CloneNeverCopiedFieldKey =
  (typeof CLONE_NEVER_COPIED_FIELD_KEYS)[number];

/**
 * Audit/system fields that are owned by the backend and never part of the
 * clone payload. Mirrors the shape of `EXCLUDED_FIELDS` in
 * `activity-review-diff.ts`.
 */
export const CLONE_SYSTEM_FIELD_KEYS = [
  'activityStatusId',
  'markAsReviewed',
  'markAsCompleted',
  'activityHistoryNotes',
  'commsContactLeadId',
  'leadMinistryId',
] as const;

export type CloneSystemFieldKey = (typeof CLONE_SYSTEM_FIELD_KEYS)[number];

/**
 * Section identifiers used to group the advanced field list in the clone
 * modal. These match the form section labels used elsewhere in the UI.
 */
export const CLONE_ADVANCED_SECTIONS = [
  'overview',
  'comms',
  'reports',
  'schedule',
  'event',
  'sharing',
] as const;

export type CloneAdvancedSection = (typeof CLONE_ADVANCED_SECTIONS)[number];

/**
 * Advanced field inventory for the clone modal, grouped by form section.
 * Each entry is a top-level `ActivityFormData` key (or dotted path) that
 * the user can toggle on/off before confirming the clone.
 *
 * Keys are excluded when they:
 * - appear in `CLONE_MODAL_SCHEDULE_FIELD_KEYS` (handled in the modal)
 * - appear in `CLONE_NEVER_COPIED_FIELD_KEYS` (never carried over)
 * - appear in `CLONE_SYSTEM_FIELD_KEYS` (owned by the server)
 * - are required on create (title, categoryIds, leadTeamId, summary,
 *   commsContacts) — always copied or re-entered, never optional
 */
export const CLONE_ADVANCED_FIELD_GROUPS: Record<
  CloneAdvancedSection,
  readonly string[]
> = {
  overview: [
    'leadOrgId',
    'isConfidential',
    'isIssue',
    'significance',
    'notes',
    'tagIds',
  ],
  comms: [
    'strategy',
    'commsMaterialIds',
    'newsReleaseOriginId',
    'newsReleaseDistributionId',
  ],
  reports: ['reportSettings'],
  schedule: ['schedulingNotes'],
  event: [
    'premierRequestedId',
    'representatives',
    'venueStatusId',
    'venueAddress',
    'eventPlanners',
  ],
  sharing: ['visibility', 'sharedWithTeamIds'],
} as const;

/** Flat list of all advanced field paths a user may toggle. */
export const CLONE_ADVANCED_FIELD_PATHS: readonly string[] =
  CLONE_ADVANCED_SECTIONS.flatMap(
    (section) => CLONE_ADVANCED_FIELD_GROUPS[section]
  );

/**
 * Fields that are always copied on clone (required on create, and not in the
 * modal). The server applies these regardless of `includeFieldPaths`.
 */
export const CLONE_ALWAYS_COPIED_FIELD_KEYS = [
  'categoryIds',
  'leadTeamId',
  'summary',
  'commsContacts',
] as const satisfies readonly (keyof ActivityFormData)[];

export type CloneAlwaysCopiedFieldKey =
  (typeof CLONE_ALWAYS_COPIED_FIELD_KEYS)[number];

/**
 * Allowed values the server will accept in `includeFieldPaths`. Anything
 * outside this set is dropped during clone (a strict Zod enum would make
 * schema evolution painful across client/server rollouts).
 */
export const CLONE_ALLOWED_INCLUDE_PATHS: ReadonlySet<string> = new Set<string>(
  CLONE_ADVANCED_FIELD_PATHS
);

// ============================================================================
// Request schema
// ============================================================================

/**
 * Body for `POST /activities/:id/clone`. `id` comes from the URL.
 *
 * The schedule fields mirror the optionality used in
 * `activityCoreFieldsSchema`: dates / times are optional strings, while the
 * status ids are optional so the server can substitute lookup-based defaults
 * when the client omits them.
 *
 * `includeFieldPaths`: when omitted, the server does not apply the allow-list
 * (advanced fields follow the source after permission stripping). When present,
 * it restricts which optional advanced fields are copied.
 */
export const cloneActivityRequestSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(CLONE_TITLE_MAX_LENGTH)
    .describe('Title for the new activity, typically prefixed (e.g. CLONED).'),

  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  startTime: z.string().time().nullable().optional(),
  endTime: z.string().time().nullable().optional(),
  isAllDay: z.boolean().optional(),
  dateStatusId: z.number().int().optional(),
  timeStatusId: z.number().int().optional(),

  includeFieldPaths: z
    .array(z.string().min(1))
    .optional()
    .describe(
      'When omitted, the allow-list is not applied and optional advanced fields are taken from the source (after field-level write rules). When present, only listed server-allowed paths are copied; other optional advanced fields are dropped. Unknown path strings are ignored. The in-app UI always sends an explicit array.'
    ),

  markAsReviewed: z
    .boolean()
    .optional()
    .describe(
      'When true and the user has activities.review, initial status is Reviewed (same as create). Otherwise initial status is New. Ignored for initial status when the user cannot review.'
    ),

  activityHistoryNotes: z
    .string()
    .max(1000)
    .optional()
    .describe(
      'Optional note recorded on the new activity created history and the source cloned history.'
    ),
});

export type CloneActivityRequest = z.infer<typeof cloneActivityRequestSchema>;
