import { z } from 'zod';

import { PERMISSIONS, SYSTEM_ROLES } from './auth/constants';

export const HISTORY_AUDIENCES = ['public', 'internal', 'private'] as const;

export type HistoryAudience = (typeof HISTORY_AUDIENCES)[number];

export const historyAudienceSchema = z.enum(HISTORY_AUDIENCES);

export type HistoryAudienceResolveError = {
  ok: false;
  code: 'forbidden' | 'invalid';
  message: string;
};

export type HistoryAudienceResolveResult =
  | { ok: true; audience: HistoryAudience }
  | HistoryAudienceResolveError;

export interface HistoryAudienceViewer {
  userId: number;
  permissions: string[];
  roleName?: string;
}

export interface HistoryAudienceEntry {
  audience: HistoryAudience;
  /** User who created the history row (private visibility for non–System Admin). */
  userId: number;
}

export function hasHistoryAudienceInternalPermission(
  permissions: string[]
): boolean {
  return permissions.includes(PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_INTERNAL);
}

export function hasHistoryAudiencePrivatePermission(
  permissions: string[]
): boolean {
  return permissions.includes(PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_PRIVATE);
}

/** True when the UI may offer internal/private audience on save or notes. */
export function canSelectHistoryAudience(permissions: string[]): boolean {
  return (
    hasHistoryAudienceInternalPermission(permissions) ||
    hasHistoryAudiencePrivatePermission(permissions)
  );
}

/** Include `audience` on history API entries when the viewer may see non-public tiers. */
export function shouldIncludeAudienceInHistoryResponse(
  permissions: string[]
): boolean {
  return canSelectHistoryAudience(permissions);
}

function isSystemAdminRole(roleName: string | undefined): boolean {
  return roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
}

/**
 * Whether a viewer may see a history row after activity access checks.
 * Does not apply field redaction or empty-shell filtering.
 */
export function canViewHistoryAudience(
  viewer: HistoryAudienceViewer,
  entry: HistoryAudienceEntry
): boolean {
  if (entry.audience === 'public') {
    return true;
  }

  if (isSystemAdminRole(viewer.roleName)) {
    return true;
  }

  if (entry.audience === 'internal') {
    return hasHistoryAudienceInternalPermission(viewer.permissions);
  }

  if (entry.audience === 'private') {
    return entry.userId === viewer.userId;
  }

  return false;
}

/**
 * Validates requested audience against permissions and applies default when omitted.
 * Editors without audience permissions always get public when omitted.
 */
export function resolveHistoryAudience(
  input: HistoryAudience | undefined,
  permissions: string[]
): HistoryAudienceResolveResult {
  if (input !== undefined) {
    const parsed = historyAudienceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'invalid',
        message: 'historyAudience must be public, internal, or private',
      };
    }
    const audience = parsed.data;
    if (
      audience === 'internal' &&
      !hasHistoryAudienceInternalPermission(permissions)
    ) {
      return {
        ok: false,
        code: 'forbidden',
        message: 'Missing permission to save activity history as internal',
      };
    }
    if (
      audience === 'private' &&
      !hasHistoryAudiencePrivatePermission(permissions)
    ) {
      return {
        ok: false,
        code: 'forbidden',
        message: 'Missing permission to save activity history as private',
      };
    }
    return { ok: true, audience };
  }

  if (hasHistoryAudienceInternalPermission(permissions)) {
    return { ok: true, audience: 'internal' };
  }

  return { ok: true, audience: 'public' };
}
