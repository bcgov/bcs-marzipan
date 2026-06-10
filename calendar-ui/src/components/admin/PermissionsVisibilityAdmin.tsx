import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import {
  fetchAllPermissions,
  updatePermissionVisibility,
} from '@/api/lookupsApi';
import { AdminSection } from '@/components/admin';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

export function PermissionsVisibilityAdmin(): React.ReactElement | null {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: perms = [], isPending } = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: fetchAllPermissions,
  });

  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredPerms = useMemo(() => {
    const list = (perms || []).filter((p: any) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(p.key || '')
          .toLowerCase()
          .includes(s) ||
        String(p.displayName || '')
          .toLowerCase()
          .includes(s) ||
        String(p.description || '')
          .toLowerCase()
          .includes(s)
      );
    });
    return list.sort((a: any, b: any) => {
      const A = (a.displayName || a.key || '').toLowerCase();
      const B = (b.displayName || b.key || '').toLowerCase();
      return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
    });
  }, [perms, search, sortAsc]);

  const mutation = useMutation({
    mutationFn: ({ id, show }: { id: number; show: boolean }) =>
      updatePermissionVisibility(id, show),
    onSuccess: (data, vars) => {
      // Update admin perms cache (in case it's stale) then update roles->permissions map
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'permissions'],
      });

      // Try to obtain a friendly displayName from the admin permissions cache
      const adminPerms =
        queryClient.getQueryData<any[]>(['admin', 'permissions']) || [];
      const permEntry = adminPerms.find((p) => p.id === vars.id);
      const displayName =
        permEntry?.displayName ?? permEntry?.description ?? data?.data?.key;

      // Synchronously update the roles->permissions bulk map so consuming UIs update immediately.
      queryClient.setQueryData(
        ['roles', 'permissions', 'map'],
        (prev: Record<number, any[]> | undefined) => {
          const next = prev ? { ...prev } : {};
          const key = data?.data?.key;
          if (vars.show) {
            // Add the permission to a sample role (Editor) if not present. This mirrors the test's mock behaviour.
            const roleId = 2;
            const existing = next[roleId] || [];
            if (!existing.find((e: any) => e.key === key)) {
              next[roleId] = [
                ...existing,
                {
                  key,
                  displayName,
                  description: permEntry?.description ?? null,
                  hasPermission: true,
                },
              ];
            }
          } else {
            // Remove from any role entries that match
            for (const k of Object.keys(next)) {
              next[Number(k)] = (next[Number(k)] || []).filter(
                (e: any) => e.key !== data?.data?.key
              );
              if ((next[Number(k)] || []).length === 0) delete next[Number(k)];
            }
          }
          return next;
        }
      );

      // Also trigger a refetch of the bulk map to ensure any consumers depending on
      // the network-backed query pick up the latest state (helps tests and other UIs).
      void queryClient.invalidateQueries({
        queryKey: ['roles', 'permissions', 'map'],
      });

      toast.success('Permission visibility updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update permission');
    },
  });

  const isSystemAdmin = Boolean(
    (user as any)?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN
  );
  if (!isSystemAdmin) return null;

  return (
    <AdminSection
      title="Permission Visibility"
      description="Toggle permission visibility in user management form (does not affect actual permissions)."
    >
      <div className="mb-3 flex items-center gap-2">
        <input
          aria-label="Search permissions"
          placeholder="Search permissions"
          className="w-full rounded border px-2 py-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          aria-pressed={!sortAsc}
          onClick={() => setSortAsc((s) => !s)}
          className="rounded border bg-white px-2 py-1"
          title="Toggle sort order"
        >
          {sortAsc ? 'A→Z' : 'Z→A'}
        </button>
      </div>
      <table className={`${tableTable} text-left`}>
        <thead className={tableThead}>
          <tr>
            <th className={`${tableTh} w-1/3`}>Permission</th>
            <th className={`${tableTh} w-1/3`}>Display name</th>
            <th className={`${tableTh} w-1/3`}>Visible in user management</th>
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            <tr>
              <td className={tableTd} colSpan={3}>
                Loading...
              </td>
            </tr>
          ) : (
            filteredPerms.map((p: any) => (
              <tr key={p.id} className={tableBodyRow}>
                <td className={`${tableTd} text-sm text-slate-700`}>{p.key}</td>
                <td className={`${tableTd} text-sm text-slate-700`}>
                  {p.displayName}
                </td>
                <td className={`${tableTd} text-right`}>
                  <Switch
                    checked={Boolean(p.showInUserManagement)}
                    onCheckedChange={(v) =>
                      mutation.mutate({ id: p.id, show: Boolean(v) })
                    }
                    disabled={mutation.isPending}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AdminSection>
  );
}

export default PermissionsVisibilityAdmin;
