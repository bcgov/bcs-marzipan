import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  History,
  Loader2,
  MoreHorizontal,
  Pencil,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { UserListItem } from '@corpcal/shared/api/types';
import { fetchUsers, removeUserFromTeam, updateUser } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { TransferActivitiesDialog } from '@/components/users/TransferActivitiesDialog';
import { UserEditModal } from '@/components/users/UserEditModal';
import { UserHistoryDrawer } from '@/components/users/UserHistoryDrawer';
import { useAuth } from '@/hooks/useAuth';

function displayName(user: UserListItem): string {
  return user.adDisplayName || user.adUsername || `User ${user.id}`;
}

// TODO: review inline styling and move to centralized semantic colours/styles
function statusBadge(isActive: boolean) {
  return (
    <span
      className={
        isActive
          ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-800'
          : 'rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600'
      }
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export function Users() {
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [transferSourceUser, setTransferSourceUser] =
    useState<UserListItem | null>(null);
  const [historyUser, setHistoryUser] = useState<UserListItem | null>(null);

  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.USERS.EDIT);
  const canTransfer = hasPermission(PERMISSIONS.USERS.TRANSFER_ACTIVITIES);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => fetchUsers(search || undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Parameters<typeof updateUser>[1];
    }) => updateUser(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
      setEditUser(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Update failed');
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: ({ userId, teamId }: { userId: number; teamId: number }) =>
      removeUserFromTeam(userId, teamId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed from team');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Remove from team failed');
    },
  });

  const handleDeactivate = useCallback(
    (user: UserListItem) => {
      updateMutation.mutate({
        id: user.id,
        body: { isActive: false },
      });
    },
    [updateMutation]
  );

  const handleReactivate = useCallback(
    (user: UserListItem) => {
      updateMutation.mutate({
        id: user.id,
        body: { isActive: true },
      });
    },
    [updateMutation]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            User Management
          </h1>
          <p className="text-sm text-slate-600">
            Manage user accounts, teams, and roles
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <Input
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-slate-500">
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Teams
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Status
                </th>
                <th className="w-[60px] px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {displayName(user)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.adEmail ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-slate-200 px-2 py-0.5 text-xs">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.teams.length === 0 ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        user.teams.map((t) => (
                          <span
                            key={t.teamId}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {t.teamName}
                            {t.role !== 'member' ? ` (${t.role})` : ''}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(user.isActive)}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <UsersRound className="h-4 w-4" />
                            Add to team / Edit teams
                          </DropdownMenuItem>
                        )}
                        {canTransfer && (
                          <DropdownMenuItem
                            onClick={() => setTransferSourceUser(user)}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                            Transfer activities
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setHistoryUser(user)}>
                          <History className="h-4 w-4" />
                          View history
                        </DropdownMenuItem>
                        {canEdit && user.isActive && (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(user)}
                            variant="destructive"
                          >
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        {canEdit && !user.isActive && (
                          <DropdownMenuItem
                            onClick={() => handleReactivate(user)}
                          >
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              {search ? 'No users match your search' : 'No users found'}
            </div>
          )}
        </div>
      )}

      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditUser(null);
          }}
          onRemoveFromTeam={(userId, teamId) =>
            removeTeamMutation.mutate({ userId, teamId })
          }
        />
      )}

      {transferSourceUser && (
        <TransferActivitiesDialog
          sourceUser={transferSourceUser}
          onClose={() => setTransferSourceUser(null)}
          onTransferred={() => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            setTransferSourceUser(null);
          }}
        />
      )}

      {historyUser && (
        <UserHistoryDrawer
          user={historyUser}
          open={!!historyUser}
          onClose={() => setHistoryUser(null)}
        />
      )}
    </div>
  );
}
