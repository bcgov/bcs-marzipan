import { useQuery } from '@tanstack/react-query';
import { History, Loader2, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';

import type { TeamListItem } from '@corpcal/shared/api/types';
import { fetchTeamsList } from '@/api/teamsApi';
import { TableSummaryBar } from '@/components/Table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamsTabContentProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAddTeam: () => void;
  onEditTeam: (team: TeamListItem) => void;
  onViewHistory: (team: TeamListItem) => void;
  onDeactivate?: (team: TeamListItem) => void;
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

export function TeamsTabContent({
  // canCreate,
  canEdit,
  canDelete,
  // onAddTeam,
  onEditTeam,
  onViewHistory,
  onDeactivate,
}: TeamsTabContentProps) {
  const [showInactive, setShowInactive] = useState(false);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', 'list', showInactive],
    queryFn: () => fetchTeamsList(!showInactive),
  });

  return (
    <div className="space-y-4">
      <TableSummaryBar
        count={teams.length}
        singularLabel="team"
        pluralLabel="teams"
        filters={[
          {
            id: 'show-inactive',
            label: 'Show inactive',
            checked: showInactive,
            onCheckedChange: setShowInactive,
          },
        ]}
      />
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
                  Display name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Members
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Ministries
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
              {teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {team.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {team.displayName ?? '-'}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                    {team.description ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {team.memberCount}{' '}
                    {team.memberCount === 1 ? 'member' : 'members'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {team.ministryCount}{' '}
                    {team.ministryCount === 1 ? 'ministry' : 'ministries'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(team.isActive)}</td>
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
                          <DropdownMenuItem onClick={() => onEditTeam(team)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onViewHistory(team)}>
                          <History className="h-4 w-4" />
                          View history
                        </DropdownMenuItem>
                        {canDelete && team.isActive && onDeactivate && (
                          <DropdownMenuItem
                            onClick={() => onDeactivate(team)}
                            variant="destructive"
                          >
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teams.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              {showInactive
                ? 'No teams found'
                : 'No active teams. Show inactive to see all.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
