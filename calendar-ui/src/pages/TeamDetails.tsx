import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Loader2, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import { fetchTeamById } from '@/api/teamsApi';
import { fetchUserActivityCounts, fetchUsers } from '@/api/usersApi';
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

  const { data: teamUsers = [] } = useQuery({
    queryKey: ['users', 'team-members', id, memberIds],
    queryFn: () => fetchUsers({ teamIds: [id] }),
    enabled: !Number.isNaN(id),
    staleTime: 30_000,
  });

  const userLastUpdatedById = useMemo(
    () =>
      new Map<number, string | null>(
        teamUsers.map((u) => [u.id, u.lastUpdatedDateTime ?? null])
      ),
    [teamUsers]
  );

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

  const formatMemberLastUpdated = (member: any) => {
    const raw =
      userLastUpdatedById.get(member.userId) ??
      member.updatedAt ??
      member.lastUpdatedAt ??
      member.modifiedAt ??
      member.userUpdatedAt;
    if (!raw) return '-';
    const parsed = new Date(String(raw));
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-CA', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredMembers = teamMembers.filter((m) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    const name = (m.userName ?? '').toLowerCase();
    const email = ((m as any).adEmail ?? '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

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

        <div className="space-y-6">
          <div className="ml-2 max-w-3xl">
            <div className="relative">
              <h2
                className="mb-2 pr-28 text-slate-900"
                style={{
                  fontFamily: 'var(--Font-family-Base, "BC Sans")',
                  fontSize: 'var(--Font-size-800, 32px)',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  lineHeight: 'var(--Line-height-800, 40px)',
                }}
              >
                {team.displayName ?? team.name}
              </h2>
              {hasPermission(PERMISSIONS.TEAMS.EDIT) ? (
                <div className="absolute top-1 right-0">
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

            <div className="space-y-1.5">
              {team.abbreviation ? (
                <p
                  className="text-slate-900"
                  style={{
                    fontFamily:
                      'var(--Typescale-Body-2-font-family, "BC Sans")',
                    fontSize: 'var(--Typescale-Body-2-font-size, 16px)',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: 'var(--Typescale-Body-2-line-height, 22px)',
                  }}
                >
                  {team.abbreviation}
                </p>
              ) : null}
              {team.ministryName ? (
                <p
                  className="text-slate-800"
                  style={{
                    fontFamily:
                      'var(--Typescale-Body-2-font-family, "BC Sans")',
                    fontSize: 'var(--Typescale-Body-2-font-size, 16px)',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: 'var(--Typescale-Body-2-line-height, 22px)',
                  }}
                >
                  {team.ministryName}
                </p>
              ) : null}
              {team.description ? (
                <p
                  className="text-slate-800"
                  style={{
                    fontFamily:
                      'var(--Typescale-Body-2-font-family, "BC Sans")',
                    fontSize: 'var(--Typescale-Body-2-font-size, 16px)',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: 'var(--Typescale-Body-2-line-height, 22px)',
                  }}
                >
                  {team.description}
                </p>
              ) : null}
              <div className="pt-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-sm font-medium ${
                    team.isActive
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-400 text-white'
                  }`}
                >
                  {team.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-5xl">
            <div className="flex items-center justify-between">
              <h3
                style={{
                  color: 'var(--NeutralForeground1-Rest, #000000)',
                  fontFamily: 'var(--Typescale-Title-3-font-family, "BC Sans")',
                  fontSize: 'var(--Typescale-Title-3-font-size, 24px)',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  lineHeight: 'var(--Typescale-Title-3-line-height, 32px)',
                }}
              >
                Team members
              </h3>
              {hasPermission(PERMISSIONS.USERS.EDIT) ? (
                <Button size="sm" onClick={() => setShowAddMember(true)}>
                  + Add member
                </Button>
              ) : null}
            </div>

            <div className="mt-3 space-y-3">
              <div className="relative max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  placeholder="Search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-slate-700">
                Showing {filteredMembers.length} users
              </p>
            </div>

            <div className="mt-3 overflow-x-auto rounded-md border">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-700">
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
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr key={m.userId} className="border-t">
                        <td className="px-3 py-2">
                          {m.userName ?? `User ${m.userId}`}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {(m as any).adEmail ?? ''}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-md border px-2 py-1 text-sm text-slate-700">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700">
                            {team.displayName ?? team.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {(() => {
                            if (
                              isMemberActivityCountsLoading ||
                              isMemberActivityCountsFetching
                            ) {
                              return '...';
                            }
                            if (isMemberActivityCountsError) return '-';
                            return `${String(
                              memberActivityCounts?.get(m.userId) ?? 0
                            )} active`;
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatMemberLastUpdated(m)}
                        </td>
                        <td className="px-3 py-2">
                          {hasPermission(PERMISSIONS.USERS.EDIT) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="focus-visible:ring-primary/30 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2"
                              onClick={() =>
                                setMemberToRemove({
                                  userId: m.userId,
                                  userName: m.userName ?? `User ${m.userId}`,
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
