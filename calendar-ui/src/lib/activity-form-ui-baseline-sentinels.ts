import type { ActivityFormData } from '@corpcal/shared/schemas';
import { EMPTY_RICH_TEXT_DOC } from '@corpcal/shared/utils';

function emptyStringBaseline(
  value: string | undefined | null
): ActivityFormData['notes'] {
  return value ?? '';
}

function emptyRichTextBaseline(
  value: string | undefined | null
): ActivityFormData['summary'] {
  return value ?? EMPTY_RICH_TEXT_DOC;
}

/**
 * Optional plain-text Textarea fields: canonicalize collapses empty to
 * `undefined`, but native `onChange` stores `''`.
 */
export const UI_BASELINE_EMPTY_STRING_FIELDS = [
  'notes',
  'schedulingNotes',
  'strategy',
] as const satisfies readonly (keyof ActivityFormData)[];

/**
 * Rich-text fields: canonicalize collapses empty optional values to
 * `undefined`, but TipTap `onChange` stores `EMPTY_RICH_TEXT_DOC` JSON.
 */
export const UI_BASELINE_EMPTY_RICH_TEXT_FIELDS = [
  'significance',
  'executiveSummary',
  'summary',
] as const satisfies readonly (keyof ActivityFormData)[];

export type UiBaselineSentinelField =
  | (typeof UI_BASELINE_EMPTY_STRING_FIELDS)[number]
  | (typeof UI_BASELINE_EMPTY_RICH_TEXT_FIELDS)[number];

/** Fields that need an explicit hydrate override after canonicalize. */
export const UI_BASELINE_SENTINEL_FIELDS = [
  ...UI_BASELINE_EMPTY_STRING_FIELDS,
  ...UI_BASELINE_EMPTY_RICH_TEXT_FIELDS,
] as const satisfies readonly UiBaselineSentinelField[];

/**
 * Per-field baseline sentinels applied on top of {@link canonicalizeActivityFormData}
 * so RHF `reset()` matches what controls store after mount/interaction.
 */
export const UI_BASELINE_FIELD_SENTINELS: {
  readonly [K in UiBaselineSentinelField]: (
    value: ActivityFormData[K] | null | undefined
  ) => ActivityFormData[K];
} = {
  notes: emptyStringBaseline,
  schedulingNotes: emptyStringBaseline,
  strategy: emptyStringBaseline,
  significance: emptyRichTextBaseline,
  executiveSummary: emptyRichTextBaseline,
  summary: emptyRichTextBaseline,
};

/** Expected empty baseline per sentinel field (for tests and docs). */
export const UI_BASELINE_SENTINEL_VALUES: {
  readonly [K in UiBaselineSentinelField]: ActivityFormData[K];
} = {
  notes: '',
  schedulingNotes: '',
  strategy: '',
  significance: EMPTY_RICH_TEXT_DOC,
  executiveSummary: EMPTY_RICH_TEXT_DOC,
  summary: EMPTY_RICH_TEXT_DOC,
};

/**
 * Field categories that already match UI bindings via canonicalize + mapper alone.
 * No entry in {@link UI_BASELINE_FIELD_SENTINELS} is required.
 */
export const UI_BASELINE_CANONICAL_ONLY_FIELD_CATEGORIES = [
  {
    category: 'Optional IDs / enums (Radix Select, RadioGroup)',
    emptyShape: 'undefined',
    examples:
      'venueStatusId, lookAheadStatus, lookAheadSection, activityStatusId, …',
  },
  {
    category: 'Optional dates / times (ScheduledDatePopoverField)',
    emptyShape: 'undefined',
    examples: 'startDate, endDate, startTime, endTime, pitchDate',
  },
  {
    category: 'Optional string IDs cleared via Select',
    emptyShape: 'undefined',
    examples: 'leadOrgName, newsReleaseId',
  },
  {
    category: 'ID arrays (Combobox multi-select)',
    emptyShape: '[]',
    examples:
      'categoryIds, tagIds, commsMaterialIds, translationLanguageIds, sharedWithTeamIds',
  },
  {
    category: 'Object arrays',
    emptyShape: '[]',
    examples: 'eventPlanners, representatives, commsContacts, reportSettings',
  },
  {
    category: 'Booleans',
    emptyShape: 'false',
    examples: 'isAllDay, isIssue, isConfidential',
  },
  {
    category: 'Nested venue address',
    emptyShape: 'null per key',
    examples: 'venueAddress.venueName, venueAddress.city, …',
  },
] as const;

function applySentinelForField<K extends UiBaselineSentinelField>(
  out: ActivityFormData,
  canon: ActivityFormData,
  field: K
): void {
  out[field] = UI_BASELINE_FIELD_SENTINELS[field](canon[field]);
}

export function applyUiBaselineSentinels(
  canon: ActivityFormData
): ActivityFormData {
  const out = { ...canon };
  for (const field of UI_BASELINE_SENTINEL_FIELDS) {
    applySentinelForField(out, canon, field);
  }
  return out;
}
