/**
 * Auth and RBAC constants
 * System role names, IDs, and permission keys for type-safe usage
 */

/** Cookie name for JWT access token (httpOnly, set by backend on login) */
export const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Single source of truth for system role configuration.
 * Role IDs must match the database seed data.
 */
export const SYSTEM_ROLES_CONFIG = {
  VIEWER: { id: 1, name: 'Viewer' },
  EDITOR: { id: 2, name: 'Editor' },
  ADVANCED_VIEWER: { id: 3, name: 'Advanced Viewer' },
  ADVANCED_EDITOR: { id: 4, name: 'Advanced Editor' },
  ADMIN: { id: 5, name: 'Admin' },
  SYSTEM_ADMIN: { id: 6, name: 'System Admin' },
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES_CONFIG;

/**
 * System role names mapped by key (derived from SYSTEM_ROLES_CONFIG)
 */
export const SYSTEM_ROLES = {
  VIEWER: SYSTEM_ROLES_CONFIG.VIEWER.name,
  EDITOR: SYSTEM_ROLES_CONFIG.EDITOR.name,
  ADVANCED_VIEWER: SYSTEM_ROLES_CONFIG.ADVANCED_VIEWER.name,
  ADVANCED_EDITOR: SYSTEM_ROLES_CONFIG.ADVANCED_EDITOR.name,
  ADMIN: SYSTEM_ROLES_CONFIG.ADMIN.name,
  SYSTEM_ADMIN: SYSTEM_ROLES_CONFIG.SYSTEM_ADMIN.name,
} as const;

/**
 * System role IDs mapped by key (derived from SYSTEM_ROLES_CONFIG)
 */
export const SYSTEM_ROLE_IDS = {
  VIEWER: SYSTEM_ROLES_CONFIG.VIEWER.id,
  EDITOR: SYSTEM_ROLES_CONFIG.EDITOR.id,
  ADVANCED_VIEWER: SYSTEM_ROLES_CONFIG.ADVANCED_VIEWER.id,
  ADVANCED_EDITOR: SYSTEM_ROLES_CONFIG.ADVANCED_EDITOR.id,
  ADMIN: SYSTEM_ROLES_CONFIG.ADMIN.id,
  SYSTEM_ADMIN: SYSTEM_ROLES_CONFIG.SYSTEM_ADMIN.id,
} as const;

/**
 * Role names that bypass team-based data scoping (see all activities).
 * Used when computing effective bypass from user + team roles.
 */
export const ROLES_BYPASS_DATA_SCOPING: readonly string[] = [
  SYSTEM_ROLES.ADVANCED_VIEWER,
  SYSTEM_ROLES.ADVANCED_EDITOR,
  SYSTEM_ROLES.ADMIN,
  SYSTEM_ROLES.SYSTEM_ADMIN,
] as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
export type SystemRoleId =
  (typeof SYSTEM_ROLE_IDS)[keyof typeof SYSTEM_ROLE_IDS];

/**
 * Permissions catalog for type-safe usage
 * Key format supports multiple patterns:
 *   - resource.action (e.g., activities.create, reports.export)
 *   - resource.scope.action (e.g., activities.budget.edit, activities.filter.dateRange.view)
 * The key is the source of truth. Resource, scope, and action are denormalized fields
 * for query convenience and may be null for non-standard key formats.
 */

// TODO: Initial pass only. Review and refinement required.
export const PERMISSIONS = {
  ACTIVITIES: {
    VIEW: 'activities.view',
    CREATE: 'activities.create',
    EDIT: 'activities.edit',
    DELETE: 'activities.delete',
    REQUEST_DELETE: 'activities.requestDelete',
    CREATE_ANY: 'activities.create.any',
    DELETE_ANY: 'activities.delete.any',
    APPROVE: 'activities.approve',
    REVIEW: 'activities.review',
    PUBLISH: 'activities.publish',
    UNPUBLISH: 'activities.unpublish',
    NOTES_VIEW: 'activities.notes.view',
    NOTES_EDIT: 'activities.notes.edit',
    LOOK_AHEAD_VIEW: 'activities.lookAhead.view',
    LOOK_AHEAD_EDIT: 'activities.lookAhead.edit',
    TRANSLATIONS_EDIT: 'activities.translations.edit',
    PITCH_STATUS_VIEW: 'activities.pitchStatus.view',
    PITCH_STATUS_EDIT: 'activities.pitchStatus.edit',
    PITCH_DATE_EDIT: 'activities.pitchDate.edit',
    /** Take edit lock from another user after grace period (admin). */
    LOCK_FORCE_HANDOFF: 'activities.lock.forceHandoff',
    /** Manually progress an activity to Completed status. */
    COMPLETE: 'activities.complete',
  },
  DRAFTS: {
    VIEW: 'drafts.view',
    CREATE: 'drafts.create',
    EDIT: 'drafts.edit',
    DELETE: 'drafts.delete',
    RECOVER: 'drafts.recover',
  },
  SAVED_FILTERS: {
    VIEW: 'savedFilters.view',
    CREATE: 'savedFilters.create',
    EDIT: 'savedFilters.edit',
    DELETE: 'savedFilters.delete',
    SHARE_TEAM: 'savedFilters.share.team',
    SHARE_GLOBAL: 'savedFilters.share.global',
  },
  REPORTS: {
    VIEW: 'reports.view',
    EXPORT: 'reports.export',
    CREATE_CUSTOM: 'reports.create_custom',
  },
  LOOKUPS: {
    VIEW: 'lookups.view',
    MANAGE: 'lookups.manage',
  },
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete',
    MANAGE_ROLES: 'users.manage_roles',
    TRANSFER_ACTIVITIES: 'users.transfer_activities',
  },
  TEAMS: {
    VIEW: 'teams.view',
    CREATE: 'teams.create',
    EDIT: 'teams.edit',
    DELETE: 'teams.delete',
  },
  SETTINGS: {
    VIEW: 'settings.view',
    MANAGE: 'settings.manage',
    /** Configure automated activity completion (schedule, buffer). System Admin only. */
    MANAGE_ACTIVITY_COMPLETE: 'settings.manage.activity_complete',
  },
  SYSTEM: {
    VIEW_LOGS: 'system.view_logs',
    MANAGE_PERMISSIONS: 'system.manage_permissions',
  },
} as const;

/**
 * Extract all permission string values as a union type from PERMISSIONS constant.
 * Results in: 'activities.view' | 'activities.create' | ... | 'system.manage_permissions'
 *
 * Uses a conditional type to properly distribute over the union of category objects,
 * extracting all values from each category and unioning them together.
 */
type PermissionCategory = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
type ExtractValues<T> = T extends Record<string, string> ? T[keyof T] : never;
export type PermissionKey = ExtractValues<PermissionCategory>;
