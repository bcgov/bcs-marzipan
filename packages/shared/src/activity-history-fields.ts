import {
  ACTIVITY_FORM_SECTION_FIELDS,
  ACTIVITY_FORM_SECTION_IDS,
  ACTIVITY_FORM_SECTION_LABELS,
  ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS,
  type ActivityFormSectionId,
} from './activity-form-sections';
import {
  ACTIVITY_FIELD_SCOPE_CONFIG,
  ACTIVITY_FIELD_SCOPES,
  canViewActivityFieldScope,
  type ActivityFieldScope,
} from './auth/activity-field-scopes';
import type { HistoryChange } from './schemas/history.schema';
import { getActivityFieldLabel } from './utils/activity-field-labels';

/** History-only field keys still tracked in changes (not form fields). */
export const ACTIVITY_HISTORY_ONLY_TRACKED_FIELDS = [
  'flag.assigneeName',
] as const;

/** Registry-omitted form keys that still appear in activity history changes. */
export const ACTIVITY_HISTORY_OMITTED_REGISTRY_TRACKED_FIELDS = [
  'activityStatusId',
  'leadMinistryId',
  'commsContactLeadId',
] as const satisfies readonly string[];

/** Legacy stored field keys mapped to canonical filter/display keys. */
export const ACTIVITY_HISTORY_FIELD_ALIASES: Readonly<
  Record<string, readonly string[]>
> = {
  categoryIds: ['categoryIds', 'categories'],
  tagIds: ['tagIds', 'tags'],
  sharedWithTeamIds: ['sharedWithTeamIds', 'sharedWith'],
};

/** System / audit / internal keys never recorded or shown in history. */
export const ACTIVITY_HISTORY_NON_TRACKED_FIELDS: ReadonlySet<string> = new Set(
  [
    'id',
    'createdDateTime',
    'lastUpdatedDateTime',
    'rowVersion',
    'displayId',
    'createdBy',
    'lastUpdatedBy',
    'reviewedFieldSnapshot',
    'reviewedFieldSnapshotVersion',
    'newsReleaseDateTime',
    'markAsCompleted',
    'markAsReviewed',
    'activityHistoryNotes',
    // Legacy / removed product fields
    'themes',
    // Clone provenance (excluded from filter; normalize away on read/write)
    'clonedFromActivityId',
    'clonedFromDisplayId',
    'clonedToActivityId',
    'clonedToDisplayId',
  ]
);

const CANONICAL_FIELD_ORDER: string[] = [];
for (const sectionId of ACTIVITY_FORM_SECTION_IDS) {
  for (const key of ACTIVITY_FORM_SECTION_FIELDS[sectionId]) {
    CANONICAL_FIELD_ORDER.push(String(key));
  }
}
for (const key of ACTIVITY_HISTORY_OMITTED_REGISTRY_TRACKED_FIELDS) {
  CANONICAL_FIELD_ORDER.push(key);
}
for (const key of ACTIVITY_HISTORY_ONLY_TRACKED_FIELDS) {
  CANONICAL_FIELD_ORDER.push(key);
}

export const ACTIVITY_HISTORY_FILTER_FIELD_KEYS: readonly string[] = [
  ...new Set(CANONICAL_FIELD_ORDER),
];

const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const canonical of ACTIVITY_HISTORY_FILTER_FIELD_KEYS) {
  ALIAS_TO_CANONICAL.set(canonical, canonical);
}
for (const [canonical, aliases] of Object.entries(
  ACTIVITY_HISTORY_FIELD_ALIASES
)) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL.set(alias, canonical);
  }
}

const FIELD_TO_SCOPE = new Map<string, ActivityFieldScope>();
for (const scope of ACTIVITY_FIELD_SCOPES) {
  const config = ACTIVITY_FIELD_SCOPE_CONFIG[scope];
  for (const field of [...config.responseFields, ...config.requestFields]) {
    FIELD_TO_SCOPE.set(field, scope);
  }
}

export type ActivityHistoryFieldFilterSection = {
  id: ActivityFormSectionId | 'other';
  heading: string;
  fieldKeys: readonly string[];
};

export interface FieldScopeUser {
  permissions: string[];
  roleName: string;
}

export function normalizeHistoryFieldKey(field: string): string | null {
  if (!field || typeof field !== 'string') return null;
  const trimmed = field.trim();
  if (!trimmed || ACTIVITY_HISTORY_NON_TRACKED_FIELDS.has(trimmed)) {
    return null;
  }
  return ALIAS_TO_CANONICAL.get(trimmed) ?? null;
}

export function expandHistoryFieldKeysForMatch(
  canonicalFields: readonly string[]
): string[] {
  const expanded = new Set<string>();
  for (const canonical of canonicalFields) {
    const aliases = ACTIVITY_HISTORY_FIELD_ALIASES[canonical];
    if (aliases) {
      for (const alias of aliases) {
        expanded.add(alias);
      }
    } else {
      expanded.add(canonical);
    }
  }
  return [...expanded];
}

export function canViewHistoryField(
  field: string,
  user: FieldScopeUser
): boolean {
  const canonical = normalizeHistoryFieldKey(field);
  if (!canonical) return false;
  const scope = FIELD_TO_SCOPE.get(canonical);
  if (!scope) return true;
  return canViewActivityFieldScope(user, scope);
}

export function getViewableActivityHistoryFieldKeys(
  user: FieldScopeUser
): readonly string[] {
  return ACTIVITY_HISTORY_FILTER_FIELD_KEYS.filter((field) =>
    canViewHistoryField(field, user)
  );
}

const OMITTED_REGISTRY_FIELD_SECTION: Partial<
  Record<
    (typeof ACTIVITY_HISTORY_OMITTED_REGISTRY_TRACKED_FIELDS)[number],
    ActivityFormSectionId
  >
> = {
  activityStatusId: 'overview',
  leadMinistryId: 'overview',
  commsContactLeadId: 'comms',
};

export function buildActivityHistoryFieldFilterSections(
  user: FieldScopeUser
): ActivityHistoryFieldFilterSection[] {
  const viewable = new Set(getViewableActivityHistoryFieldKeys(user));
  const sectionsById = new Map<ActivityFormSectionId | 'other', string[]>();

  for (const sectionId of ACTIVITY_FORM_SECTION_IDS) {
    sectionsById.set(sectionId, []);
  }
  sectionsById.set('other', []);

  for (const sectionId of ACTIVITY_FORM_SECTION_IDS) {
    for (const key of ACTIVITY_FORM_SECTION_FIELDS[sectionId]) {
      const fieldKey = String(key);
      if (viewable.has(fieldKey)) {
        sectionsById.get(sectionId)?.push(fieldKey);
      }
    }
  }

  for (const key of ACTIVITY_HISTORY_OMITTED_REGISTRY_TRACKED_FIELDS) {
    if (!viewable.has(key)) continue;
    const sectionId = OMITTED_REGISTRY_FIELD_SECTION[key] ?? 'other';
    sectionsById.get(sectionId)?.push(key);
  }

  for (const key of ACTIVITY_HISTORY_ONLY_TRACKED_FIELDS) {
    if (viewable.has(key)) {
      sectionsById.get('other')?.push(key);
    }
  }

  const sections: ActivityHistoryFieldFilterSection[] = [];
  for (const sectionId of ACTIVITY_FORM_SECTION_IDS) {
    const fieldKeys = sectionsById.get(sectionId) ?? [];
    if (fieldKeys.length > 0) {
      sections.push({
        id: sectionId,
        heading: ACTIVITY_FORM_SECTION_LABELS[sectionId],
        fieldKeys,
      });
    }
  }

  const otherKeys = sectionsById.get('other') ?? [];
  if (otherKeys.length > 0) {
    sections.push({
      id: 'other',
      heading: 'Other',
      fieldKeys: otherKeys,
    });
  }

  return sections;
}

export function getActivityHistoryFieldLabel(field: string): string {
  if (field === 'flag.assigneeName') return 'Flagged for review';
  return getActivityFieldLabel(field);
}

export function normalizeHistoryChanges(
  changes: HistoryChange[] | null | undefined
): HistoryChange[] {
  if (!changes || !Array.isArray(changes)) return [];

  const byField = new Map<string, HistoryChange>();
  for (const change of changes) {
    const canonical = normalizeHistoryFieldKey(change.field);
    if (!canonical) continue;
    byField.set(canonical, {
      field: canonical,
      oldValue: change.oldValue,
      newValue: change.newValue,
    });
  }

  return [...byField.values()];
}

export function redactActivityHistoryChanges(
  changes: HistoryChange[] | null | undefined,
  user: FieldScopeUser
): HistoryChange[] {
  return normalizeHistoryChanges(changes).filter((change) =>
    canViewHistoryField(change.field, user)
  );
}

export function historyEntryHasMatchingFieldChange(
  changes: HistoryChange[] | null | undefined,
  selectedCanonicalFields: readonly string[],
  user: FieldScopeUser
): boolean {
  if (selectedCanonicalFields.length === 0) return true;
  const selected = new Set(selectedCanonicalFields);
  const normalized = redactActivityHistoryChanges(changes, user);
  return normalized.some((change) => selected.has(change.field));
}

export function historyEntryMatchesFieldFilter(
  changes: HistoryChange[] | null | undefined,
  selectedCanonicalFields: readonly string[],
  user: FieldScopeUser
): boolean {
  if (selectedCanonicalFields.length === 0) return true;
  if (!changes || changes.length === 0) return false;
  return historyEntryHasMatchingFieldChange(
    changes,
    selectedCanonicalFields,
    user
  );
}

/** Keys from {@link ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS} excluded from history tracking. */
export const ACTIVITY_HISTORY_REGISTRY_OMITTED_UNTRACKED = [
  'markAsCompleted',
  'markAsReviewed',
  'activityHistoryNotes',
] as const;

void ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS;
