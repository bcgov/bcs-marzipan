import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';

import { Users } from './UserManagement';

const { hasPermissionMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}));

vi.mock('@/components/layout', () => ({
  PageHeader: () => null,
}));

vi.mock('@/components/teams/TeamEditModal', () => ({
  TeamEditModal: () => null,
}));

vi.mock('@/components/users/UserCreateModal', () => ({
  UserCreateModal: () => null,
}));

vi.mock('@/components/users/UsersTabContent', () => ({
  UsersTabContent: () => <StatefulFilters name="Users" />,
}));

vi.mock('@/components/teams/TeamsTabContent', () => ({
  TeamsTabContent: () => <StatefulFilters name="Teams" />,
}));

function StatefulFilters({ name }: { name: string }) {
  const [keyword, setKeyword] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  return (
    <>
      <input
        aria-label={`${name} search`}
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <input
        type="checkbox"
        aria-label={`${name} inactive`}
        checked={showInactive}
        onChange={(event) => setShowInactive(event.target.checked)}
      />
    </>
  );
}

function renderManagement() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('User management tab state', () => {
  beforeEach(() => {
    hasPermissionMock.mockReturnValue(true);
  });

  it('preserves independent search and filter settings across repeated tab switches', () => {
    renderManagement();

    fireEvent.change(screen.getByRole('textbox', { name: 'Users search' }), {
      target: { value: 'Jane' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Users inactive' }));
    expect(screen.queryByRole('textbox', { name: 'Teams search' })).toBeNull();

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Teams' }), {
      key: 'Enter',
    });

    expect(screen.queryByRole('textbox', { name: 'Users search' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Teams search' })).toHaveValue(
      ''
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Teams search' }), {
      target: { value: 'Communications' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Teams inactive' }));

    for (let switchCount = 0; switchCount < 2; switchCount += 1) {
      fireEvent.keyDown(screen.getByRole('tab', { name: 'Users' }), {
        key: 'Enter',
      });

      expect(screen.getByRole('textbox', { name: 'Users search' })).toHaveValue(
        'Jane'
      );
      expect(
        screen.getByRole('checkbox', { name: 'Users inactive' })
      ).toBeChecked();
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1);

      fireEvent.keyDown(screen.getByRole('tab', { name: 'Teams' }), {
        key: 'Enter',
      });

      expect(screen.getByRole('textbox', { name: 'Teams search' })).toHaveValue(
        'Communications'
      );
      expect(
        screen.getByRole('checkbox', { name: 'Teams inactive' })
      ).toBeChecked();
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    }
  });

  it('does not mount team filters without permission to view teams', () => {
    hasPermissionMock.mockImplementation(
      (permission: string) => permission !== PERMISSIONS.TEAMS.VIEW
    );
    renderManagement();

    expect(screen.queryByRole('tab', { name: 'Teams' })).toBeNull();
    expect(screen.queryByLabelText('Teams search')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Users search' })).toBeVisible();
  });
});
