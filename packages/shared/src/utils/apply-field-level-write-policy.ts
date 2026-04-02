/**
 * Strips fields from create/update DTOs when the user lacks edit permission
 * for the owning scope.
 *
 * - Create: stripped fields are deleted (server applies canonical defaults).
 * - Update: stripped fields are deleted (server keeps existing DB values).
 */

import {
  ACTIVITY_FIELD_SCOPE_CONFIG,
  ACTIVITY_FIELD_SCOPES,
  canEditActivityFieldScope,
} from '../auth/activity-field-scopes';

interface FieldScopeUser {
  permissions: string[];
  roleName: string;
}

/**
 * Mutates `dto` in place, removing fields the user is not allowed to edit.
 * Returns the list of scope names that were stripped (for logging/diagnostics).
 */
export function applyFieldLevelWritePolicy<T extends Record<string, unknown>>(
  dto: T,
  user: FieldScopeUser
): string[] {
  const stripped: string[] = [];

  for (const scope of ACTIVITY_FIELD_SCOPES) {
    if (canEditActivityFieldScope(user, scope)) continue;

    const config = ACTIVITY_FIELD_SCOPE_CONFIG[scope];
    let removedAny = false;
    for (const field of config.requestFields) {
      if (field in dto) {
        delete dto[field];
        removedAny = true;
      }
    }
    if (removedAny) {
      stripped.push(scope);
    }
  }

  return stripped;
}
