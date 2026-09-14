import { useQuery } from '@tanstack/react-query';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  UserPermissionOverride,
  UserPermissionOverrideInput,
} from '@corpcal/shared/api/types';
import {
  fetchOverridablePermissions,
  type RolePermissionRow,
} from '@/api/lookupsApi';
import { fetchRolePermissions } from '@/api/usersApi';
import { Switch } from '@/components/ui/switch';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import {
  buildInitialOverrideEffects,
  buildPermissionOverrideInputs,
  countActiveOverrides,
  getEffectivePermission,
  groupPermissionRowsByCategory,
  isPermissionCustomized,
  mergeUserRolePermissionRows,
  resolveToggleOverride,
  type PermissionOverrideEffect,
} from '@/lib/user-role-permissions';

const EMPTY_ROLE_ROWS: RolePermissionRow[] = [];
const EMPTY_OVERRIDABLE_CATALOG: Awaited<
  ReturnType<typeof fetchOverridablePermissions>
> = [];

export type UserRolePermissionsSectionProps = {
  roleId: number | null;
  /** Role persisted on the server; omit for create flows. */
  savedRoleId?: number | null;
  existingOverrides?: UserPermissionOverride[];
  canEdit?: boolean;
  onChange: (overrides: UserPermissionOverrideInput[]) => void;
};

export function UserRolePermissionsSection({
  roleId,
  savedRoleId,
  existingOverrides,
  canEdit = true,
  onChange,
}: UserRolePermissionsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [overrideEffects, setOverrideEffects] = useState<
    Record<string, PermissionOverrideEffect>
  >({});
  const [roleChangeNotice, setRoleChangeNotice] = useState(false);
  const previousRoleIdRef = useRef<number | null>(roleId);

  const {
    data: overridableCatalog = EMPTY_OVERRIDABLE_CATALOG,
    isLoading: isLoadingOverridable,
  } = useQuery({
    queryKey: lookupQueryKeys.overridablePermissions(),
    queryFn: fetchOverridablePermissions,
  });

  const {
    data: rolePermissionRows = EMPTY_ROLE_ROWS,
    isLoading: isLoadingRolePermissions,
  } = useQuery({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: () => fetchRolePermissions(roleId!),
    enabled: roleId != null,
  });

  const permissionRows = useMemo(
    () => mergeUserRolePermissionRows(rolePermissionRows, overridableCatalog),
    [overridableCatalog, rolePermissionRows]
  );

  const groupedRows = useMemo(
    () => groupPermissionRowsByCategory(permissionRows),
    [permissionRows]
  );

  const shouldUseSavedOverrides =
    savedRoleId == null ? true : roleId === savedRoleId;

  const initialOverrideEffects = useMemo(
    () =>
      buildInitialOverrideEffects(
        permissionRows,
        shouldUseSavedOverrides ? existingOverrides : []
      ),
    [existingOverrides, permissionRows, shouldUseSavedOverrides]
  );

  useEffect(() => {
    const previousRoleId = previousRoleIdRef.current;
    if (previousRoleId != null && roleId != null && previousRoleId !== roleId) {
      setRoleChangeNotice(true);
    }
    previousRoleIdRef.current = roleId;
  }, [roleId]);

  useEffect(() => {
    if (savedRoleId != null && roleId === savedRoleId) {
      setRoleChangeNotice(false);
    }
  }, [roleId, savedRoleId]);

  useEffect(() => {
    setOverrideEffects(initialOverrideEffects);
  }, [initialOverrideEffects]);

  const overrideInputs = useMemo(
    () => buildPermissionOverrideInputs(overrideEffects, existingOverrides),
    [existingOverrides, overrideEffects]
  );
  const previousOverrideInputsRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(overrideInputs);
    if (serialized === previousOverrideInputsRef.current) return;
    previousOverrideInputsRef.current = serialized;
    onChange(overrideInputs);
  }, [onChange, overrideInputs]);

  const isLoading =
    isLoadingOverridable || (roleId != null && isLoadingRolePermissions);
  const overrideCount = countActiveOverrides(overrideEffects);
  const panelId = 'user-role-permissions-panel';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading permissions…
      </div>
    );
  }

  if (roleId == null || permissionRows.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          setExpanded((current) => !current);
        }}
        className="text-primary inline-flex cursor-pointer items-center gap-1 text-sm font-medium hover:underline"
      >
        View permissions
        {overrideCount > 0 ? (
          <span className="text-muted-foreground font-normal">
            ({overrideCount} overrides)
          </span>
        ) : null}
        <span className="sr-only">
          {expanded ? ', expanded' : ', collapsed'}
        </span>
      </button>

      {expanded ? (
        <div id={panelId} className="space-y-4 rounded-md border p-3">
          {roleChangeNotice ? (
            <p className="text-sm text-amber-800">
              Permission customizations were reset for the new role.
            </p>
          ) : null}

          {groupedRows.map((group) => (
            <div key={group.category} className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">
                {group.category}
              </div>
              <div className="space-y-3">
                {group.rows.map((row) => {
                  const override = row.allowUserOverride
                    ? (overrideEffects[row.key] ?? null)
                    : null;
                  const checked = getEffectivePermission(
                    row.roleHasPermission,
                    override
                  );
                  const customized =
                    row.allowUserOverride && isPermissionCustomized(override);
                  const switchInteractive = canEdit && row.allowUserOverride;

                  return (
                    <div
                      key={row.key}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium text-slate-900">
                            {row.displayName}
                          </div>
                          {customized ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                              <SlidersHorizontal
                                className="size-3 shrink-0"
                                aria-hidden
                              />
                              Customized
                            </span>
                          ) : null}
                        </div>
                        {row.description ? (
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {row.description}
                          </p>
                        ) : null}
                        {customized ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Role default: {row.roleHasPermission ? 'On' : 'Off'}
                          </p>
                        ) : null}
                      </div>
                      <Switch
                        checked={checked}
                        readOnly={!switchInteractive}
                        onCheckedChange={(nextChecked) => {
                          if (!switchInteractive) return;
                          setOverrideEffects((current) => ({
                            ...current,
                            [row.key]: resolveToggleOverride(
                              row.roleHasPermission,
                              current[row.key] ?? null,
                              Boolean(nextChecked)
                            ),
                          }));
                          setRoleChangeNotice(false);
                        }}
                        aria-label={`${row.displayName} permission`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
