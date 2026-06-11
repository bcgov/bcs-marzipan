import {
  ACTIVITY_FIELD_SCOPE_CONFIG,
  ACTIVITY_FIELD_SCOPES,
  canViewActivityFieldScope,
} from '../auth/activity-field-scopes';
import {
  ACTIVITY_LIST_ITEM_SHAPE,
  type ActivityListItem,
} from '../schemas/activity-list-item.schema';
import type { ActivityResponse } from '../schemas/activity-response.schema';

/**
 * True when `value` is a full ActivityResponse-shaped object (HTTP `data` fragment).
 * Not for list/report rows (`_shape: 'list'`), history rows, category lookups, or
 * global-history activity summaries.
 */
export function isActivityResponsePayload(
  value: unknown
): value is ActivityResponse {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o._shape === ACTIVITY_LIST_ITEM_SHAPE) return false;
  return (
    typeof o.id === 'number' &&
    typeof o.title === 'string' &&
    typeof o.isIssue === 'boolean' &&
    typeof o.activityStatusId === 'number'
  );
}

interface FieldScopeUser {
  permissions: string[];
  roleName: string;
}

/**
 * Strip fields from an ActivityResponse that the user lacks view permission for.
 * Returns a shallow copy; the original is not mutated.
 */
export function redactActivityResponse<
  T extends ActivityResponse | ActivityListItem,
>(activity: T, user: FieldScopeUser): T {
  const redacted = { ...activity } as Record<string, unknown> & T;
  let didRedact = false;

  for (const scope of ACTIVITY_FIELD_SCOPES) {
    if (canViewActivityFieldScope(user, scope)) continue;
    didRedact = true;
    const config = ACTIVITY_FIELD_SCOPE_CONFIG[scope];
    for (const field of config.responseFields) {
      deleteField(redacted, field);
    }
  }

  if (
    didRedact &&
    'changedFieldsSinceReview' in redacted &&
    Array.isArray(redacted.changedFieldsSinceReview)
  ) {
    redacted.changedFieldsSinceReview = filterChangedFields(
      redacted.changedFieldsSinceReview as string[],
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
