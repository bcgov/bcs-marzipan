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
        category: 'System',
        sortOrder: 2,
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
        category: 'System',
        sortOrder: 2,
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
    const systemPermission = screen.getByRole('switch', {
      name: 'Manage permissions for Editor',
    });
    expect(systemPermission).toBeDisabled();
    expect(systemPermission).toBeChecked();

    fireEvent.click(ordinaryPermission);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Save changes' })
    );

    await waitFor(() =>
      expect(mockUpdateAdminRolePermissions).toHaveBeenCalledWith(2, [10, 11])
    );
  });
});
