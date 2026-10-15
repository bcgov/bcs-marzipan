import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import {
  fetchAdminRolePermissions,
  fetchPermissionAdminRoles,
  updateAdminRolePermissions,
  type AdminRolePermissionRow,
} from '@/api/lookupsApi';
import { AdminSection } from '@/components/admin/AdminSection';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_PERMISSION_ROWS: AdminRolePermissionRow[] = [];

export function RolePermissionsAdminSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManagePermissions = Boolean(
    user?.permissions?.includes('system.manage_permissions')
  );
  const [selectedRoleId, setSelectedRoleId] = useState<number>();
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedCategory, setSelectedCategory] = useState('');

  const rolesQuery = useQuery({
    queryKey: ['admin', 'role-permission-roles'],
    queryFn: fetchPermissionAdminRoles,
    enabled: canManagePermissions,
  });
  const rolePermissionsQuery = useQuery({
    queryKey: ['admin', 'role-permissions', selectedRoleId],
    queryFn: () => fetchAdminRolePermissions(selectedRoleId!),
    enabled: canManagePermissions && selectedRoleId !== undefined,
  });

  const rows = rolePermissionsQuery.data ?? EMPTY_PERMISSION_ROWS;
  const groupedRows = useMemo(() => {
    const groups = new Map<string, AdminRolePermissionRow[]>();
    for (const row of rows) {
      const categoryRows = groups.get(row.category) ?? [];
      categoryRows.push(row);
      groups.set(row.category, categoryRows);
    }
    return [...groups.entries()];
  }, [rows]);
  const visibleGroups = groupedRows.filter(([, categoryRows]) =>
    categoryRows.some((row) => !row.locked)
  );
  const toggleableRows = rows.filter((row) => !row.locked);
  const activeCategory = visibleGroups.some(
    ([category]) => category === selectedCategory
  )
    ? selectedCategory
    : (visibleGroups[0]?.[0] ?? '');
  const enabledPermissionCount = toggleableRows.filter((row) =>
    draftPermissionIds.has(row.id)
  ).length;

  useEffect(() => {
    const roles = rolesQuery.data ?? [];
    if (roles.length === 0) return;
    setSelectedRoleId((current) =>
      roles.some((role) => role.id === current) ? current : roles[0].id
    );
  }, [rolesQuery.data]);

  useEffect(() => {
    setDraftPermissionIds(
      new Set(rows.filter((row) => row.hasPermission).map((row) => row.id))
    );
  }, [selectedRoleId, rows]);

  const isDirty = rows.some(
    (row) => draftPermissionIds.has(row.id) !== row.hasPermission
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAdminRolePermissions(
        selectedRoleId!,
        [...draftPermissionIds].sort((left, right) => left - right)
      ),
    onSuccess: (updatedRows) => {
      queryClient.setQueryData(
        ['admin', 'role-permissions', selectedRoleId],
        updatedRows
      );
      void queryClient.invalidateQueries({
        queryKey: ['roles', selectedRoleId, 'permissions'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['roles', 'permissions', 'map'],
      });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(
        'Role permissions saved. Users on this role must sign in again.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save role permissions');
    },
  });

  if (!canManagePermissions) return null;

  const selectedRole = rolesQuery.data?.find(
    (role) => role.id === selectedRoleId
  );

  return (
    <AdminSection
      title="Role permissions"
      description="Manage permissions assigned to system roles. System permissions are fixed and cannot be changed here."
      headerAction={
        selectedRoleId !== undefined && (
          <div className="flex items-center gap-2">
            {isDirty && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={() => {
                    setDraftPermissionIds(
                      new Set(
                        rows
                          .filter((row) => row.hasPermission)
                          .map((row) => row.id)
                      )
                    );
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      <div className="mb-5 max-w-sm">
        <label
          htmlFor="role-permissions-role"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Role
        </label>
        <select
          id="role-permissions-role"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          value={selectedRoleId ?? ''}
          disabled={rolesQuery.isPending || saveMutation.isPending}
          onChange={(event) => {
            const nextRoleId = Number(event.target.value);
            if (
              isDirty &&
              !window.confirm('Discard unsaved permission changes?')
            ) {
              event.currentTarget.value = String(selectedRoleId ?? '');
              return;
            }
            setSelectedRoleId(nextRoleId);
          }}
        >
          {(rolesQuery.data ?? []).map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-slate-600">
          {selectedRole?.description && `${selectedRole.description} `}
          <span className="whitespace-nowrap">
            ({enabledPermissionCount} of {toggleableRows.length} permissions)
          </span>
        </p>
      </div>

      {rolesQuery.isError && (
        <p role="alert" className="text-sm text-red-700">
          Failed to load system roles.
        </p>
      )}
      {rolePermissionsQuery.isPending && selectedRoleId !== undefined && (
        <p className="text-sm text-slate-600">Loading permissions...</p>
      )}
      {rolePermissionsQuery.isError && (
        <p role="alert" className="text-sm text-red-700">
          Failed to load permissions for this role.
        </p>
      )}
      {!rolesQuery.isPending && rolesQuery.data?.length === 0 && (
        <p className="text-sm text-slate-600">No active system roles found.</p>
      )}

      {visibleGroups.length > 0 && (
        <Tabs
          value={activeCategory}
          onValueChange={setSelectedCategory}
          activationMode="automatic"
          className="w-full"
        >
          <TabsList
            variant="line"
            size="med"
            aria-label="Permission categories"
            className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-slate-200 p-0 pb-1"
          >
            {visibleGroups.map(([category, categoryRows]) => {
              const toggleableCategoryRows = categoryRows.filter(
                (row) => !row.locked
              );
              const enabledInCategory = toggleableCategoryRows.filter((row) =>
                draftPermissionIds.has(row.id)
              ).length;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex-none gap-2 rounded-none px-3 py-2 after:bottom-[-5px]"
                >
                  <span>{category}</span>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs leading-none font-medium text-blue-700">
                    {enabledInCategory}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {visibleGroups.map(([category, categoryRows]) => (
            <TabsContent key={category} value={category} className="mt-3">
              <div className="divide-y divide-slate-200">
                {categoryRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">
                        {row.displayName}
                      </div>
                      <code className="text-xs text-slate-600">{row.key}</code>
                      {row.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {row.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      aria-label={`${row.displayName} for ${selectedRole?.name ?? 'role'}`}
                      checked={draftPermissionIds.has(row.id)}
                      disabled={row.locked || saveMutation.isPending}
                      onCheckedChange={(checked) => {
                        setDraftPermissionIds((current) => {
                          const next = new Set(current);
                          if (checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </AdminSection>
  );
}
