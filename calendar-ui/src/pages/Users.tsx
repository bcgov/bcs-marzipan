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
import { useCallback, useMemo, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem, UserListItem } from '@corpcal/shared/api/types';
import { updateTeam } from '@/api/teamsApi';
import {
  fetchRoles,
  fetchTeams,
  fetchUsers,
  removeUserFromTeam,
  updateUser,
} from '@/api/usersApi';
import { TeamEditModal } from '@/components/teams/TeamEditModal';
import { TeamHistoryDrawer } from '@/components/teams/TeamHistoryDrawer';
import { TeamsTabContent } from '@/components/teams/TeamsTabContent';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransferActivitiesDialog } from '@/components/users/TransferActivitiesDialog';
import { UserEditModal } from '@/components/users/UserEditModal';
import { UserHistoryDrawer } from '@/components/users/UserHistoryDrawer';
import { UserManagementFilters } from '@/components/users/UserManagementFilters';
import { useAuth } from '@/hooks/useAuth';

function displayName(user: UserListItem): string {
  return user.adDisplayName || user.adUsername || `User ${user.id}`;
}

function formatLastUpdated(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  } catch {
    return '-';
  }
}

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

const IDIR_PLACEHOLDER = 'MYIDIR';

export function Users() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [keyword, setKeyword] = useState('');
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [transferSourceUser, setTransferSourceUser] =
    useState<UserListItem | null>(null);
  const [historyUser, setHistoryUser] = useState<UserListItem | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamListItem | null>(null);
  const [teamHistoryTeam, setTeamHistoryTeam] = useState<TeamListItem | null>(
    null
  );

  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.USERS.EDIT);
  const canTransfer = hasPermission(PERMISSIONS.USERS.TRANSFER_ACTIVITIES);
  const canViewTeams = hasPermission(PERMISSIONS.TEAMS.VIEW);
  const canCreateTeam = hasPermission(PERMISSIONS.TEAMS.CREATE);
  const canEditTeam = hasPermission(PERMISSIONS.TEAMS.EDIT);
  const canDeleteTeam = hasPermission(PERMISSIONS.TEAMS.DELETE);

  const fetchUsersParams = useMemo(
    () => ({
      search: keyword || undefined,
      teamIds: teamIds.length ? teamIds : undefined,
      roleIds: roleIds.length ? roleIds : undefined,
    }),
    [keyword, teamIds, roleIds]
  );

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', fetchUsersParams],
    queryFn: () => fetchUsers(fetchUsersParams),
  });

  const { data: teamsForFilter = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const { data: rolesForFilter = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const teamOptions = useMemo(
    () =>
      teamsForFilter.map((t) => ({
        value: String(t.id),
        label: t.displayName || t.name,
      })),
    [teamsForFilter]
  );

  const roleOptions = useMemo(
    () => rolesForFilter.map((r) => ({ value: String(r.id), label: r.name })),
    [rolesForFilter]
  );

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

  const deactivateTeamMutation = useMutation({
    mutationFn: (teamId: number) => updateTeam(teamId, { isActive: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deactivated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Deactivate failed');
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
            User & Team Management
          </h1>
          <p className="text-sm text-slate-600">
            Manage user accounts, teams, and roles
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'users' | 'teams')}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          {canViewTeams && <TabsTrigger value="teams">Teams</TabsTrigger>}
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <UserManagementFilters
            keyword={keyword}
            teamIds={teamIds}
            roleIds={roleIds}
            onKeywordChange={setKeyword}
            onTeamIdsChange={setTeamIds}
            onRoleIdsChange={setRoleIds}
            teamOptions={teamOptions}
            roleOptions={roleOptions}
            className="mb-4"
          />
          <div className="mb-2 text-sm text-slate-500">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
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
                      IDIR
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Last updated
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
                      <td className="px-4 py-3 text-slate-600">
                        {IDIR_PLACEHOLDER}
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
                      <td className="px-4 py-3">
                        {statusBadge(user.isActive)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatLastUpdated(
                          (user as { lastUpdatedDateTime?: string | null })
                            .lastUpdatedDateTime
                        )}
                      </td>
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
                              <DropdownMenuItem
                                onClick={() => setEditUser(user)}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canEdit && (
                              <DropdownMenuItem
                                onClick={() => setEditUser(user)}
                              >
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
                            <DropdownMenuItem
                              onClick={() => setHistoryUser(user)}
                            >
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
                  {keyword || teamIds.length > 0 || roleIds.length > 0
                    ? 'No users match your filters'
                    : 'No users found'}
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
        </TabsContent>

        <TabsContent value="teams" className="mt-0">
          {canViewTeams && (
            <TeamsTabContent
              canCreate={canCreateTeam}
              canEdit={canEditTeam}
              canDelete={canDeleteTeam}
              onAddTeam={() => setShowCreateTeam(true)}
              onEditTeam={setTeamToEdit}
              onViewHistory={setTeamHistoryTeam}
              onDeactivate={(team) => deactivateTeamMutation.mutate(team.id)}
            />
          )}
        </TabsContent>
      </Tabs>

      <TeamEditModal
        team={showCreateTeam ? null : (teamToEdit ?? null)}
        open={showCreateTeam || !!teamToEdit}
        onClose={() => {
          setShowCreateTeam(false);
          setTeamToEdit(null);
        }}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ['teams'] });
          setShowCreateTeam(false);
          setTeamToEdit(null);
        }}
      />

      <TeamHistoryDrawer
        team={teamHistoryTeam}
        open={!!teamHistoryTeam}
        onClose={() => setTeamHistoryTeam(null)}
      />
    </div>
  );
}
