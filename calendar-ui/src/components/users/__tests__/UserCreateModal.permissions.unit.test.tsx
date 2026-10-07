import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import { fireEvent, render, screen } from '@/test/test-utils';

import { UserCreateModal } from '../UserCreateModal';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/api/usersApi', () => ({
  createUser: vi.fn(),
  fetchRoles: vi.fn().mockResolvedValue([
    { id: SYSTEM_ROLE_IDS.ADMIN, name: 'Admin', description: null },
    {
      id: SYSTEM_ROLE_IDS.SYSTEM_ADMIN,
      name: 'System Admin',
      description: null,
    },
  ]),
  fetchTeams: vi.fn().mockResolvedValue([]),
}));

describe('UserCreateModal role permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: SYSTEM_ROLE_IDS.ADMIN },
      hasPermission: () => false,
    });
  });

  it('hides the System Admin role from regular admins', async () => {
    render(<UserCreateModal open onClose={vi.fn()} />);

    fireEvent.click(await screen.findByText('Select role'));

    expect(await screen.findByRole('option', { name: 'Admin' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'System Admin' })).toBeNull();
  });

  it('shows the System Admin role to system admins', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: SYSTEM_ROLE_IDS.SYSTEM_ADMIN },
      hasPermission: () => false,
    });
    render(<UserCreateModal open onClose={vi.fn()} />);

    fireEvent.click(await screen.findByText('Select role'));

    expect(
      await screen.findByRole('option', { name: 'System Admin' })
    ).toBeTruthy();
  });
});
