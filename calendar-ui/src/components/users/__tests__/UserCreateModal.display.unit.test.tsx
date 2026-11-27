import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import { render, screen } from '@/test/test-utils';

import { UserCreateModal } from '../UserCreateModal';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, roleId: SYSTEM_ROLE_IDS.ADMIN },
    hasPermission: () => false,
  }),
}));

vi.mock('@/api/usersApi', () => ({
  createUser: vi.fn(),
  fetchRoles: vi
    .fn()
    .mockResolvedValue([
      { id: SYSTEM_ROLE_IDS.ADMIN, name: 'Admin', description: null },
    ]),
  fetchTeams: vi.fn().mockResolvedValue([]),
}));

describe('UserCreateModal display name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Microsoft guidance and hides display name until expanded', () => {
    render(<UserCreateModal open onClose={vi.fn()} />);

    expect(
      screen.getByText(/inherits from Microsoft IDIR account/i)
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Display name' })).toBeTruthy();
    expect(screen.queryByLabelText('Display name')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Change colour' })).toBeNull();
  });

  it('shows colour controls when email is entered without a custom display name', async () => {
    const user = userEvent.setup();
    render(<UserCreateModal open onClose={vi.fn()} />);

    await user.type(
      screen.getByRole('textbox', { name: /email/i }),
      'jane.smith@gov.bc.ca'
    );

    expect(
      await screen.findByRole('button', { name: 'Change colour' })
    ).toBeTruthy();
    expect(screen.queryByLabelText('Display name')).toBeNull();
  });

  it('reveals custom display name field when link is clicked', async () => {
    const user = userEvent.setup();
    render(<UserCreateModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '+ Display name' }));

    expect(await screen.findByText('Display name')).toBeTruthy();
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(1);
    expect(screen.queryByRole('button', { name: '+ Display name' })).toBeNull();
  });

  it('collapses display name when Use Microsoft name is clicked', async () => {
    const user = userEvent.setup();
    render(<UserCreateModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '+ Display name' }));
    await user.type((await screen.findAllByRole('textbox'))[1], 'Custom Label');
    await user.click(
      screen.getByRole('button', { name: 'Use Microsoft name' })
    );

    expect(screen.getByRole('button', { name: '+ Display name' })).toBeTruthy();
    expect(
      screen.getByText(/inherits from Microsoft IDIR account/i)
    ).toBeTruthy();
  });
});
