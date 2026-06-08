import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchTeamById } from '@/api/teamsApi';
import { ActivityFormStickyHeader } from '@/components/activity/ActivityFormStickyHeader';
import { PageContainer, PageHeader } from '@/components/layout';

export function TeamDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ? parseInt(params.id, 10) : NaN;

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeamById(id),
    enabled: !Number.isNaN(id),
  });

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
      <ActivityFormStickyHeader onBack={handleBack} />

      <PageContainer variant="narrow" className="space-y-6">
        <PageHeader
          title={team.displayName ?? team.name}
          description={team.description ?? undefined}
        />

        <div>
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
    </>
  );
}

export default TeamDetails;
