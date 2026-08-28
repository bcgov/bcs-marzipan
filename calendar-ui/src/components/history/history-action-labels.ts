/**
 * Canonical display labels for history actionType values across activities,
 * users, and teams. DB values stay snake_case; UI uses sentence case.
 */
const HISTORY_ACTION_LABELS: Record<string, string> = {
  // Activity
  created: 'Created',
  updated: 'Updated',
  reviewed: 'Reviewed',
  completed: 'Completed',
  deleted: 'Deleted',
  delete_requested: 'Delete requested',
  soft_deleted: 'Deleted',
  restored: 'Restored',
  changes_cancelled: 'Changes cancelled',
  note_added: 'Note added',
  comment_added: 'Comment added',
  assigned: 'Assigned',
  unassigned: 'Unassigned',
  status_changed: 'Status changed',
  comms_lead_transferred: 'Comms lead transferred',
  lead_team_changed: 'Lead team changed',
  cloned: 'Cloned',
  flag_assigned: 'Flagged',
  flag_removed: 'Unflagged',
  published: 'Published',
  draft_saved: 'Draft saved',
  // User
  role_changed: 'Role changed',
  activated: 'Activated',
  deactivated: 'Deactivated',
  settings_updated: 'Settings updated',
  team_added: 'Team added',
  team_removed: 'Team removed',
  team_role_changed: 'Team role changed',
  activities_transferred: 'Activities transferred',
};

function sentenceCaseActionFallback(actionType: string): string {
  const spaced = actionType
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!spaced) return 'Updated';

  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function getHistoryActionLabel(actionType: string): string {
  if (!actionType) return '';
  const lower = String(actionType).toLowerCase();
  return HISTORY_ACTION_LABELS[lower] ?? sentenceCaseActionFallback(actionType);
}
