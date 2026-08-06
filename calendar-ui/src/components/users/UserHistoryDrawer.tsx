import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import type { UserHistoryEntry, UserListItem } from '@corpcal/shared/api/types';
import { fetchRoles, fetchTeams, fetchUserHistory } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildUserHistoryChangeMessage } from '@/components/users/userHistoryFormatting';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

interface UserHistoryDrawerProps {
  user: UserListItem;
  open: boolean;
  onClose: () => void;
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
      {changes.map((c, i) => (
        <li key={i}>
          {buildUserHistoryChangeMessage(c, {
            roleNamesById,
            teamNamesById,
          })}
        </li>
      ))}
    </ul>
  );
}

export function UserHistoryDrawer({
  user,
  open,
  onClose,
}: UserHistoryDrawerProps) {
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    enabled: open,
  });

  const { data: teams = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
    queryFn: fetchTeams,
    enabled: open,
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['userHistory', user.id],
    queryFn: () => fetchUserHistory(user.id),
    enabled: open && !!user.id,
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

  const displayName =
    user.adDisplayName || user.adUsername || `User ${user.id}`;

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="max-h-[80vh] w-full max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History: {displayName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-slate-500">No history entries.</p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
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
                    <p className="mt-2 text-sm text-slate-600 italic">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        <div className="border-t border-slate-200 p-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
