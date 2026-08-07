import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import type { UserHistoryEntry } from '@corpcal/shared/api/types';
import { fetchRoles, fetchTeams, fetchUserHistory } from '@/api/usersApi';
import { buildUserHistoryChangeMessage } from '@/components/users/userHistoryFormatting';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import { userQueryKeys } from '@/lib/userQueryKeys';

interface UserChangeLogTabContentProps {
  userId: number;
}

function ChangeList({
  changes,
  roleNamesById,
  teamNamesById,
}: {
  changes: UserHistoryEntry['changes'];
  roleNamesById: Record<number, string>;
  teamNamesById: Record<number, string>;
}) {
  if (!changes || changes.length === 0) return null;
  return (
    <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
      {changes.map((change, index) => (
        <li key={index}>
          {buildUserHistoryChangeMessage(change, {
            roleNamesById,
            teamNamesById,
          })}
        </li>
      ))}
    </ul>
  );
}

export function UserChangeLogTabContent({
  userId,
}: UserChangeLogTabContentProps) {
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    enabled: userId > 0,
  });

  const { data: teams = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
    queryFn: fetchTeams,
    enabled: userId > 0,
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: userQueryKeys.history(userId),
    queryFn: () => fetchUserHistory(userId),
    enabled: userId > 0,
  });

  const roleNamesById = useMemo(
    () =>
      Object.fromEntries(roles.map((role) => [role.id, role.name] as const)),
    [roles]
  );

  const teamNamesById = useMemo(
    () =>
      Object.fromEntries(
        teams.map((team) => [
          team.id,
          team.displayName || team.name || `Team ${team.id}`,
        ])
      ),
    [teams]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-slate-500">No history entries.</p>;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4 py-4">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">
              {entry.actionType.replace(/_/g, ' ')}
            </span>
            <span className="text-slate-500">
              {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
          {entry.changedByUserName && (
            <p className="mt-1 text-xs text-slate-600">
              By {entry.changedByUserName}
            </p>
          )}
          <ChangeList
            changes={entry.changes}
            roleNamesById={roleNamesById}
            teamNamesById={teamNamesById}
          />
          {entry.notes && (
            <p className="mt-2 text-sm text-slate-600 italic">{entry.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
