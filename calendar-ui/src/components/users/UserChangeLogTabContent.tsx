import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { fetchRoles, fetchTeams, fetchUserHistory } from '@/api/usersApi';
import { HistoryList, toUserHistoryViewModel } from '@/components/history';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import { userQueryKeys } from '@/lib/userQueryKeys';

interface UserChangeLogTabContentProps {
  userId: number;
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

  const historyEntries = useMemo(
    () =>
      history.map((entry) =>
        toUserHistoryViewModel(entry, {
          roleNamesById,
          teamNamesById,
        })
      ),
    [history, roleNamesById, teamNamesById]
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

  return <HistoryList entries={historyEntries} className="max-w-3xl py-4" />;
}
