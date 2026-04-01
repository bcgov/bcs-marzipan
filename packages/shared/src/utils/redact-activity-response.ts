import {
  ACTIVITY_FIELD_SCOPE_CONFIG,
  ACTIVITY_FIELD_SCOPES,
  canViewActivityFieldScope,
} from '../auth/activity-field-scopes';
import type { ActivityResponse } from '../schemas/activity-response.schema';

interface FieldScopeUser {
  permissions: string[];
  roleName: string;
}

/**
 * Strip fields from an ActivityResponse that the user lacks view permission for.
 * Returns a shallow copy; the original is not mutated.
 */
export function redactActivityResponse(
  activity: ActivityResponse,
  user: FieldScopeUser
): ActivityResponse {
  const redacted = { ...activity };
  let didRedact = false;

  for (const scope of ACTIVITY_FIELD_SCOPES) {
    if (canViewActivityFieldScope(user, scope)) continue;
    didRedact = true;
    const config = ACTIVITY_FIELD_SCOPE_CONFIG[scope];
    for (const field of config.responseFields) {
      deleteField(redacted, field);
    }
  }

  if (didRedact && redacted.changedFieldsSinceReview) {
    redacted.changedFieldsSinceReview = filterChangedFields(
      redacted.changedFieldsSinceReview,
      user
    );
  }

  return redacted;
}

function deleteField(obj: Record<string, unknown>, key: string): void {
  delete obj[key];
}

/**
 * Remove changed-field paths that belong to scopes the user cannot view.
 */
function filterChangedFields(paths: string[], user: FieldScopeUser): string[] {
  const hiddenFields = new Set<string>();
  for (const scope of ACTIVITY_FIELD_SCOPES) {
    if (canViewActivityFieldScope(user, scope)) continue;
    const config = ACTIVITY_FIELD_SCOPE_CONFIG[scope];
    for (const f of config.responseFields) hiddenFields.add(f);
    for (const f of config.requestFields) hiddenFields.add(f);
  }
  return paths.filter((p) => !hiddenFields.has(p));
}
