import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { fireEvent, render, screen } from '@/test/test-utils';

// Mock auth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

// Mock lookupsApi and usersApi
vi.mock('@/api/lookupsApi', () => ({
  fetchOverridablePermissions: vi.fn().mockResolvedValue([
    {
      id: 1,
      key: 'perm.test',
      displayName: 'Test Permission',
      description: null,
      category: 'Activities',
      sortOrder: 1,
    },
  ]),
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
    teams: [],
    permissionOverrides: [],
  }),
  fetchRoles: vi
    .fn()
    .mockResolvedValue([{ id: 2, name: 'Editor', description: null }]),
  fetchRolePermissions: vi.fn().mockResolvedValue([
    {
      key: 'perm.test',
      displayName: 'Test Permission',
      description: null,
      category: 'Activities',
      sortOrder: 1,
      allowUserOverride: false,
      hasPermission: true,
    },
  ]),
  fetchTeams: vi.fn().mockResolvedValue([]),
}));

describe('UserDetailPage permissions (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: 6 },
      hasPermission: () => true,
    });
  });

  it('renders permissions inside the expandable panel', async () => {
    const { default: UserDetailPage } = await import('../UserDetailPage');

    render(
      <MemoryRouter initialEntries={['/users/7']}>
        <Routes>
          <Route path="/users/:id" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const trigger = await screen.findByRole('button', {
      name: /show permissions/i,
    });
    fireEvent.click(trigger);

    expect(await screen.findByText('Test Permission')).toBeTruthy();
    expect(screen.getByText('Activities')).toBeTruthy();
  }, 15000);
});
