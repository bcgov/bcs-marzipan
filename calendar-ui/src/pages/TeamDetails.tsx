import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import { fetchTeamById } from '@/api/teamsApi';
import { fetchUserActivityCounts } from '@/api/usersApi';
import { PageContainer } from '@/components/layout';
import AddTeamMemberModal from '@/components/teams/AddTeamMemberModal';
import RemoveTeamMemberModal from '@/components/teams/RemoveTeamMemberModal';
import { TeamEditModal } from '@/components/teams/TeamEditModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface RemovableTeamMember {
  userId: number;
  userName: string;
  adEmail?: string | null;
}

export function TeamDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ? parseInt(params.id, 10) : NaN;

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeamById(id),
    enabled: !Number.isNaN(id),
  });

  const teamMembers = team?.members ?? [];
  const memberIds = teamMembers.map((member) => member.userId);
  const {
    data: memberActivityCounts,
    isLoading: isMemberActivityCountsLoading,
    isFetching: isMemberActivityCountsFetching,
    isError: isMemberActivityCountsError,
  } = useQuery({
    queryKey: ['users', 'activity-counts', memberIds],
    queryFn: async () => {
      const rows = await fetchUserActivityCounts(memberIds);
      return new Map<number, number>(
        rows.map((row) => [row.userId, Number(row.activityCount) || 0])
      );
    },
    enabled: !Number.isNaN(id) && memberIds.length > 0,
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<RemovableTeamMember | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
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
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600">
                  Team members
                </h3>
                <div>
                  {hasPermission(PERMISSIONS.USERS.EDIT) ? (
                    <Button size="sm" onClick={() => setShowAddMember(true)}>
                      + Add member
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <Input
                  placeholder="Search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="mt-3 overflow-x-auto rounded-md border">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-sm text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Teams</th>
                      <th className="px-3 py-2">Activities</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Last updated</th>
                      <th className="px-3 py-2"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.members && team.members.length > 0 ? (
                      team.members
                        .filter((m) => {
                          if (!memberSearch) return true;
                          const q = memberSearch.toLowerCase();
                          const name = (m.userName ?? '').toLowerCase();
                          const email = (
                            (m as any).adEmail ?? ''
                          ).toLowerCase();
                          return name.includes(q) || email.includes(q);
                        })
                        .map((m) => (
                          <tr key={m.userId} className="border-t">
                            <td className="px-3 py-2">
                              {m.userName ?? `User ${m.userId}`}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {(m as any).adEmail ?? ''}
                            </td>
                            <td className="px-3 py-2">
                              <span className="rounded-md border px-2 py-1 text-sm text-slate-600">
                                {m.role}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {team.displayName ?? team.name}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {(() => {
                                if (
                                  isMemberActivityCountsLoading ||
                                  isMemberActivityCountsFetching
                                ) {
                                  return '...';
                                }
                                if (isMemberActivityCountsError) return '-';
                                return String(
                                  memberActivityCounts?.get(m.userId) ?? 0
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-sm text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">-</td>
                            <td className="px-3 py-2">
                              {hasPermission(PERMISSIONS.USERS.EDIT) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setMemberToRemove({
                                      userId: m.userId,
                                      userName:
                                        m.userName ?? `User ${m.userId}`,
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-6 text-center text-slate-500"
                        >
                          No members
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                sortOrder: team.sortOrder,
                isActive: team.isActive,
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
      <AddTeamMemberModal
        open={showAddMember}
        teamId={team.id}
        existingMemberIds={
          team.members ? team.members.map((m) => m.userId) : []
        }
        onClose={() => setShowAddMember(false)}
        onAdded={() => {
          setShowAddMember(false);
          void queryClient.invalidateQueries({ queryKey: ['team', id] });
        }}
      />
      <RemoveTeamMemberModal
        open={!!memberToRemove}
        teamId={team.id}
        teamName={team.displayName ?? team.name}
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onRemoved={() => {
          setMemberToRemove(null);
          void queryClient.invalidateQueries({ queryKey: ['team', id] });
        }}
      />
    </>
  );
}

export default TeamDetails;
