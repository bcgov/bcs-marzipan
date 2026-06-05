import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import React from 'react';

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

  const mutation = useMutation({
    mutationFn: ({ id, show }: { id: number; show: boolean }) =>
      updatePermissionVisibility(id, show),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'permissions'],
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
            perms.map((p: any) => (
              <tr key={p.id} className={tableBodyRow}>
                <td className={`${tableTd} text-sm text-slate-700`}>{p.key}</td>
                <td className={`${tableTd} text-sm text-slate-700`}>
                  {p.displayName}
                </td>
                <td className={tableTd}>
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
