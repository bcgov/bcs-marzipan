import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem, UserListItem } from '@corpcal/shared/api/types';
import { updateTeam } from '@/api/teamsApi';
import { removeUserFromTeam, updateUser } from '@/api/usersApi';
import { PageHeader } from '@/components/PageHeader';
import { TeamEditModal } from '@/components/teams/TeamEditModal';
import { TeamHistoryDrawer } from '@/components/teams/TeamHistoryDrawer';
import { TeamsTabContent } from '@/components/teams/TeamsTabContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransferActivitiesDialog } from '@/components/users/TransferActivitiesDialog';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { UserEditModal } from '@/components/users/UserEditModal';
import { UserHistoryDrawer } from '@/components/users/UserHistoryDrawer';
import { UsersTabContent } from '@/components/users/UsersTabContent';
import { useAuth } from '@/hooks/useAuth';

export function Users() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [transferSourceUser, setTransferSourceUser] =
    useState<UserListItem | null>(null);
  const [historyUser, setHistoryUser] = useState<UserListItem | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamListItem | null>(null);
  const [teamHistoryTeam, setTeamHistoryTeam] = useState<TeamListItem | null>(
    null
  );

  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.USERS.EDIT);
  const canCreateUser = hasPermission(PERMISSIONS.USERS.CREATE);
  const canTransfer = hasPermission(PERMISSIONS.USERS.TRANSFER_ACTIVITIES);
  const canViewTeams = hasPermission(PERMISSIONS.TEAMS.VIEW);
  const canCreateTeam = hasPermission(PERMISSIONS.TEAMS.CREATE);
  const canEditTeam = hasPermission(PERMISSIONS.TEAMS.EDIT);
  const canDeleteTeam = hasPermission(PERMISSIONS.TEAMS.DELETE);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Parameters<typeof updateUser>[1];
    }) => updateUser(id, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated', { id: `user-updated-${variables.id}` });
      setEditUser(null);
    },
    onError: (err: Error, variables) => {
      toast.error(err.message || 'Update failed', {
        id: variables ? `user-updated-${variables.id}` : undefined,
      });
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: ({ userId, teamId }: { userId: number; teamId: number }) =>
      removeUserFromTeam(userId, teamId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed from team', {
        id: `user-removed-from-team-${variables.userId}-${variables.teamId}`,
      });
    },
    onError: (err: Error, variables) => {
      toast.error(err.message || 'Remove from team failed', {
        id: `user-removed-from-team-${variables.userId}-${variables.teamId}`,
      });
    },
  });

  const deactivateTeamMutation = useMutation({
    mutationFn: (teamId: number) => updateTeam(teamId, { isActive: false }),
    onSuccess: (_data, teamId) => {
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deactivated', { id: `team-deactivated-${teamId}` });
    },
    onError: (err: Error, teamId) => {
      toast.error(err.message || 'Deactivate failed', {
        id:
          typeof teamId === 'number' ? `team-deactivated-${teamId}` : undefined,
      });
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
    <>
      <PageHeader
        title="User & Team Management"
        description="Manage user accounts, teams, and roles"
        action={
          canCreateUser && (
            <Button
              onClick={() => setShowCreateUser(true)}
              className="bg-(--bcsds-button-primary-background) text-white hover:bg-(--bcsds-button-primary-background)/95"
            >
              <Plus className="h-4 w-4" />
              Add user
            </Button>
          )
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'users' | 'teams')}
      >
        <div className="mb-0">
          <TabsList className="mb-0" variant="line" size="med">
            <TabsTrigger value="users">Users</TabsTrigger>
            {canViewTeams && <TabsTrigger value="teams">Teams</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-0">
          <UsersTabContent
            canEdit={canEdit}
            canTransfer={canTransfer}
            onEditUser={setEditUser}
            onTransfer={setTransferSourceUser}
            onViewHistory={setHistoryUser}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />

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

          <UserCreateModal
            open={showCreateUser}
            onClose={() => setShowCreateUser(false)}
          />
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
    </>
  );
}
