import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const EMPTY_ROLE_ROWS: RolePermissionRow[] = [];
const EMPTY_OVERRIDABLE_CATALOG: Awaited<
  ReturnType<typeof fetchOverridablePermissions>
> = [];

function PermissionValueIndicator({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-[1.15rem] w-8 shrink-0 items-center justify-center rounded-full text-[0.625rem] leading-none font-semibold',
        allowed
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      )}
      aria-label={allowed ? 'Yes' : 'No'}
    >
      {allowed ? 'Yes' : 'No'}
    </span>
  );
}

export type UserRolePermissionsSectionProps = {
  roleId: number | null;
  /** Role persisted on the server; omit for create flows. */
  savedRoleId?: number | null;
  existingOverrides?: UserPermissionOverride[];
  canEditOverrides?: boolean;
  onChange: (overrides: UserPermissionOverrideInput[]) => void;
};

export function UserRolePermissionsSection({
  roleId,
  savedRoleId,
  existingOverrides,
  canEditOverrides = false,
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
    enabled: canEditOverrides,
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

  if (roleId == null) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading permissions…
      </div>
    );
  }

  if (permissionRows.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col', expanded ? 'gap-2' : 'gap-0')}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          setExpanded((current) => !current);
        }}
        className="text-primary inline-flex cursor-pointer items-center gap-1 text-sm font-medium hover:underline"
      >
        {expanded ? 'Hide permissions details' : 'Show permissions details'}
        {overrideCount > 0 ? (
          <span className="text-muted-foreground font-normal">
            ({overrideCount} {overrideCount === 1 ? 'override' : 'overrides'})
          </span>
        ) : null}
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div id={panelId} className="space-y-4 pt-1">
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
                    const switchInteractive =
                      canEditOverrides && row.allowUserOverride;

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
                                <CircleAlert
                                  className="size-3 shrink-0"
                                  aria-hidden
                                />
                                Custom
                              </span>
                            ) : null}
                          </div>
                          {row.description ? (
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {row.description}
                            </p>
                          ) : null}
                        </div>
                        {switchInteractive ? (
                          <Switch
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
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
                        ) : (
                          <PermissionValueIndicator allowed={checked} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
