import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import type {
  HistoryChange,
  UserHistoryEntry,
} from '@corpcal/shared/api/types';
import { fetchRoles, fetchTeams, fetchUserHistory } from '@/api/usersApi';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatLongDate,
  formatPacificTimeWithAbbrev,
  pacificActivityHistoryRecencyBucket,
} from '@/lib/datetime-utils';

interface UserChangeLogProps {
  userId: number;
}

/** Technical fields used only to build action labels; never rendered as rows. */
const HIDDEN_FIELDS = new Set([
  'targetUserId',
  'sourceUserId',
  'targetUserName',
  'sourceUserName',
  'activityIds',
  'activityCount',
]);

const FIELD_LABELS: Record<string, string> = {
  roleId: 'Role',
  isActive: 'Active',
  notes: 'Notes',
  adDisplayName: 'Display name',
  adEmail: 'Email',
  adPhone: 'Phone',
  adJobTitle: 'Job title',
  flagColour: 'Flag colour',
  directLoginEnabled: 'Direct login',
  teamId: 'Team',
  teamRole: 'Team role',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  role_changed: 'Role changed',
  activated: 'Activated',
  deactivated: 'Deactivated',
  settings_updated: 'Settings updated',
  team_added: 'Added to team',
  team_removed: 'Removed from team',
  team_role_changed: 'Team role changed',
};

function getFieldLabel(field: string): string {
  return (
    FIELD_LABELS[field] ??
    field
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^./, (c) => c.toUpperCase())
  );
}

function getChangeValue(
  changes: HistoryChange[] | null | undefined,
  field: string
): unknown {
  return changes?.find((c) => c.field === field)?.newValue;
}

function pluralizeActivities(count: number): string {
  return `${count} ${count === 1 ? 'activity' : 'activities'}`;
}

export function UserChangeLog({ userId }: UserChangeLogProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['userHistory', userId],
    queryFn: () => fetchUserHistory(userId),
    enabled: !!userId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
  const teamNameById = new Map(
    teams.map((t) => [t.id, t.displayName || t.name])
  );

  function formatValue(field: string, value: unknown): string {
    if (value == null || value === '') return '—';
    if (field === 'roleId' && typeof value === 'number') {
      return roleNameById.get(value) ?? `Role ${value}`;
    }
    if (field === 'teamId' && typeof value === 'number') {
      return teamNameById.get(value) ?? `Team ${value}`;
    }
    if (field === 'isActive') return value ? 'Active' : 'Inactive';
    if (field === 'directLoginEnabled') return value ? 'Enabled' : 'Disabled';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return JSON.stringify(value);
  }

  function getActionLabel(entry: UserHistoryEntry): string {
    const { actionType, changes } = entry;
    if (actionType === 'activities_transferred') {
      const count = Number(getChangeValue(changes, 'activityCount') ?? 0);
      const name = getChangeValue(changes, 'targetUserName');
      return typeof name === 'string' && name
        ? `Transferred ${pluralizeActivities(count)} to ${name}`
        : `Transferred ${pluralizeActivities(count)}`;
    }
    if (actionType === 'activities_received') {
      const count = Number(getChangeValue(changes, 'activityCount') ?? 0);
      const name = getChangeValue(changes, 'sourceUserName');
      return typeof name === 'string' && name
        ? `Received ${pluralizeActivities(count)} from ${name}`
        : `Received ${pluralizeActivities(count)}`;
    }
    return (
      ACTION_LABELS[actionType] ??
      actionType.replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())
    );
  }

  function getActorName(entry: UserHistoryEntry): string {
    return entry.changedByUserName || `User ${entry.changedByUserId}`;
  }

  function getActorInitials(entry: UserHistoryEntry): string {
    const parts = getActorName(entry).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  const groupsOrder = ['Today', 'This week', 'Earlier'] as const;
  const groups: Record<string, UserHistoryEntry[]> = {
    Today: [],
    'This week': [],
    Earlier: [],
  };
  const now = new Date();
  for (const entry of history) {
    const bucket = pacificActivityHistoryRecencyBucket(
      new Date(entry.timestamp),
      now
    );
    groups[bucket].push(entry);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">No history entries.</div>
    );
  }

  return (
    <div className="space-y-6">
      {groupsOrder.map((groupKey) =>
        groups[groupKey].length > 0 ? (
          <div key={groupKey}>
            <div className="mb-2 text-sm font-semibold">{groupKey}</div>
            <div className="space-y-4">
              {groups[groupKey].map((entry) => {
                const visibleChanges = (entry.changes ?? []).filter(
                  (c) => !HIDDEN_FIELDS.has(c.field)
                );
                return (
                  <div key={entry.id} className="rounded py-3">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {getActorInitials(entry)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-foreground text-base font-normal">
                              {getActorName(entry)}
                            </div>
                            <div className="text-muted-foreground mt-1 text-sm">
                              {getActionLabel(entry)}
                            </div>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {groupKey === 'Today'
                              ? `Today at ${formatPacificTimeWithAbbrev(
                                  new Date(entry.timestamp)
                                )}`
                              : formatLongDate(new Date(entry.timestamp), {
                                  timeZone: CORP_PACIFIC_TIME_ZONE,
                                })}
                          </div>
                        </div>

                        <div className="text-foreground mt-3 space-y-3 text-sm">
                          {visibleChanges.length > 0 ? (
                            <div>
                              {visibleChanges.map((change, index) => (
                                <div key={index} className="mb-1 text-sm">
                                  <strong className="font-medium">
                                    {getFieldLabel(change.field)}:
                                  </strong>{' '}
                                  <span className="text-muted-foreground">
                                    {formatValue(change.field, change.oldValue)}
                                  </span>{' '}
                                  →{' '}
                                  <span>
                                    {formatValue(change.field, change.newValue)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {entry.notes ? (
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              {entry.notes}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

export default UserChangeLog;
