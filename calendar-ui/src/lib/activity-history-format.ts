import type { HistoryChange } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  canonicalizeActivityFormData,
  getActivityFieldLabel as getSharedFieldLabel,
  isDeepEqual,
  plainTextFromActivityRichField,
} from '@corpcal/shared/utils';

/**
 * Shared formatting utilities for displaying activity history changes.
 * Used by both the ActivityHistory drawer and confirmation modals.
 */

const ACTION_TEXT_MAP: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  reviewed: 'Reviewed',
  deleted: 'Deleted',
  delete_requested: 'Delete requested',
  soft_deleted: 'Deleted',
  restored: 'Restored',
  changes_cancelled: 'Changes cancelled',
  note_added: 'Note added',
  'note added': 'Note added',
  comment_added: 'Comment added',
  assigned: 'Assigned',
  unassigned: 'Unassigned',
  status_changed: 'Status changed',
  comms_lead_transferred: 'Transferred',
  cloned: 'Cloned',
};

export function getActionText(actionType: string): string {
  if (!actionType) return '';
  const raw = String(actionType);
  const lower = raw.toLowerCase();

  if (ACTION_TEXT_MAP[lower]) return ACTION_TEXT_MAP[lower];

  const spaced = raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Label for a field in history/changelog. Uses shared activity field labels.
 */
export function getHistoryFieldLabel(field: string): string {
  return getSharedFieldLabel(field);
}

export type StatusLookupMap = Map<number | string, string>;

export interface LookupMaps {
  dateStatusMap?: StatusLookupMap;
  venueStatusMap?: StatusLookupMap;
  activityStatusMap?: StatusLookupMap;
  timeStatusMap?: StatusLookupMap;
  pitchRequiredStatusMap?: StatusLookupMap;
  translationsRequiredStatusMap?: StatusLookupMap;
  newsReleaseOriginMap?: StatusLookupMap;
  newsReleaseDistributionMap?: StatusLookupMap;
  premierRequestedMap?: StatusLookupMap;
}

export function formatHistoryFieldValue(
  field: string,
  value: unknown,
  lookupMaps?: LookupMaps
): string {
  if (value === null || value === undefined || value === '') {
    return '(empty)';
  }

  if (
    (field === 'summary' ||
      field === 'executiveSummary' ||
      field === 'significance') &&
    typeof value === 'string'
  ) {
    const t = plainTextFromActivityRichField(value);
    return t === '' ? '(empty)' : t;
  }

  if (
    field === 'dateStatusId' &&
    typeof value === 'number' &&
    lookupMaps?.dateStatusMap
  ) {
    return lookupMaps.dateStatusMap.get(value) || String(value);
  }

  if (
    field === 'venueStatusId' &&
    typeof value === 'number' &&
    lookupMaps?.venueStatusMap
  ) {
    return lookupMaps.venueStatusMap.get(value) || String(value);
  }

  if (
    field === 'activityStatusId' &&
    typeof value === 'number' &&
    lookupMaps?.activityStatusMap
  ) {
    return lookupMaps.activityStatusMap.get(value) || String(value);
  }

  if (
    field === 'timeStatusId' &&
    typeof value === 'number' &&
    lookupMaps?.timeStatusMap
  ) {
    return lookupMaps.timeStatusMap.get(value) || String(value);
  }

  if (
    field === 'pitchRequiredStatusId' &&
    typeof value === 'number' &&
    lookupMaps?.pitchRequiredStatusMap
  ) {
    return lookupMaps.pitchRequiredStatusMap.get(value) || String(value);
  }

  if (
    field === 'translationsRequiredStatusId' &&
    typeof value === 'number' &&
    lookupMaps?.translationsRequiredStatusMap
  ) {
    return lookupMaps.translationsRequiredStatusMap.get(value) || String(value);
  }

  if (
    field === 'newsReleaseOriginId' &&
    typeof value === 'number' &&
    lookupMaps?.newsReleaseOriginMap
  ) {
    return lookupMaps.newsReleaseOriginMap.get(value) || String(value);
  }

  if (
    field === 'newsReleaseDistributionId' &&
    typeof value === 'number' &&
    lookupMaps?.newsReleaseDistributionMap
  ) {
    return lookupMaps.newsReleaseDistributionMap.get(value) || String(value);
  }

  if (
    field === 'premierRequestedId' &&
    typeof value === 'number' &&
    lookupMaps?.premierRequestedMap
  ) {
    return lookupMaps.premierRequestedMap.get(value) || String(value);
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (field === 'venueAddress') {
    const addr = value as Record<string, unknown>;
    const parts = [];
    if (typeof addr.venueName === 'string') parts.push(addr.venueName);
    if (typeof addr.addressLine1 === 'string') parts.push(addr.addressLine1);
    if (typeof addr.addressLine2 === 'string') parts.push(addr.addressLine2);
    if (typeof addr.city === 'string') parts.push(addr.city);
    if (typeof addr.provinceOrState === 'string')
      parts.push(addr.provinceOrState);
    if (typeof addr.country === 'string') parts.push(addr.country);
    return parts.length > 0 ? parts.join(', ') : '(address)';
  }

  if (field === 'eventPlanners') {
    if (Array.isArray(value)) {
      const planners = value as Array<{
        eventPlannerId?: number;
        eventPlannerName?: string;
        isLead?: boolean;
      }>;
      const names = planners
        .map((p) => p.eventPlannerName ?? `ID ${p.eventPlannerId}`)
        .join(', ');
      return names || '(no event planners)';
    }
  }

  if (field === 'representatives') {
    if (Array.isArray(value)) {
      const reps = value as Array<{
        representativeId?: number;
        representativeName?: string;
      }>;
      const names = reps
        .map((r) => r.representativeName || `Rep ${r.representativeId}`)
        .join(', ');
      return names || '(no representatives)';
    }
  }

  if (field === 'commsContacts') {
    if (Array.isArray(value)) {
      const contacts = value as Array<{ userId?: number; isLead?: boolean }>;
      if (contacts.length === 0) return '(no contacts)';
      const leadCount = contacts.filter((c) => c.isLead).length;
      return `${contacts.length} contact(s)${leadCount > 0 ? ` (${leadCount} lead)` : ''}`;
    }
  }

  if (field === 'reportSettings') {
    if (Array.isArray(value)) {
      const settings = value as Array<{
        reportId?: number;
        omitted?: boolean;
      }>;
      if (settings.length === 0) return '(no reports)';
      const omitted = settings.filter((s) => s.omitted).length;
      const active = settings.length - omitted;
      return `${active} active, ${omitted} omitted`;
    }
  }

  if (Array.isArray(value)) {
    return `${value.length} item(s)`;
  }

  return JSON.stringify(value);
}

/**
 * Keys intentionally excluded from form comparison.
 * activityHistoryNotes is edit metadata (the "reason for change" note),
 * not a user-editable data field.
 * markAsReviewed / markAsCompleted are submit flags; status is compared via activityStatusId.
 * commsContactLeadId is legacy UI convenience; lead is represented via commsContacts.
 */
type ExcludedFromCompare =
  | 'activityHistoryNotes'
  | 'markAsReviewed'
  | 'markAsCompleted'
  | 'commsContactLeadId';

const FIELDS_TO_COMPARE = [
  'title',
  'summary',
  'significance',
  'schedulingNotes',
  'strategy',
  'dateStatusId',
  'timeStatusId',
  'venueStatusId',
  'activityStatusId',
  'isIssue',
  'isAllDay',
  'isConfidential',
  'visibility',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'pitchDate',
  'notes',
  'executiveSummary',
  'pitchRequiredStatusId',
  'translationsRequiredStatusId',
  'lookAheadStatus',
  'lookAheadSection',
  'leadOrgId',
  'leadOrgName',
  'leadTeamId',
  'leadMinistryId',
  'eventPlanners',
  'newsReleaseDistributionId',
  'premierRequestedId',
  'newsReleaseId',
  'newsReleaseOriginId',
  'categoryIds',
  'tagIds',
  'commsMaterialIds',
  'translationLanguageIds',
  'sharedWithTeamIds',
  'venueAddress',
  'representatives',
  'commsContacts',
  'reportSettings',
] as const satisfies readonly (keyof ActivityFormData)[];

type ComparableFormKey = Exclude<keyof ActivityFormData, ExcludedFromCompare>;
type CompareKey = (typeof FIELDS_TO_COMPARE)[number];
type _AssertNoMissingKeys =
  Exclude<ComparableFormKey, CompareKey> extends never
    ? true
    : { missingFromCompare: Exclude<ComparableFormKey, CompareKey> };
const _exhaustiveFieldCheck: _AssertNoMissingKeys = true;

/**
 * Computes form-level changes between initial and current ActivityFormData.
 * Returns an array of HistoryChange for display in the edit confirmation modal.
 */
export function computeFormChanges(
  initial: ActivityFormData,
  current: ActivityFormData
): HistoryChange[] {
  const changes: HistoryChange[] = [];
  const initialC = canonicalizeActivityFormData(initial);
  const currentC = canonicalizeActivityFormData(current);

  for (const field of FIELDS_TO_COMPARE) {
    const oldVal = initialC[field];
    const newVal = currentC[field];
    if (!isDeepEqual(oldVal, newVal)) {
      changes.push({
        field,
        oldValue: oldVal ?? null,
        newValue: newVal ?? null,
      });
    }
  }

  return changes;
}
