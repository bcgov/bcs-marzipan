import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { render, screen, waitFor } from '@/test/test-utils';

// Mocks: auth, lookupsApi, usersApi
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mutable in-memory roles->permissions map for the test
let rolesPermissionsMap: Record<number, any[]> = {};

vi.mock('@/api/lookupsApi', () => {
  return {
    fetchAllPermissions: vi.fn().mockResolvedValue([
      {
        id: 1,
        key: 'perm.test',
        displayName: 'Test Permission',
        description: 'A test permission',
        showInUserManagement: false,
      },
    ]),
    fetchRolesPermissionsMap: vi
      .fn()
      .mockImplementation(() => Promise.resolve(rolesPermissionsMap)),
    updatePermissionVisibility: vi.fn().mockImplementation((id, show) => {
      // simulate backend flip: if show true, include permission for role 2
      if (show) {
        rolesPermissionsMap = {
          ...(rolesPermissionsMap || {}),
          2: [
            {
              key: 'perm.test',
              displayName: 'Test Permission',
              description: 'A test permission',
              hasPermission: true,
            },
          ],
        };
      } else {
        // remove it
        const copy = { ...(rolesPermissionsMap || {}) };
        delete copy[2];
        rolesPermissionsMap = copy;
      }
      return Promise.resolve({
        success: true,
        data: { id, key: 'perm.test', showInUserManagement: Boolean(show) },
      });
    }),
  };
});

vi.mock('@/api/usersApi', () => ({
  fetchUser: vi.fn().mockResolvedValue({
    id: 7,
    adDisplayName: 'Jane Tester',
    adUsername: 'jtester',
    adEmail: 'jane@example.com',
    roleId: 2,
    roleName: 'Editor',
    isActive: true,
    notes: null,
    directLoginEnabled: false,
  }),
  fetchRoles: vi.fn().mockResolvedValue([{ id: 2, name: 'Editor' }]),
  fetchRolePermissions: vi.fn().mockResolvedValue([]),
}));

describe('Permissions visibility integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // start with permission not visible
    rolesPermissionsMap = {};
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: 6 },
      hasPermission: () => true,
    });
  });

  it('toggles visibility in admin UI and UserDetailPage updates', async () => {
    const { PermissionsVisibilityAdmin } =
      await import('@/components/admin/PermissionsVisibilityAdmin');
    const { default: UserDetailPage } = await import('../UserDetailPage');

    render(
      <MemoryRouter initialEntries={['/users/7']}>
        <div>
          <PermissionsVisibilityAdmin />
          <Routes>
            <Route path="/users/:id" element={<UserDetailPage />} />
          </Routes>
        </div>
      </MemoryRouter>
    );

    // Initially UserDetailPage should not show the permission
    await waitFor(() => {
      expect(screen.queryByText('Test Permission')).not.toBeInTheDocument();
    });

    // In the admin table find the row for our permission and toggle the switch
    const adminRow = await screen.findByText('Test Permission');
    const row = adminRow.closest('tr');
    expect(row).toBeTruthy();
    const switchEl = row!.querySelector('[role="switch"]') as HTMLElement;
    expect(switchEl).toBeTruthy();

    // click the switch to enable visibility
    switchEl.click();

    // After mutation + invalidation, UserDetailPage should show the permission
    const permInUser = await screen.findByText('Test Permission');
    expect(permInUser).toBeInTheDocument();
  });
});
