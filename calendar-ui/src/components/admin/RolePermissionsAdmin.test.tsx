import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '@/test/test-utils';

const mockFetchPermissionAdminRoles = vi.fn();
const mockFetchAdminRolePermissions = vi.fn();
const mockUpdateAdminRolePermissions = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/api/lookupsApi', () => ({
  fetchPermissionAdminRoles: () => mockFetchPermissionAdminRoles(),
  fetchAdminRolePermissions: (...args: unknown[]) =>
    mockFetchAdminRolePermissions(...args),
  updateAdminRolePermissions: (...args: unknown[]) =>
    mockUpdateAdminRolePermissions(...args),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('RolePermissionsAdminSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { permissions: ['system.manage_permissions'] },
    });
    mockFetchPermissionAdminRoles.mockResolvedValue([
      { id: 2, name: 'Editor', description: 'Activity editors' },
    ]);
    mockFetchAdminRolePermissions.mockResolvedValue([
      {
        id: 10,
        key: 'activities.view',
        displayName: 'View activities',
        description: 'View calendar activities.',
        category: 'Activities',
        sortOrder: 1,
        hasPermission: false,
        locked: false,
      },
      {
        id: 11,
        key: 'system.manage_permissions',
        displayName: 'Manage permissions',
        description: null,
        category: 'Activities',
        sortOrder: 2,
        hasPermission: true,
        locked: true,
      },
      {
        id: 12,
        key: 'system.view_logs',
        displayName: 'View system logs',
        description: null,
        category: 'System',
        sortOrder: 3,
        hasPermission: true,
        locked: true,
      },
    ]);
    mockUpdateAdminRolePermissions.mockResolvedValue([
      {
        id: 10,
        key: 'activities.view',
        displayName: 'View activities',
        description: 'View calendar activities.',
        category: 'Activities',
        sortOrder: 1,
        hasPermission: true,
        locked: false,
      },
      {
        id: 11,
        key: 'system.manage_permissions',
        displayName: 'Manage permissions',
        description: null,
        category: 'Activities',
        sortOrder: 2,
        hasPermission: true,
        locked: true,
      },
      {
        id: 12,
        key: 'system.view_logs',
        displayName: 'View system logs',
        description: null,
        category: 'System',
        sortOrder: 3,
        hasPermission: true,
        locked: true,
      },
    ]);
  });

  it('stages editable changes and saves them while system permissions remain locked', async () => {
    const { RolePermissionsAdminSection } =
      await import('./RolePermissionsAdmin');
    render(<RolePermissionsAdminSection />);

    const ordinaryPermission = await screen.findByRole('switch', {
      name: 'View activities for Editor',
    });
    expect(await screen.findByText('(0 of 1 permissions)')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Activities0' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /System/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Manage permissions for Editor' })
    ).toBeDisabled();

    fireEvent.click(ordinaryPermission);
    expect(
      screen.getByRole('tab', { name: 'Activities1' })
    ).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Save changes' })
    );

    await waitFor(() =>
      expect(mockUpdateAdminRolePermissions).toHaveBeenCalledWith(
        2,
        [10, 11, 12]
      )
    );
  });
});
