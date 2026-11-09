import { PERMISSIONS } from './auth/constants';

/**
 * Server-internal labels for activity timestamp writes. Policy buckets:
 * - Defer-aware user edits: `userPatch`, `junction` (respect `activities.publicLastUpdated.defer` + optional renew on PATCH).
 * - Audience / lifecycle: `create`, `softDelete`, `restore`, `deleteRequested` (always bump public).
 * - Operational only: `bulk`, `historyNote`, `sharedWithDelete`, `transfer`, `systemJob`.
 *
 * See calendar-service API.md (Audit Fields) for user-facing documentation.
 */
export const TIMESTAMP_WRITE_CONTEXTS = [
  'userPatch',
  'junction',
  'bulk',
  'historyNote',
  'softDelete',
  'restore',
  'deleteRequested',
  'sharedWithDelete',
  'transfer',
  'systemJob',
  'create',
] as const;

export type TimestampWriteContext = (typeof TIMESTAMP_WRITE_CONTEXTS)[number];

export type ResolveBumpPublicLastUpdatedError = {
  ok: false;
  code: 'forbidden' | 'bad_request';
  message: string;
};

export type ResolveBumpPublicLastUpdatedResult =
  | { ok: true; bumpPublic: boolean }
  | ResolveBumpPublicLastUpdatedError;

export function hasPublicLastUpdatedDeferPermission(
  permissions: string[]
): boolean {
  return permissions.includes(PERMISSIONS.ACTIVITIES.PUBLIC_LAST_UPDATED_DEFER);
}

/**
 * Whether an activity write should bump publicLastUpdated* (operational always bumps separately).
 */
export function resolveBumpPublicLastUpdated(input: {
  context: TimestampWriteContext;
  permissions: string[];
  renewPublicLastUpdated?: boolean;
}): ResolveBumpPublicLastUpdatedResult {
  const { context, permissions, renewPublicLastUpdated } = input;
  const hasDefer = hasPublicLastUpdatedDeferPermission(permissions);

  if (renewPublicLastUpdated === true && context !== 'userPatch') {
    return {
      ok: false,
      code: 'bad_request',
      message:
        'renewPublicLastUpdated is only supported on activity PATCH (not bulk, junction, or system paths).',
    };
  }

  if (renewPublicLastUpdated === true && !hasDefer) {
    return {
      ok: false,
      code: 'forbidden',
      message:
        'Missing permission to set renewPublicLastUpdated; public last updated is always renewed for this caller',
    };
  }

  switch (context) {
    case 'create':
    case 'softDelete':
    case 'restore':
    case 'deleteRequested':
      return { ok: true, bumpPublic: true };
    case 'bulk':
    case 'historyNote':
    case 'sharedWithDelete':
    case 'transfer':
    case 'systemJob':
      return { ok: true, bumpPublic: false };
    case 'junction':
      return { ok: true, bumpPublic: !hasDefer };
    case 'userPatch':
      return {
        ok: true,
        bumpPublic: !hasDefer || renewPublicLastUpdated === true,
      };
    default: {
      const _exhaustive: never = context;
      return _exhaustive;
    }
  }
}
