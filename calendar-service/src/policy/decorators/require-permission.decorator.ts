import { SetMetadata } from '@nestjs/common';

import type { PermissionKey } from '@corpcal/shared';

export const PERMISSIONS_METADATA_KEY = 'policy:permissions';

export type PermissionsMode = 'all' | 'any';

export interface PermissionsMetadata {
  keys: string[];
  mode: PermissionsMode;
}

/**
 * Require a single permission.
 * Use with PermissionsGuard (must run after JwtAuthGuard).
 *
 * @example
 * @RequirePermission(PERMISSIONS.ACTIVITIES.CREATE)
 */
export const RequirePermission = (permissionKey: PermissionKey) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, {
    keys: [permissionKey],
    mode: 'any',
  });

/**
 * Require any of the given permissions.
 * Use with PermissionsGuard.
 *
 * @example
 * @RequireAnyPermission(PERMISSIONS.ACTIVITIES.CREATE, PERMISSIONS.ACTIVITIES.EDIT)
 */
export const RequireAnyPermission = (...permissionKeys: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, {
    keys: permissionKeys,
    mode: 'any',
  });

/**
 * Require all of the given permissions.
 * Use with PermissionsGuard.
 *
 * @example
 * @RequireAllPermissions(PERMISSIONS.ACTIVITIES.DELETE, PERMISSIONS.ACTIVITIES.APPROVE)
 */
export const RequireAllPermissions = (...permissionKeys: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, {
    keys: permissionKeys,
    mode: 'all',
  });
