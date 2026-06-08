import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { fetchTeamById } from '@/api/teamsApi';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';

export function TeamDetails() {
  const params = useParams();
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

  return (
    <div>
      <PageHeader
        title={team.displayName ?? team.name}
        description={team.description ?? undefined}
        action={
          <Button asChild>
            <Link to="/users">Back to users</Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="grid max-w-3xl grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-600">Name</h3>
            <p className="text-slate-900">{team.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600">Abbreviation</h3>
            <p className="text-slate-900">{team.abbreviation ?? '-'}</p>
          </div>
          <div className="col-span-2">
            <h3 className="text-sm font-medium text-slate-600">Description</h3>
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
    </div>
  );
}

export default TeamDetails;
