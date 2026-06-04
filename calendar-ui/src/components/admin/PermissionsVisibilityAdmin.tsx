import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import React from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import {
  fetchAllPermissions,
  updatePermissionVisibility,
} from '@/api/lookupsApi';
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
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        Permission Visibility (User Management)
      </h3>
      <div className="overflow-auto">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr>
              <th className="w-1/3 pr-4">Permission</th>
              <th className="w-1/3 pr-4">Display name</th>
              <th className="w-1/3 pr-4">Visible in user management</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={3}>Loading...</td>
              </tr>
            ) : (
              perms.map((p: any) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="py-2 pr-4 text-sm text-slate-700">{p.key}</td>
                  <td className="py-2 pr-4 text-sm text-slate-700">
                    {p.displayName}
                  </td>
                  <td className="py-2 pr-4">
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
      </div>
    </div>
  );
}

export default PermissionsVisibilityAdmin;
