/**
 * Activity field-level permission scopes.
 *
 * Maps each restricted scope to the DTO/response field paths it governs
 * and provides shared view/edit helpers used by both UI and service layers.
 *
 * View rule (scopes with a view permission): has <scope>.view OR <scope>.edit OR role is
 * Advanced Viewer / Advanced Editor / Admin / System Admin.
 * Scopes without a view permission (dateTimeStatus, translations) are always visible; edit is still gated.
 * Edit rule: has <scope>.edit only (no role bypass).
 */

import { PERMISSIONS, SYSTEM_ROLES } from './constants';

export const ACTIVITY_FIELD_SCOPES = [
  'notes',
  'dateTimeStatus',
  'lookAhead',
  'translations',
  'pitch',
] as const;

export type ActivityFieldScope = (typeof ACTIVITY_FIELD_SCOPES)[number];

interface ScopeDefinition {
  /** When null, the scope is not redacted on read (everyone with activity access may view). */
  viewKey: string | null;
  editKey: string;
  /** DB/DTO field paths on ActivityResponse that belong to this scope. */
  responseFields: readonly string[];
  /** Request DTO field paths (create/update) that belong to this scope. */
  requestFields: readonly string[];
}

export const ACTIVITY_FIELD_SCOPE_CONFIG: Record<
  ActivityFieldScope,
  ScopeDefinition
> = {
  notes: {
    viewKey: PERMISSIONS.ACTIVITIES.NOTES_VIEW,
    editKey: PERMISSIONS.ACTIVITIES.NOTES_EDIT,
    responseFields: ['notes'],
    requestFields: ['notes'],
  },
  dateTimeStatus: {
    viewKey: null,
    editKey: PERMISSIONS.ACTIVITIES.DATE_TIME_STATUS_EDIT,
    responseFields: [
      'dateStatusId',
      'timeStatusId',
      'dateStatus',
      'timeStatus',
    ],
    requestFields: ['dateStatusId', 'timeStatusId'],
  },
  lookAhead: {
    viewKey: PERMISSIONS.ACTIVITIES.LOOK_AHEAD_VIEW,
    editKey: PERMISSIONS.ACTIVITIES.LOOK_AHEAD_EDIT,
    responseFields: ['lookAheadStatus', 'lookAheadSection'],
    requestFields: ['lookAheadStatus', 'lookAheadSection'],
  },
  translations: {
    viewKey: null,
    editKey: PERMISSIONS.ACTIVITIES.TRANSLATIONS_EDIT,
    responseFields: [
      'translationsRequiredStatusId',
      'translationsRequiredStatus',
      'translationsRequired',
    ],
    requestFields: ['translationsRequiredStatusId', 'translationLanguageIds'],
  },
  pitch: {
    viewKey: PERMISSIONS.ACTIVITIES.PITCH_VIEW,
    editKey: PERMISSIONS.ACTIVITIES.PITCH_EDIT,
    responseFields: [
      'pitchRequiredStatusId',
      'pitchRequiredStatus',
      'pitchDate',
    ],
    requestFields: ['pitchRequiredStatusId', 'pitchDate'],
  },
} as const;

const ROLES_WITH_FIELD_VIEW_BYPASS: readonly string[] = [
  SYSTEM_ROLES.ADVANCED_VIEWER,
  SYSTEM_ROLES.ADVANCED_EDITOR,
  SYSTEM_ROLES.ADMIN,
  SYSTEM_ROLES.SYSTEM_ADMIN,
];

interface FieldScopeUser {
  permissions: string[];
  roleName: string;
}

export function canViewActivityFieldScope(
  user: FieldScopeUser,
  scope: ActivityFieldScope
): boolean {
  const config = ACTIVITY_FIELD_SCOPE_CONFIG[scope];
  if (config.viewKey === null) return true;
  if (user.permissions.includes(config.viewKey)) return true;
  if (user.permissions.includes(config.editKey)) return true;
  if (ROLES_WITH_FIELD_VIEW_BYPASS.includes(user.roleName)) return true;
  return false;
}

export function canEditActivityFieldScope(
  user: FieldScopeUser,
  scope: ActivityFieldScope
): boolean {
  return user.permissions.includes(ACTIVITY_FIELD_SCOPE_CONFIG[scope].editKey);
}

/**
 * Returns the set of scopes the user can view.
 */
export function getViewableFieldScopes(
  user: FieldScopeUser
): Set<ActivityFieldScope> {
  const result = new Set<ActivityFieldScope>();
  for (const scope of ACTIVITY_FIELD_SCOPES) {
    if (canViewActivityFieldScope(user, scope)) result.add(scope);
  }
  return result;
}

/**
 * Returns the set of scopes the user can edit.
 */
export function getEditableFieldScopes(
  user: FieldScopeUser
): Set<ActivityFieldScope> {
  const result = new Set<ActivityFieldScope>();
  for (const scope of ACTIVITY_FIELD_SCOPES) {
    if (canEditActivityFieldScope(user, scope)) result.add(scope);
  }
  return result;
}
