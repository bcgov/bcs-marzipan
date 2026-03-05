/**
 * ActivityViewPage form and lead team field tests.
 * Form always renders; Lead team uses a combobox (same as Lead Organization)
 * so the selected team label displays once options are available.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useOutletContext } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasPermission: () => true,
    user: { id: 1, roleName: 'Editor', teamIds: [5] },
  }),
}));

vi.mock('../hooks/useCalendar', () => ({
  useRestoreActivity: () => ({ mutateAsync: vi.fn() }),
}));

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
