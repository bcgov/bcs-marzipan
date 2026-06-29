import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { render, screen } from '@/test/test-utils';

// Mock auth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

// Mock lookupsApi and usersApi
vi.mock('@/api/lookupsApi', () => ({
  fetchRolesPermissionsMap: vi.fn().mockResolvedValue({
    2: [
      { key: 'perm.test', displayName: 'Test Permission', hasPermission: true },
    ],
  }),
}));

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

describe('UserDetailPage permissions (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: 6 },
      hasPermission: () => true,
    });
  });

  it('renders permission icons from bulk roles->permissions map', async () => {
    const { default: UserDetailPage } = await import('../UserDetailPage');

    render(
      <MemoryRouter initialEntries={['/users/7']}>
        <Routes>
          <Route path="/users/:id" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should find the permission from the mocked bulk map
    const perm = await screen.findByText(
      'Test Permission',
      {},
      { timeout: 10000 }
    );
    expect(perm).toBeTruthy();
  }, 15000);
});
