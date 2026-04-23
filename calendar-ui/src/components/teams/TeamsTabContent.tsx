import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { History, MoreHorizontal, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { TeamListItem } from '@corpcal/shared/api/types';
import { fetchTeamsList } from '@/api/teamsApi';
import { SortIndicator } from '@/components/table/SortIndicator';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { TablePagination } from '@/components/table/TablePagination';
import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import { TableSummaryBar } from '@/components/table/TableSummaryBar';
import { TeamManagementFilters } from '@/components/teams/TeamManagementFilters';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

const SKELETON_ROW_COUNT = 8;
const SKELETON_DELAY_MS = 300;
const TABLE_COLUMN_COUNT = 6;

const DEFAULT_SORT_KEY = 'displayName';
const DEFAULT_SORT_DIRECTION = 'asc' as const;
const DEFAULT_PAGE_SIZE = 10;

type TeamSortKey = 'displayName' | 'members';

function compareTeams(
  a: TeamListItem,
  b: TeamListItem,
  sortKey: TeamSortKey,
  direction: 'asc' | 'desc'
): number {
  const mult = direction === 'asc' ? 1 : -1;
  switch (sortKey) {
    case 'displayName': {
      const na = (a.displayName ?? a.name ?? '').toLowerCase();
      const nb = (b.displayName ?? b.name ?? '').toLowerCase();
      return mult * na.localeCompare(nb);
    }
    case 'members':
      return mult * (a.memberCount - b.memberCount);
    default:
      return 0;
  }
}

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
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<TeamSortKey | null>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    DEFAULT_SORT_DIRECTION
  );
  const [showInactive, setShowInactive] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: lookupQueryKeys.teamsList(showInactive),
    queryFn: () => fetchTeamsList(!showInactive),
  });

  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    const id = window.setTimeout(
      () => setShowSkeleton(true),
      SKELETON_DELAY_MS
    );
    return () => window.clearTimeout(id);
  }, [isLoading]);

  const filteredTeams = useMemo(() => {
    if (!keyword.trim()) return teams;
    const q = keyword.trim().toLowerCase();
    return teams.filter((team) => {
      const displayName = (team.displayName ?? '').toLowerCase();
      const name = (team.name ?? '').toLowerCase();
      const description = (team.description ?? '').toLowerCase();
      return (
        displayName.includes(q) || name.includes(q) || description.includes(q)
      );
    });
  }, [teams, keyword]);

  const sortedTeams = useMemo(() => {
    const key = sortKey ?? DEFAULT_SORT_KEY;
    const dir = sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION;
    return [...filteredTeams].sort((a, b) => compareTeams(a, b, key, dir));
  }, [filteredTeams, sortKey, sortDirection]);

  const teamColumns = useMemo<ColumnDef<TeamListItem>[]>(
    () => [{ id: '_', header: () => null, cell: () => null }],
    []
  );

  const onPaginationChangeStable = useCallback(
    (
      updaterOrValue:
        | ((prev: typeof pagination) => typeof pagination)
        | typeof pagination
    ) => {
      setPagination((prev) => {
        const next =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue;
        if (
          next.pageIndex === prev.pageIndex &&
          next.pageSize === prev.pageSize
        ) {
          return prev;
        }
        return next;
      });
    },
    []
  );

  const table = useReactTable({
    data: sortedTeams,
    columns: teamColumns,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: onPaginationChangeStable,
    autoResetPageIndex: true,
  });

  const pageRows = table.getRowModel().rows.map((row) => row.original);

  const handleSortChange = (key: string | null, direction: 'asc' | 'desc') => {
    setSortKey(key as TeamSortKey | null);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-4">
      <TeamManagementFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        defaultSortKey={DEFAULT_SORT_KEY}
        defaultSortDirection={DEFAULT_SORT_DIRECTION}
        className="mb-4"
      />

      <TableSummaryBar
        count={sortedTeams.length}
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
      <TableScrollContainer ref={tableScrollRef}>
        <table
          className={`${tableTable} min-w-[640px]`}
          role="grid"
          aria-colcount={TABLE_COLUMN_COUNT}
        >
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead className={tableThead}>
            <tr>
              <th className={tableTh}>
                <span className="inline-flex items-center gap-1">
                  Display name
                  <SortIndicator
                    columnId="displayName"
                    sortKey={sortKey}
                    sortDirection={
                      sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION
                    }
                    className="h-4 w-4"
                  />
                </span>
              </th>
              <th className={tableTh}>Description</th>
              <th className={tableTh}>
                <span className="inline-flex items-center gap-1">
                  Members
                  <SortIndicator
                    columnId="members"
                    sortKey={sortKey}
                    sortDirection={
                      sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION
                    }
                    className="h-4 w-4"
                  />
                </span>
              </th>
              <th className={tableTh}>Ministry</th>
              <th className={tableTh}>Status</th>
              <th className={tableTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && showSkeleton ? (
              Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                <tr key={i} className={tableBodyRow} aria-hidden>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className={`${tableTd} max-w-[200px]`}>
                    <Skeleton className="h-5 w-full max-w-[180px]" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-14" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-8 w-8 rounded" />
                  </td>
                </tr>
              ))
            ) : sortedTeams.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMN_COUNT}
                  className={`${tableTd} py-12 text-center text-slate-500`}
                >
                  {keyword.trim()
                    ? 'No teams match your search'
                    : showInactive
                      ? 'No teams found'
                      : 'No active teams. Show inactive to see all.'}
                </td>
              </tr>
            ) : (
              pageRows.map((team) => (
                <tr key={team.id} className={tableBodyRow}>
                  <td className={`${tableTd} font-medium text-slate-900`}>
                    {team.displayName ?? team.name ?? '-'}
                  </td>
                  <td
                    className={`${tableTd} max-w-[200px] truncate text-slate-600`}
                  >
                    {team.description ?? '-'}
                  </td>
                  <td className={`${tableTd} text-slate-600`}>
                    {team.memberCount}{' '}
                    {team.memberCount === 1 ? 'member' : 'members'}
                  </td>
                  <td className={`${tableTd} text-slate-600`}>
                    {team.ministryName ?? '-'}
                  </td>
                  <td className={tableTd}>{statusBadge(team.isActive)}</td>
                  <td className={tableTd}>
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
              ))
            )}
          </tbody>
        </table>
      </TableScrollContainer>
      {sortedTeams.length > 0 && (
        <TablePagination
          totalItems={sortedTeams.length}
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          onPageChange={(p) =>
            setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
          }
          onPageSizeChange={(ps) =>
            setPagination((prev) => ({ ...prev, pageSize: ps, pageIndex: 0 }))
          }
          scrollContainerRef={tableScrollRef}
          aria-label="Teams table pagination"
        />
      )}
    </div>
  );
}
