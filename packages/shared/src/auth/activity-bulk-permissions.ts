import { PERMISSIONS, type PermissionKey } from './constants';

/** Any one of these may call `POST /activities/bulk-update` (operation checked in service). */
export const ACTIVITY_BULK_UPDATE_ROUTE_PERMISSIONS: readonly PermissionKey[] =
  [
    PERMISSIONS.ACTIVITIES.BULK_ISSUE,
    PERMISSIONS.ACTIVITIES.BULK_TAGS,
    PERMISSIONS.ACTIVITIES.BULK_SHARE,
    PERMISSIONS.ACTIVITIES.REVIEW,
    PERMISSIONS.ACTIVITIES.DELETE,
    PERMISSIONS.ACTIVITIES.FLAG,
    PERMISSIONS.ACTIVITIES.BULK_UPDATE,
  ];

export type BulkUpdateActivityOperation =
  'review' | 'issue' | 'tags' | 'sharedWith' | 'flag' | 'delete';

/** All permission keys required for a bulk-update operation (must all be present). */
export function requiredPermissionsForBulkUpdateOperation(
  operation: BulkUpdateActivityOperation
): readonly PermissionKey[] {
  switch (operation) {
    case 'review':
      return [PERMISSIONS.ACTIVITIES.REVIEW];
    case 'delete':
      return [PERMISSIONS.ACTIVITIES.DELETE];
    case 'flag':
      return [PERMISSIONS.ACTIVITIES.FLAG];
    case 'issue':
      return [PERMISSIONS.ACTIVITIES.BULK_ISSUE, PERMISSIONS.ACTIVITIES.EDIT];
    case 'tags':
      return [PERMISSIONS.ACTIVITIES.BULK_TAGS, PERMISSIONS.ACTIVITIES.EDIT];
    case 'sharedWith':
      return [PERMISSIONS.ACTIVITIES.BULK_SHARE, PERMISSIONS.ACTIVITIES.EDIT];
    default: {
      const _exhaustive: never = operation;
      throw new Error('Unsupported bulk activity operation');
    }
  }
}

export function hasAllPermissions(
  userPermissions: string[] | undefined,
  required: readonly PermissionKey[]
): boolean {
  if (required.length === 0) return false;
  return required.every((key) => userPermissions?.includes(key) === true);
}
