import type {
  UserPermissionEffect,
  UserPermissionOverride,
  UserPermissionOverrideInput,
} from '@corpcal/shared/api/types';
import type {
  OverridablePermission,
  RolePermissionRow,
} from '@/api/lookupsApi';

export type PermissionOverrideEffect = UserPermissionEffect | null;

export type UserRolePermissionRow = {
  key: string;
  displayName: string;
  description: string | null;
  category: string;
  sortOrder: number;
  roleHasPermission: boolean;
  allowUserOverride: boolean;
};

export function getEffectivePermission(
  roleHasPermission: boolean,
  override: PermissionOverrideEffect
): boolean {
  if (override === 'grant') return true;
  if (override === 'deny') return false;
  return roleHasPermission;
}

export function isPermissionCustomized(
  override: PermissionOverrideEffect
): boolean {
  return override !== null;
}

export function resolveToggleOverride(
  roleHasPermission: boolean,
  currentOverride: PermissionOverrideEffect,
  checked: boolean
): PermissionOverrideEffect {
  const nextEffective = checked;
  const roleDefault = roleHasPermission;

  if (nextEffective === roleDefault) {
    return null;
  }

  return nextEffective ? 'grant' : 'deny';
}

export function mergeUserRolePermissionRows(
  roleRows: RolePermissionRow[],
  overridableCatalog: OverridablePermission[]
): UserRolePermissionRow[] {
  const byKey = new Map<string, UserRolePermissionRow>();

  for (const row of roleRows) {
    byKey.set(row.key, {
      key: row.key,
      displayName: row.displayName ?? row.key,
      description: row.description ?? null,
      category: row.category,
      sortOrder: row.sortOrder,
      roleHasPermission: Boolean(row.hasPermission),
      allowUserOverride: Boolean(row.allowUserOverride),
    });
  }

  for (const permission of overridableCatalog) {
    const existing = byKey.get(permission.key);
    if (existing) {
      existing.allowUserOverride = true;
      continue;
    }

    byKey.set(permission.key, {
      key: permission.key,
      displayName: permission.displayName,
      description: permission.description,
      category: permission.category,
      sortOrder: permission.sortOrder,
      roleHasPermission: false,
      allowUserOverride: true,
    });
  }

  return Array.from(byKey.values()).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName)
  );
}

export function groupPermissionRowsByCategory(
  rows: UserRolePermissionRow[]
): { category: string; rows: UserRolePermissionRow[] }[] {
  const groups: { category: string; rows: UserRolePermissionRow[] }[] = [];
  const groupIndex = new Map<string, number>();

  for (const row of rows) {
    const category = row.category.trim() || 'Other';
    const existingIndex = groupIndex.get(category);
    if (existingIndex === undefined) {
      groupIndex.set(category, groups.length);
      groups.push({ category, rows: [row] });
      continue;
    }
    groups[existingIndex]?.rows.push(row);
  }

  return groups;
}

export function buildInitialOverrideEffects(
  rows: UserRolePermissionRow[],
  existingOverrides: UserPermissionOverride[] | undefined
): Record<string, PermissionOverrideEffect> {
  const savedByKey = new Map(
    (existingOverrides ?? []).map((entry) => [
      entry.permissionKey,
      entry.effect,
    ])
  );
  const next: Record<string, PermissionOverrideEffect> = {};

  for (const row of rows) {
    if (!row.allowUserOverride) continue;
    next[row.key] = savedByKey.get(row.key) ?? null;
  }

  return next;
}

export function countActiveOverrides(
  overrideEffects: Record<string, PermissionOverrideEffect>
): number {
  return Object.values(overrideEffects).filter((effect) => effect !== null)
    .length;
}

export function buildPermissionOverrideInputs(
  overrideEffects: Record<string, PermissionOverrideEffect>,
  savedOverrides: UserPermissionOverride[] | undefined
): UserPermissionOverrideInput[] {
  const savedByKey = new Map(
    (savedOverrides ?? []).map((entry) => [entry.permissionKey, entry.effect])
  );
  const keys = new Set([
    ...Object.keys(overrideEffects),
    ...(savedOverrides ?? []).map((entry) => entry.permissionKey),
  ]);

  const inputs: UserPermissionOverrideInput[] = [];

  for (const permissionKey of keys) {
    const desired = overrideEffects[permissionKey] ?? null;
    const previous = savedByKey.get(permissionKey) ?? null;
    if (desired === previous) continue;
    inputs.push({ permissionKey, effect: desired });
  }

  return inputs;
}
