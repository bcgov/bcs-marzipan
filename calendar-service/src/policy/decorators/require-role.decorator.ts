import { SetMetadata } from '@nestjs/common';
import type { SystemRoleName } from '@corpcal/shared';

export const ROLES_METADATA_KEY = 'policy:roles';

export interface RolesMetadata {
  roleNames: string[];
}

/**
 * Require the user to have one of the given roles.
 * Use with RolesGuard (must run after JwtAuthGuard).
 *
 * Users have exactly one role, so this checks if the user's role is in the allowed list.
 * Use for role-based access control when
 * permission-based control is not granular enough.
 *
 * @example
 * // Allow Admin or System Admin
 * @RequireRole(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SYSTEM_ADMIN)
 */
export const RequireRole = (...roleNames: SystemRoleName[]) =>
  SetMetadata(ROLES_METADATA_KEY, { roleNames });
