import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo, useState, type ReactElement } from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import {
  fetchAllPermissions,
  updatePermissionVisibility,
} from '@/api/lookupsApi';
import { AdminSection } from '@/components/admin';
import { GenericDataTable } from '@/components/table/GenericDataTable';
import {
  tableContainer,
  tableScrollWrapper,
} from '@/components/table/tableConstants';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type AdminPermissionRow = {
  id: number;
  key: string;
  displayName: string;
  description: string | null;
  showInUserManagement: boolean;
};

export function PermissionsVisibilityAdmin(): ReactElement | null {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: perms = [], isPending } = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: fetchAllPermissions,
    enabled: Boolean(
      (user as { permissions?: string[] })?.permissions?.includes(
        'system.manage_permissions'
      ) ||
      (user as { roleId?: number })?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN
    ),
  });

  const [search, setSearch] = useState('');

  const filteredPerms = useMemo(() => {
    const list = (perms as AdminPermissionRow[]).filter((p) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.key.toLowerCase().includes(s) ||
        p.displayName.toLowerCase().includes(s) ||
        String(p.description ?? '')
          .toLowerCase()
          .includes(s)
      );
    });
    return list;
  }, [perms, search]);

  const mutation = useMutation({
    mutationFn: ({ id, show }: { id: number; show: boolean }) =>
      updatePermissionVisibility(id, show),
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'permissions'],
      });

      const adminPerms =
        queryClient.getQueryData<AdminPermissionRow[]>([
          'admin',
          'permissions',
        ]) || [];
      const permEntry = adminPerms.find((p) => p.id === vars.id);
      const displayName =
        permEntry?.displayName ?? permEntry?.description ?? data?.data?.key;

      queryClient.setQueryData(
        ['roles', 'permissions', 'map'],
        (prev: Record<number, { key: string }[]> | undefined) => {
          const next = prev ? { ...prev } : {};
          const key = data?.data?.key;
          if (vars.show) {
            void displayName;
          } else {
            for (const k of Object.keys(next)) {
              next[Number(k)] = (next[Number(k)] || []).filter(
                (e) => e.key !== key
              );
              if ((next[Number(k)] || []).length === 0) delete next[Number(k)];
            }
          }
          return next;
        }
      );

      void queryClient.invalidateQueries({
        queryKey: ['roles', 'permissions', 'map'],
      });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });

      toast.success('Permission visibility updated');
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || 'Failed to update permission');
    },
  });

  const columns = useMemo<ColumnDef<AdminPermissionRow>[]>(
    () => [
      {
        accessorKey: 'key',
        header: 'Permission',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">{row.original.key}</span>
        ),
      },
      {
        accessorKey: 'displayName',
        header: 'Display name',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.displayName}
          </span>
        ),
      },
      {
        id: 'showInUserManagement',
        header: 'Visible in user management',
        enableSorting: false,
        cell: ({ row }) => (
          <Switch
            checked={Boolean(row.original.showInUserManagement)}
            onCheckedChange={(v) =>
              mutation.mutate({ id: row.original.id, show: Boolean(v) })
            }
            disabled={mutation.isPending}
          />
        ),
      },
    ],
    [mutation]
  );

  const canManagePermissions = Boolean(
    (user as { permissions?: string[] })?.permissions?.includes(
      'system.manage_permissions'
    ) || (user as { roleId?: number })?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN
  );
  if (!canManagePermissions) return null;

  return (
    <AdminSection
      title="Permission visibility"
      description="Show or hide permissions in user management; does not grant or revoke access."
      sectionId="permissions-visibility"
      isLoading={isPending}
      headerAction={
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search permissions"
            className="h-9 w-44 rounded-md border border-slate-300 bg-white pr-3 pl-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
          />
        </div>
      }
    >
      {isPending ? (
        <div className="py-8 text-center text-slate-600">Loading...</div>
      ) : filteredPerms.length === 0 ? (
        <div className="py-8 text-center text-slate-600">
          No permissions found
        </div>
      ) : (
        <div
          className={cn(
            tableContainer,
            'max-h-[min(720px,90vh)] bg-white shadow-none'
          )}
        >
          <div
            className={cn(
              tableScrollWrapper,
              'max-h-[min(720px,90vh)] [overflow-y:auto]'
            )}
          >
            <GenericDataTable data={filteredPerms} columns={columns} />
          </div>
        </div>
      )}
    </AdminSection>
  );
}

export default PermissionsVisibilityAdmin;
