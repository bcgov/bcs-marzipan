import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
import { fetchRoles, fetchTeams, fetchUsers } from '@/api/usersApi';
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
import { Skeleton } from '@/components/ui/skeleton';
import { UserManagementFilters } from '@/components/users/UserManagementFilters';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

const IDIR_PLACEHOLDER = 'MYIDIR';
const SKELETON_ROW_COUNT = 8;
const SKELETON_DELAY_MS = 300;
const TABLE_COLUMN_COUNT = 7;
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

export function UsersTabContent() {
  const navigate = useNavigate();
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

  const { data: teamsForFilter = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
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

  const onPaginationChangeStable = useCallback(
    (
      updaterOrValue:
        ((prev: typeof pagination) => typeof pagination) | typeof pagination
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
    data: displayedUsers,
    columns: userColumns,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: onPaginationChangeStable,
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
      <TableScrollContainer ref={tableScrollRef}>
        <table
          className={`${tableTable} min-w-[640px]`}
          role="grid"
          aria-colcount={TABLE_COLUMN_COUNT}
        >
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead className={tableThead}>
            <tr>
              <th className={tableTh}>
                <span className="inline-flex items-center gap-1">
                  Name
                  <SortIndicator
                    columnId="name"
                    sortKey={sortKey}
                    sortDirection={
                      sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION
                    }
                    className="h-4 w-4"
                  />
                </span>
              </th>
              <th className={tableTh}>Email</th>
              <th className={tableTh}>IDIR</th>
              <th className={tableTh}>
                <span className="inline-flex items-center gap-1">
                  Role
                  <SortIndicator
                    columnId="role"
                    sortKey={sortKey}
                    sortDirection={
                      sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION
                    }
                    className="h-4 w-4"
                  />
                </span>
              </th>
              <th className={tableTh}>Teams</th>
              <th className={tableTh}>Status</th>
              <th className={tableTh}>
                <span className="inline-flex items-center gap-1">
                  Last updated
                  <SortIndicator
                    columnId="lastUpdated"
                    sortKey={sortKey}
                    sortDirection={
                      sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION
                    }
                    className="h-4 w-4"
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && showSkeleton ? (
              Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                <tr key={i} className={tableBodyRow} aria-hidden>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-28" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-36" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-14" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-24" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-14" />
                  </td>
                  <td className={tableTd}>
                    <Skeleton className="h-5 w-20" />
                  </td>
                </tr>
              ))
            ) : displayedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMN_COUNT}
                  className={`${tableTd} py-12 text-center text-slate-500`}
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
                  className={`${tableBodyRow} group cursor-pointer`}
                  tabIndex={0}
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(
                        'a,button,[data-no-row-nav]'
                      )
                    )
                      return;
                    if (window.getSelection()?.toString().trim()) return;
                    void navigate(`/users/${user.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    if (
                      (e.target as HTMLElement).closest(
                        'a,button,[data-no-row-nav]'
                      )
                    )
                      return;
                    e.preventDefault();
                    void navigate(`/users/${user.id}`);
                  }}
                >
                  <td className={`${tableTd} font-medium text-slate-900`}>
                    <span className="underline-offset-2 group-hover:underline">
                      {displayName(user)}
                    </span>
                  </td>
                  <td className={`${tableTd} text-slate-600`}>
                    {user.adEmail ?? '-'}
                  </td>
                  <td className={`${tableTd} text-slate-600`}>
                    {IDIR_PLACEHOLDER}
                  </td>
                  <td className={tableTd}>
                    <span className="rounded border border-slate-200 px-2 py-0.5 text-xs">
                      {user.roleName}
                    </span>
                  </td>
                  <td className={tableTd}>
                    <div className="flex flex-wrap gap-1">
                      {user.teams.length === 0 ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        user.teams.map((t) => (
                          <Link
                            key={t.teamId}
                            to={`/teams/${t.teamId}`}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {t.teamName}
                            {t.role !== 'member' ? ` (${t.role})` : ''}
                          </Link>
                        ))
                      )}
                    </div>
                  </td>
                  <td className={tableTd}>{statusBadge(user.isActive)}</td>
                  <td className={`${tableTd} text-sm text-slate-600`}>
                    {formatLastUpdated(
                      (user as { lastUpdatedDateTime?: string | null })
                        .lastUpdatedDateTime
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScrollContainer>
      {displayedUsers.length > 0 && (
        <TablePagination
          totalItems={displayedUsers.length}
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          onPageChange={(p) =>
            setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
          }
          onPageSizeChange={(ps) =>
            setPagination((prev) => ({ ...prev, pageSize: ps, pageIndex: 0 }))
          }
          scrollContainerRef={tableScrollRef}
          aria-label="Users table pagination"
        />
      )}
    </div>
  );
}
