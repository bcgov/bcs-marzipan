import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { TeamListItem } from '@corpcal/shared/api/types';
import { updateTeam } from '@/api/teamsApi';
import { PageHeader } from '@/components/layout';
import { TeamEditModal } from '@/components/teams/TeamEditModal';
import { TeamHistoryDrawer } from '@/components/teams/TeamHistoryDrawer';
import { TeamsTabContent } from '@/components/teams/TeamsTabContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { UsersTabContent } from '@/components/users/UsersTabContent';
import { useAuth } from '@/hooks/useAuth';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

export function Users() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'teams' || tab === 'users') setActiveTab(tab);
  }, [location.search]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamListItem | null>(null);
  const [teamHistoryTeam, setTeamHistoryTeam] = useState<TeamListItem | null>(
    null
  );

  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreateUser = hasPermission(PERMISSIONS.USERS.CREATE);
  const canViewTeams = hasPermission(PERMISSIONS.TEAMS.VIEW);
  const canCreateTeam = hasPermission(PERMISSIONS.TEAMS.CREATE);
  const canEditTeam = hasPermission(PERMISSIONS.TEAMS.EDIT);
  const canDeleteTeam = hasPermission(PERMISSIONS.TEAMS.DELETE);

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

  const headerAction =
    activeTab === 'teams'
      ? canCreateTeam && (
          <Button onClick={() => setShowCreateTeam(true)}>
            <Plus className="h-4 w-4" />
            Add team
          </Button>
        )
      : canCreateUser && (
          <Button onClick={() => setShowCreateUser(true)}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        );

  return (
    <>
      <PageHeader title="User & Team Management" action={headerAction} />

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
          <UsersTabContent />

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
