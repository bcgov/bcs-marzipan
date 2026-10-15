import { SYSTEM_ROLE_IDS } from '@corpcal/shared';

import { validateAdminRolePermissionSelection } from './lookups.service';

describe('validateAdminRolePermissionSelection', () => {
  const catalog = [
    { id: 1, key: 'activities.view' },
    { id: 2, key: 'system.manage_permissions' },
    { id: 3, key: 'system.view_logs' },
  ];

  it('allows changes to ordinary permissions while preserving system permissions', () => {
    expect(() =>
      validateAdminRolePermissionSelection(
        SYSTEM_ROLE_IDS.ADMIN,
        catalog,
        new Map([
          [1, false],
          [2, true],
          [3, false],
        ]),
        new Set([1, 2])
      )
    ).not.toThrow();
  });

  it('rejects changes to system permissions', () => {
    expect(() =>
      validateAdminRolePermissionSelection(
        SYSTEM_ROLE_IDS.ADMIN,
        catalog,
        new Map([[2, true]]),
        new Set()
      )
    ).toThrow('System permissions cannot be changed through role management');
  });

  it('prevents removing permission-management access from System Admin', () => {
    expect(() =>
      validateAdminRolePermissionSelection(
        SYSTEM_ROLE_IDS.SYSTEM_ADMIN,
        catalog,
        new Map([
          [2, true],
          [3, true],
        ]),
        new Set([3])
      )
    ).toThrow('System permissions cannot be changed through role management');
  });
});
