/**
 * ActivityViewPage form and lead team field tests.
 * Form always renders; Lead team uses a combobox (same as Lead Organization)
 * so the selected team label displays once options are available.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useOutletContext } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared/auth';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import type { ActivityLayoutContext } from './ActivityLayout';
import { ActivityViewPage } from './ActivityViewPage';

const mockActivityWithLeadTeam: ActivityLayoutContext['activity'] =
  createMockActivityResponse({
    id: 1,
    displayId: 'ACT-1',
    title: 'Test Activity',
    leadTeamId: 5,
    activityStatus: 'Draft',
  });

const mockLookupsReady = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  pitchStatuses: [],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [],
  premierRequested: [],
  newsReleaseOrigins: [],
  sharedWithTeams: [],
};

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useOutletContext: vi.fn(),
  };
});

const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useCalendar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useCalendar')>();
  return {
    ...actual,
    useRestoreActivity: () => ({ mutateAsync: vi.fn() }),
    useDeleteActivity: () => ({ mutateAsync: vi.fn() }),
    useSoftDeleteActivity: () => ({ mutateAsync: vi.fn() }),
  };
});

const mockUseFormLookups = vi.fn();
const mockUseLeadTeamOptions = vi.fn();

vi.mock('../hooks/useFormLookups', () => ({
  useFormLookups: () => mockUseFormLookups(),
}));

vi.mock('../hooks/useLeadTeamOptions', () => ({
  useLeadTeamOptions: () => mockUseLeadTeamOptions(),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ActivityViewPage form readiness', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });
    vi.mocked(useOutletContext).mockReturnValue({
      activity: mockActivityWithLeadTeam,
      refreshActivity: vi.fn().mockResolvedValue(undefined),
    });
    mockUseFormLookups.mockReturnValue(mockLookupsReady);
  });

  it('renders Lead team field (combobox) even when lead team options have not been fetched yet', () => {
    mockUseLeadTeamOptions.mockReturnValue({
      data: [],
      isFetched: false,
    });

    renderWithProviders(<ActivityViewPage />);

    expect(screen.getByText(/Lead team/)).toBeInTheDocument();
    const comboboxes = screen.getAllByRole('combobox');
    const leadTeamCombobox = comboboxes.find((el) =>
      el.textContent?.includes('Select lead team')
    );
    expect(leadTeamCombobox).toBeDefined();
  });

  it('renders form body with Lead team when lead team options have been fetched', () => {
    mockUseLeadTeamOptions.mockReturnValue({
      data: [
        {
          id: 5,
          name: 'Test Team',
          displayName: 'Test Team',
          ministryId: 1,
          ministryName: 'Ministry One',
          memberCount: 2,
        },
      ],
      isFetched: true,
    });

    renderWithProviders(<ActivityViewPage />);

    expect(screen.getByText(/Lead team/)).toBeInTheDocument();
  });

  it('renders form body when activity has no leadTeamId even if lead options not fetched', () => {
    vi.mocked(useOutletContext).mockReturnValue({
      activity: {
        ...mockActivityWithLeadTeam,
        leadTeamId: undefined as unknown as number,
      },
      refreshActivity: vi.fn().mockResolvedValue(undefined),
    });
    mockUseLeadTeamOptions.mockReturnValue({
      data: [],
      isFetched: false,
    });

    renderWithProviders(<ActivityViewPage />);

    expect(screen.getByText(/Lead team/)).toBeInTheDocument();
  });
});

describe('ActivityViewPage restore button visibility', () => {
  beforeEach(() => {
    mockUseFormLookups.mockReturnValue(mockLookupsReady);
    mockUseLeadTeamOptions.mockReturnValue({
      data: [
        {
          id: 5,
          name: 'T',
          displayName: 'Test',
          ministryId: 1,
          ministryName: 'M',
          memberCount: 1,
        },
      ],
      isFetched: true,
    });
  });

  it('shows Restore when status is deleted and user has DELETE_ANY', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key === PERMISSIONS.ACTIVITIES.DELETE_ANY,
      user: { id: 1, roleName: 'Admin', teamIds: [] },
    });
    vi.mocked(useOutletContext).mockReturnValue({
      activity: {
        ...mockActivityWithLeadTeam,
        activityStatus: 'Deleted',
      },
      refreshActivity: vi.fn().mockResolvedValue(undefined),
    });

    renderWithProviders(<ActivityViewPage />);

    expect(
      screen.getByRole('button', { name: /Restore/i })
    ).toBeInTheDocument();
  });

  it('does not show Restore when status is deleted and user lacks DELETE_ANY', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key !== PERMISSIONS.ACTIVITIES.DELETE_ANY,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });
    vi.mocked(useOutletContext).mockReturnValue({
      activity: {
        ...mockActivityWithLeadTeam,
        activityStatus: 'Deleted',
      },
      refreshActivity: vi.fn().mockResolvedValue(undefined),
    });

    renderWithProviders(<ActivityViewPage />);

    expect(
      screen.queryByRole('button', { name: /Restore/i })
    ).not.toBeInTheDocument();
  });

  it('shows Restore when status is delete_requested and user has REQUEST_DELETE and is lead-team member', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) =>
        key === PERMISSIONS.ACTIVITIES.REQUEST_DELETE,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });
    vi.mocked(useOutletContext).mockReturnValue({
      activity: {
        ...mockActivityWithLeadTeam,
        activityStatus: 'Delete requested',
      },
      refreshActivity: vi.fn().mockResolvedValue(undefined),
    });

    renderWithProviders(<ActivityViewPage />);

    expect(
      screen.getByRole('button', { name: /Restore/i })
    ).toBeInTheDocument();
  });
});
