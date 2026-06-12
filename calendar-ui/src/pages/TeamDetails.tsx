import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import { fetchTeamById } from '@/api/teamsApi';
import { PageContainer } from '@/components/layout';
import { TeamEditModal } from '@/components/teams/TeamEditModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function TeamDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ? parseInt(params.id, 10) : NaN;

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeamById(id),
    enabled: !Number.isNaN(id),
  });

  const queryClient = useQueryClient();
  const [showEditTeam, setShowEditTeam] = useState(false);
  const { hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="py-12 text-center text-slate-500">Team not found</div>
    );
  }

  const handleBack = () => {
    void navigate('/users?tab=teams');
  };

  return (
    <>
      <PageContainer variant="narrow" className="space-y-6">
        <div className="flex items-center justify-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="shrink-0 gap-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Go back
          </Button>
        </div>

        <div>
          <div className="flex items-start gap-4">
            <div>
              <h2 className="text-2xl leading-tight font-semibold">
                {team.displayName ?? team.name}
              </h2>
              {team.description && (
                <div className="mt-1 text-sm text-slate-600">
                  {team.description}
                </div>
              )}
            </div>

            <div className="ms-auto">
              {/* Edit button placed inline with heading to match UserDetailPage */}
              {hasPermission(PERMISSIONS.TEAMS.EDIT) ? (
                <div className="ml-0.5">
                  <Button
                    size="sm"
                    onClick={() => setShowEditTeam(true)}
                    className="focus-visible:ring-primary/30 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2"
                    aria-label="Edit team"
                  >
                    <Edit className="h-4 w-4" aria-hidden />
                    Edit
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-600">Name</h3>
              <p className="text-slate-900">{team.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">
                Abbreviation
              </h3>
              <p className="text-slate-900">{team.abbreviation ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-slate-600">
                Description
              </h3>
              <p className="text-slate-900">{team.description ?? '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Ministry</h3>
              <p className="text-slate-900">{team.ministryName ?? '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Members</h3>
              <div className="mt-2 flex flex-col gap-2">
                {team.members && team.members.length > 0 ? (
                  team.members.map((m) => (
                    <div key={m.userId} className="text-slate-900">
                      {m.userName ?? `User ${m.userId}`}{' '}
                      <span className="text-slate-500">— {m.role}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">No members</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
      <TeamEditModal
        team={
          team
            ? {
                id: team.id,
                name: team.name,
                displayName: team.displayName ?? null,
                abbreviation: team.abbreviation ?? '',
                description: team.description ?? null,
                sortOrder: (team as any).sortOrder ?? 0,
                isActive: (team as any).isActive ?? true,
                roleId: null,
                memberCount: team.members ? team.members.length : 0,
                ministryId: team.ministryId ?? null,
                ministryName: team.ministryName ?? null,
              }
            : null
        }
        open={showEditTeam}
        onClose={() => setShowEditTeam(false)}
        onSaved={() => {
          setShowEditTeam(false);
          if (!Number.isNaN(id)) {
            void queryClient.invalidateQueries({ queryKey: ['team', id] });
          }
        }}
      />
    </>
  );
}

export default TeamDetails;
