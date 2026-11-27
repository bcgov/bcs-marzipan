import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import type { UserListItem } from '@corpcal/shared/api/types';
import { updateUser } from '@/api/usersApi';
import { render, screen, waitFor } from '@/test/test-utils';

import { UserEditModal } from '../UserEditModal';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockFetchUser = vi.fn();

vi.mock('@/api/usersApi', () => ({
  fetchUser: (...args: unknown[]) => mockFetchUser(...args),
  fetchRoles: vi
    .fn()
    .mockResolvedValue([
      { id: SYSTEM_ROLE_IDS.ADMIN, name: 'Admin', description: null },
    ]),
  updateUser: vi.fn().mockResolvedValue({}),
  updateUserSettings: vi.fn().mockResolvedValue({}),
}));

const listUser: UserListItem = {
  id: 7,
  displayName: 'CorpCal Label',
  adUsername: 'jsmith',
  adDisplayName: 'Jane Smith',
  adEmail: 'jane@gov.bc.ca',
  roleId: SYSTEM_ROLE_IDS.ADMIN,
  roleName: 'Admin',
  isActive: true,
  isEventPlanner: false,
  teams: [],
  userColourKey: 'blue',
};

const detailExtras = {
  notes: null as string | null,
  permissionOverrides: [] as const,
  directLoginEnabled: false,
  jobTitle: null as string | null,
  phone: null as string | null,
  lastLoginDateTime: null as string | null,
};

describe('UserEditModal display name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: SYSTEM_ROLE_IDS.ADMIN },
      hasPermission: () => true,
      refreshUser: vi.fn(),
    });
    mockFetchUser.mockResolvedValue({
      ...listUser,
      ...detailExtras,
    });
  });

  it('shows Edit user title, IDIR field, and display name', async () => {
    render(
      <UserEditModal user={listUser} onClose={vi.fn()} onSaved={vi.fn()} />
    );

    expect(await screen.findByDisplayValue('CorpCal Label')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Edit user CorpCal Label' })
    ).toBeTruthy();
    expect(screen.getByLabelText('IDIR')).toHaveValue('jsmith');
  });

  it('offers Restore Microsoft name when value differs from AD', async () => {
    render(
      <UserEditModal user={listUser} onClose={vi.fn()} onSaved={vi.fn()} />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Restore Microsoft name' })
      ).toBeTruthy();
    });
  });

  it('prefills AD display name when there is no CorpCal override', async () => {
    mockFetchUser.mockResolvedValue({
      ...listUser,
      displayName: null,
      ...detailExtras,
    });

    render(
      <UserEditModal
        user={{ ...listUser, displayName: null }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(await screen.findByDisplayValue('Jane Smith')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Restore Microsoft name' })
    ).toBeNull();
  });

  it('sets field to Microsoft name when Restore is clicked', async () => {
    const user = userEvent.setup();
    render(
      <UserEditModal user={listUser} onClose={vi.fn()} onSaved={vi.fn()} />
    );

    await screen.findByDisplayValue('CorpCal Label');
    await user.click(
      screen.getByRole('button', { name: 'Restore Microsoft name' })
    );

    expect(screen.getByDisplayValue('Jane Smith')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Restore Microsoft name' })
    ).toBeNull();
  });

  it('sends displayName null when saved text matches Microsoft name', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <UserEditModal user={listUser} onClose={vi.fn()} onSaved={onSaved} />
    );

    await screen.findByDisplayValue('CorpCal Label');
    await user.click(
      screen.getByRole('button', { name: 'Restore Microsoft name' })
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateUser).toHaveBeenCalled());
    const body = vi.mocked(updateUser).mock.calls[0]?.[1] as {
      displayName?: string | null;
    };
    expect(body.displayName).toBeNull();
    expect(onSaved).toHaveBeenCalled();
  });
});
