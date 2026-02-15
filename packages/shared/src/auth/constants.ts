/**
 * Auth and RBAC constants
 * System role names, IDs, and permission keys for type-safe usage
 */

/** Cookie name for JWT access token (httpOnly, set by backend on login) */
export const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Single source of truth for system role configuration.
 * Role IDs must match the database seed data.
 * @see packages/database/seeds/0000_20260127_roles_seed.sql
 */
export const SYSTEM_ROLES_CONFIG = {
  VIEW_ONLY: { id: 1, name: 'View Only' },
  EDITOR: { id: 2, name: 'Editor' },
  ADVANCED: { id: 3, name: 'Advanced' },
  ADMIN: { id: 4, name: 'Admin' },
  SYSTEM_ADMIN: { id: 5, name: 'System Admin' },
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES_CONFIG;

/**
 * System role names mapped by key (derived from SYSTEM_ROLES_CONFIG)
 */
export const SYSTEM_ROLES = {
  VIEW_ONLY: SYSTEM_ROLES_CONFIG.VIEW_ONLY.name,
  EDITOR: SYSTEM_ROLES_CONFIG.EDITOR.name,
  ADVANCED: SYSTEM_ROLES_CONFIG.ADVANCED.name,
  ADMIN: SYSTEM_ROLES_CONFIG.ADMIN.name,
  SYSTEM_ADMIN: SYSTEM_ROLES_CONFIG.SYSTEM_ADMIN.name,
} as const;

/**
 * System role IDs mapped by key (derived from SYSTEM_ROLES_CONFIG)
 */
export const SYSTEM_ROLE_IDS = {
  VIEW_ONLY: SYSTEM_ROLES_CONFIG.VIEW_ONLY.id,
  EDITOR: SYSTEM_ROLES_CONFIG.EDITOR.id,
  ADVANCED: SYSTEM_ROLES_CONFIG.ADVANCED.id,
  ADMIN: SYSTEM_ROLES_CONFIG.ADMIN.id,
  SYSTEM_ADMIN: SYSTEM_ROLES_CONFIG.SYSTEM_ADMIN.id,
} as const;

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
    APPROVE: 'activities.approve',
    PUBLISH: 'activities.publish',
    UNPUBLISH: 'activities.unpublish',
  },
  DRAFTS: {
    VIEW: 'drafts.view',
    CREATE: 'drafts.create',
    EDIT: 'drafts.edit',
    DELETE: 'drafts.delete',
    RECOVER: 'drafts.recover',
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
