import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ArrowLeftRight,
  History,
  MoreHorizontal,
  Pencil,
  UsersRound,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
import { fetchRoles, fetchTeams, fetchUsers } from '@/api/usersApi';
import { SortIndicator } from '@/components/Table/SortIndicator';
import { TablePagination } from '@/components/Table/TablePagination';
import { TableSummaryBar } from '@/components/Table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { UserManagementFilters } from '@/components/users/UserManagementFilters';

const IDIR_PLACEHOLDER = 'MYIDIR';
const TABLE_SCROLL_HEIGHT = 'min(480px, 60vh)';
const SKELETON_ROW_COUNT = 8;
const TABLE_COLUMN_COUNT = 8;
const DEFAULT_SORT_KEY = 'name';
const DEFAULT_SORT_DIRECTION = 'asc' as const;
const DEFAULT_PAGE_SIZE = 10;

type UserSortKey = 'name' | 'role' | 'lastUpdated';

function displayName(user: UserListItem): string {
  return user.adDisplayName || user.adUsername || `User ${user.id}`;
}

function formatLastUpdated(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  } catch {
    return '-';
  }
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

function compareUsers(
  a: UserListItem,
  b: UserListItem,
  sortKey: UserSortKey,
  direction: 'asc' | 'desc'
): number {
  const mult = direction === 'asc' ? 1 : -1;
  switch (sortKey) {
    case 'name': {
      const na = (a.adDisplayName ?? a.adUsername ?? '').toLowerCase();
      const nb = (b.adDisplayName ?? b.adUsername ?? '').toLowerCase();
      return mult * na.localeCompare(nb);
    }
    case 'role': {
      const ra = (a.roleName ?? '').toLowerCase();
      const rb = (b.roleName ?? '').toLowerCase();
      return mult * ra.localeCompare(rb);
    }
    case 'lastUpdated': {
      const ta = new Date(
        (a as { lastUpdatedDateTime?: string | null }).lastUpdatedDateTime ?? 0
      ).getTime();
      const tb = new Date(
        (b as { lastUpdatedDateTime?: string | null }).lastUpdatedDateTime ?? 0
      ).getTime();
      return mult * (ta - tb);
    }
    default:
      return 0;
  }
}

export interface UsersTabContentProps {
  canEdit: boolean;
  canTransfer: boolean;
  onEditUser: (user: UserListItem) => void;
  onTransfer: (user: UserListItem) => void;
  onViewHistory: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
  onReactivate: (user: UserListItem) => void;
}

export function UsersTabContent({
  canEdit,
  canTransfer,
  onEditUser,
  onTransfer,
  onViewHistory,
  onDeactivate,
  onReactivate,
}: UsersTabContentProps) {
  const [keyword, setKeyword] = useState('');
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<UserSortKey | null>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    DEFAULT_SORT_DIRECTION
  );
  const [showInactive, setShowInactive] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const fetchUsersParams = useMemo(
    () => ({
      search: keyword || undefined,
      teamIds: teamIds.length ? teamIds : undefined,
      roleIds: roleIds.length ? roleIds : undefined,
    }),
    [keyword, teamIds, roleIds]
  );

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', fetchUsersParams],
    queryFn: () => fetchUsers(fetchUsersParams),
  });

  const { data: teamsForFilter = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const { data: rolesForFilter = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const teamOptions = useMemo(
    () =>
      teamsForFilter.map((t) => ({
        value: String(t.id),
        label: t.displayName || t.name,
      })),
    [teamsForFilter]
  );

  const roleOptions = useMemo(
    () => rolesForFilter.map((r) => ({ value: String(r.id), label: r.name })),
    [rolesForFilter]
  );

  const sortedUsers = useMemo(() => {
    const key = sortKey ?? DEFAULT_SORT_KEY;
    const dir = sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION;
    return [...users].sort((a, b) => compareUsers(a, b, key, dir));
  }, [users, sortKey, sortDirection]);

  const displayedUsers = useMemo(() => {
    if (showInactive) return sortedUsers;
    return sortedUsers.filter((u) => u.isActive);
  }, [sortedUsers, showInactive]);

  const userColumns = useMemo<ColumnDef<UserListItem>[]>(
    () => [{ id: '_', header: () => null, cell: () => null }],
    []
  );

  const table = useReactTable({
    data: displayedUsers,
    columns: userColumns,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    autoResetPageIndex: true,
  });

  const pageRows = table.getRowModel().rows.map((row) => row.original);

  const handleSortChange = (key: string | null, direction: 'asc' | 'desc') => {
    setSortKey(key as UserSortKey | null);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-4">
      <UserManagementFilters
        keyword={keyword}
        teamIds={teamIds}
        roleIds={roleIds}
        onKeywordChange={setKeyword}
        onTeamIdsChange={setTeamIds}
        onRoleIdsChange={setRoleIds}
        teamOptions={teamOptions}
        roleOptions={roleOptions}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        defaultSortKey={DEFAULT_SORT_KEY}
        defaultSortDirection={DEFAULT_SORT_DIRECTION}
        className="mb-4"
      />

      <TableSummaryBar
        count={displayedUsers.length}
        singularLabel="user"
        pluralLabel="users"
        filters={[
          {
            id: 'show-inactive',
            label: 'Show inactive',
            checked: showInactive,
            onCheckedChange: setShowInactive,
          },
        ]}
      />
      <div
        className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
        style={{ height: TABLE_SCROLL_HEIGHT }}
      >
        <div ref={tableScrollRef} className="min-h-0 flex-1 overflow-auto">
          <table
            className="w-full min-w-[640px] table-fixed border-collapse"
            role="grid"
            aria-colcount={TABLE_COLUMN_COUNT}
          >
            <colgroup>
              <col style={{ width: '16%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    Name
                    <SortIndicator
                      columnId="name"
                      sortKey={sortKey}
                      sortDirection={
                        sortKey !== null
                          ? sortDirection
                          : DEFAULT_SORT_DIRECTION
                      }
                      className="h-4 w-4"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  IDIR
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    Role
                    <SortIndicator
                      columnId="role"
                      sortKey={sortKey}
                      sortDirection={
                        sortKey !== null
                          ? sortDirection
                          : DEFAULT_SORT_DIRECTION
                      }
                      className="h-4 w-4"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Teams
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    Last updated
                    <SortIndicator
                      columnId="lastUpdated"
                      sortKey={sortKey}
                      sortDirection={
                        sortKey !== null
                          ? sortDirection
                          : DEFAULT_SORT_DIRECTION
                      }
                      className="h-4 w-4"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                  <tr key={i} className="border-b border-slate-100" aria-hidden>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-28" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-14" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-14" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-8 rounded" />
                    </td>
                  </tr>
                ))
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    {keyword || teamIds.length > 0 || roleIds.length > 0
                      ? 'No users match your filters'
                      : 'No users found'}
                  </td>
                </tr>
              ) : (
                pageRows.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {displayName(user)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.adEmail ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {IDIR_PLACEHOLDER}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded border border-slate-200 px-2 py-0.5 text-xs">
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.teams.length === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          user.teams.map((t) => (
                            <span
                              key={t.teamId}
                              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {t.teamName}
                              {t.role !== 'member' ? ` (${t.role})` : ''}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(user.isActive)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatLastUpdated(
                        (user as { lastUpdatedDateTime?: string | null })
                          .lastUpdatedDateTime
                      )}
                    </td>
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
                            <DropdownMenuItem onClick={() => onEditUser(user)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canEdit && (
                            <DropdownMenuItem onClick={() => onEditUser(user)}>
                              <UsersRound className="h-4 w-4" />
                              Add to team / Edit teams
                            </DropdownMenuItem>
                          )}
                          {canTransfer && (
                            <DropdownMenuItem onClick={() => onTransfer(user)}>
                              <ArrowLeftRight className="h-4 w-4" />
                              Transfer activities
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onViewHistory(user)}>
                            <History className="h-4 w-4" />
                            View history
                          </DropdownMenuItem>
                          {canEdit && user.isActive && (
                            <DropdownMenuItem
                              onClick={() => onDeactivate(user)}
                              variant="destructive"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          {canEdit && !user.isActive && (
                            <DropdownMenuItem
                              onClick={() => onReactivate(user)}
                            >
                              Reactivate
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
        </div>
      </div>
      {displayedUsers.length > 0 && (
        <TablePagination
          totalItems={displayedUsers.length}
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          onPageChange={(p) => {
            setPagination((prev) => ({ ...prev, pageIndex: p - 1 }));
            tableScrollRef.current?.scrollTo({ top: 0 });
          }}
          onPageSizeChange={(ps) => {
            setPagination((prev) => ({ ...prev, pageSize: ps, pageIndex: 0 }));
            tableScrollRef.current?.scrollTo({ top: 0 });
          }}
          aria-label="Users table pagination"
        />
      )}
    </div>
  );
}
