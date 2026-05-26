import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem, UserListItem } from '@corpcal/shared/api/types';
import { updateTeam } from '@/api/teamsApi';
import {
  initiatePasswordReset,
  removeUserFromTeam,
  updateUser,
} from '@/api/usersApi';
import { PageHeader } from '@/components/layout';
import { TeamEditModal } from '@/components/teams/TeamEditModal';
import { TeamHistoryDrawer } from '@/components/teams/TeamHistoryDrawer';
import { TeamsTabContent } from '@/components/teams/TeamsTabContent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransferActivitiesDialog } from '@/components/users/TransferActivitiesDialog';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { UserEditModal } from '@/components/users/UserEditModal';
import { UserHistoryDrawer } from '@/components/users/UserHistoryDrawer';
import { UsersTabContent } from '@/components/users/UsersTabContent';
import { useAuth } from '@/hooks/useAuth';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

export function Users() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [transferSourceUser, setTransferSourceUser] =
    useState<UserListItem | null>(null);
  const [historyUser, setHistoryUser] = useState<UserListItem | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [resetCodeResult, setResetCodeResult] = useState<{
    user: UserListItem;
    code: string;
  } | null>(null);
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
      void queryClient.invalidateQueries({ queryKey: lookupQueryKeys.teams() });
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

  const resetMutation = useMutation({
    mutationFn: (user: UserListItem) => initiatePasswordReset(user.id),
    onSuccess: (data, user) => {
      setResetCodeResult({ user, code: data.resetCode });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate reset code');
    },
  });

  const handleInitiateReset = useCallback(
    (user: UserListItem) => {
      setResetCodeResult({ user, code: '' });
      resetMutation.mutate(user);
    },
    [resetMutation]
  );

  return (
    <>
      <PageHeader
        title="User & Team Management"
        description="Manage user accounts, teams, and roles"
        action={
          canCreateUser && (
            <Button onClick={() => setShowCreateUser(true)}>
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
            onInitiateReset={handleInitiateReset}
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

          <Dialog
            open={!!resetCodeResult}
            onOpenChange={(open) => {
              if (!open) setResetCodeResult(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Password Reset Code</DialogTitle>
                <DialogDescription>
                  Share this one-time code with{' '}
                  <strong>
                    {resetCodeResult?.user.adDisplayName ?? 'the user'}
                  </strong>
                  . It expires in 48 hours. Once closed, it cannot be retrieved
                  again.
                </DialogDescription>
              </DialogHeader>
              {resetCodeResult?.code ? (
                <div className="bg-muted flex items-center gap-2 rounded-md border px-4 py-3">
                  <code className="flex-1 font-mono text-sm break-all select-all">
                    {resetCodeResult.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copy reset code"
                    onClick={() => {
                      void navigator.clipboard.writeText(resetCodeResult.code);
                      toast.success('Copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Generating code…
                </p>
              )}
            </DialogContent>
          </Dialog>
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
          void queryClient.invalidateQueries({
            queryKey: lookupQueryKeys.teams(),
          });
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
