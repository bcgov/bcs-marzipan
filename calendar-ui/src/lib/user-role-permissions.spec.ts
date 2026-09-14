import { describe, expect, it } from 'vitest';

import type {
  OverridablePermission,
  RolePermissionRow,
} from '@/api/lookupsApi';
import {
  buildInitialOverrideEffects,
  buildPermissionOverrideInputs,
  getEffectivePermission,
  mergeUserRolePermissionRows,
  resolveToggleOverride,
} from '@/lib/user-role-permissions';

describe('user-role-permissions', () => {
  const roleRows: RolePermissionRow[] = [
    {
      key: 'activities.unshare',
      displayName: 'Unshare activities',
      description: 'Remove your own team from Shared With.',
      category: 'Activities',
      sortOrder: 14,
      allowUserOverride: true,
      hasPermission: false,
    },
    {
      key: 'activities.edit',
      displayName: 'Edit activities',
      description: null,
      category: 'Activities',
      sortOrder: 10,
      allowUserOverride: false,
      hasPermission: true,
    },
  ];

  const overridableCatalog: OverridablePermission[] = [
    {
      id: 1,
      key: 'activities.unshare',
      displayName: 'Unshare activities',
      description: 'Remove your own team from Shared With.',
      category: 'Activities',
      sortOrder: 14,
    },
  ];

  it('merges role rows with overridable catalog', () => {
    const merged = mergeUserRolePermissionRows(roleRows, overridableCatalog);
    expect(merged).toHaveLength(2);
    expect(
      merged.find((row) => row.key === 'activities.unshare')
    ).toMatchObject({
      allowUserOverride: true,
      roleHasPermission: false,
    });
  });

  it('computes effective permission from role and override', () => {
    expect(getEffectivePermission(false, null)).toBe(false);
    expect(getEffectivePermission(false, 'grant')).toBe(true);
    expect(getEffectivePermission(true, 'deny')).toBe(false);
  });

  it('resolves toggle back to role default as null override', () => {
    expect(resolveToggleOverride(false, 'grant', false)).toBe(null);
    expect(resolveToggleOverride(true, 'deny', true)).toBe(null);
    expect(resolveToggleOverride(false, null, true)).toBe('grant');
    expect(resolveToggleOverride(true, null, false)).toBe('deny');
  });

  it('builds override inputs against saved overrides', () => {
    const rows = mergeUserRolePermissionRows(roleRows, overridableCatalog);
    const effects = buildInitialOverrideEffects(rows, [
      {
        permissionKey: 'activities.unshare',
        displayName: 'Unshare activities',
        effect: 'grant',
      },
    ]);

    expect(
      buildPermissionOverrideInputs(
        { ...effects, 'activities.unshare': null },
        [
          {
            permissionKey: 'activities.unshare',
            displayName: 'Unshare activities',
            effect: 'grant',
          },
        ]
      )
    ).toEqual([{ permissionKey: 'activities.unshare', effect: null }]);
  });
});
