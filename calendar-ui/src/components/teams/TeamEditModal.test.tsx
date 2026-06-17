import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TeamDetail, TeamListItem } from '@corpcal/shared/api/types';

import { TeamEditModal } from './TeamEditModal';

const { mockToast, mockCreateTeam, mockUpdateTeam, mockFetchTeamById } =
  vi.hoisted(() => ({
    mockToast: { success: vi.fn(), error: vi.fn() },
    mockCreateTeam: vi.fn(),
    mockUpdateTeam: vi.fn(),
    mockFetchTeamById: vi.fn(),
  }));

vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/api/teamsApi', () => ({
  createTeam: (...args: unknown[]) => mockCreateTeam(...args),
  fetchTeamById: (id: number) => mockFetchTeamById(id),
  updateTeam: (...args: unknown[]) => mockUpdateTeam(...args),
}));

vi.mock('@/api/lookupsApi', () => ({
  fetchMinistries: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Ministry 1',
      displayName: 'Ministry 1',
      abbreviation: 'M1',
    },
  ]),
}));

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TeamEditModal
        team={null}
        open={true}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />
    </QueryClientProvider>
  );
}

function renderEditModal(team: TeamListItem) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TeamEditModal
        team={team}
        open={true}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />
    </QueryClientProvider>
  );
}

/** Opens the ministry combobox and selects the only option. */
async function selectMinistry(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByPlaceholderText(/select ministry/i);
  await user.click(input);
  await user.type(input, 'Ministry');
  const option = await screen.findByText('Ministry 1', undefined, {
    timeout: 5000,
  });
  await user.click(option);
}

const mockTeamListItem: TeamListItem = {
  id: 5,
  name: 'Existing Team',
  displayName: 'Existing',
  abbreviation: 'EX',
  description: 'Team description',
  sortOrder: 0,
  isActive: true,
  roleId: null,
  memberCount: 0,
  ministryId: null,
  ministryName: null,
};

const mockTeamDetail: TeamDetail = {
  ...mockTeamListItem,
  members: [],
};

describe('TeamEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTeam.mockResolvedValue({
      id: 1,
      name: 'New Team',
      abbreviation: 'NT',
    });
  });

  describe('create success toast', () => {
    it('calls toast.success with id team-created when create succeeds', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.type(screen.getByLabelText(/display \*/i), 'Test Team');
      await user.type(screen.getByLabelText(/^abbreviation \*/i), 'TT');
      await selectMinistry(user);

      const createButton = screen.getByRole('button', { name: /create/i });
      await waitFor(() => expect(createButton).toBeEnabled(), {
        timeout: 5000,
      });
      fireEvent.submit(createButton.closest('form') as HTMLFormElement);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Team created', {
          id: 'team-created',
        });
      });
    });
  });

  describe('create error toast', () => {
    it('calls toast.error with id team-created when create fails', async () => {
      mockCreateTeam.mockRejectedValue(new Error('Failed to create'));
      const user = userEvent.setup();
      renderModal();

      await user.type(screen.getByLabelText(/display \*/i), 'Test Team');
      await user.type(screen.getByLabelText(/^abbreviation \*/i), 'TT');
      await selectMinistry(user);

      const createButton = screen.getByRole('button', { name: /create/i });
      await waitFor(() => expect(createButton).toBeEnabled(), {
        timeout: 5000,
      });
      fireEvent.submit(createButton.closest('form') as HTMLFormElement);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to create', {
          id: 'team-created',
        });
      });
    });
  });

  describe('update success toast', () => {
    it('calls toast.success with id team-updated-{id} when update succeeds', async () => {
      mockFetchTeamById.mockResolvedValue({
        ...mockTeamDetail,
        ministryId: 1,
        ministryName: 'Ministry 1',
      });
      mockUpdateTeam.mockResolvedValue({
        ...mockTeamListItem,
        name: 'Updated',
        abbreviation: 'EX',
      });
      const user = userEvent.setup();
      renderEditModal(mockTeamListItem);

      await waitFor(() => {
        expect(screen.getByLabelText(/name \*/i)).toHaveValue('Existing Team');
      });

      await user.clear(screen.getByLabelText(/name \*/i));
      await user.type(screen.getByLabelText(/name \*/i), 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Team updated', {
          id: 'team-updated-5',
        });
      });
    });
  });

  describe('update error toast', () => {
    it('calls toast.error with id team-updated-{id} when update fails', async () => {
      mockFetchTeamById.mockResolvedValue({
        ...mockTeamDetail,
        ministryId: 1,
        ministryName: 'Ministry 1',
      });
      mockUpdateTeam.mockRejectedValue(new Error('Server error'));
      const user = userEvent.setup();
      renderEditModal(mockTeamListItem);

      await waitFor(() => {
        expect(screen.getByLabelText(/name \*/i)).toHaveValue('Existing Team');
      });

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error', {
          id: 'team-updated-5',
        });
      });
    });
  });
});
