/**
 * ActivityPage form and lead team field tests, restore button visibility,
 * and client-side edit toggle behavior.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared/auth';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import { ActivityPage, type ActivityPageProps } from './ActivityPage';

const mockActivityWithLeadTeam: ActivityPageProps['activity'] =
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

const mockAcquire = vi.fn().mockResolvedValue(true);
const mockRelease = vi.fn().mockResolvedValue(undefined);
const mockSetLockedByOther = vi.fn();
const mockClearLockedByOther = vi.fn();
const mockRefreshActivity = vi.fn().mockResolvedValue(undefined);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
    useUpdateActivity: () => ({ mutateAsync: vi.fn() }),
    useRequestDeleteActivity: () => ({ mutateAsync: vi.fn() }),
  };
});

vi.mock('../hooks/useActivityLock', () => ({
  useActivityLock: () => ({
    lock: null,
    lockState: 'idle',
    lockedByUsername: null,
    acquire: mockAcquire,
    release: mockRelease,
    setLockedByOther: mockSetLockedByOther,
    clearLockedByOther: mockClearLockedByOther,
  }),
}));

vi.mock('../hooks/useActivityWebSocket', () => ({
  useActivityWebSocket: vi.fn(),
}));

vi.mock('../hooks/useLookups', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useLookups')>();
  return {
    ...actual,
    useDateStatuses: () => ({ data: [] }),
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

function renderWithProviders(
  ui: React.ReactElement,
  options?: { initialRoute?: string }
) {
  const initialRoute = options?.initialRoute ?? '/activity/1';
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="activity/:id" element={ui} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

function renderActivityPage(overrides?: {
  activity?: ActivityPageProps['activity'];
  refreshActivity?: () => Promise<void>;
  initialRoute?: string;
}) {
  const activity = overrides?.activity ?? mockActivityWithLeadTeam;
  const refreshActivity = overrides?.refreshActivity ?? mockRefreshActivity;
  return renderWithProviders(
    <ActivityPage activity={activity} refreshActivity={refreshActivity} />,
    { initialRoute: overrides?.initialRoute }
  );
}

describe('ActivityPage form readiness', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRelease.mockClear();
    mockAcquire.mockClear();
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });
    mockUseFormLookups.mockReturnValue(mockLookupsReady);
  });

  it('renders form body with Lead team when lead team options have been fetched', async () => {
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

    renderActivityPage();

    await expect(screen.findByText(/Lead team/)).resolves.toBeInTheDocument();
  });

  it('renders form body when activity has no leadTeamId even if lead options not fetched', async () => {
    mockUseLeadTeamOptions.mockReturnValue({
      data: [],
      isFetched: false,
    });

    renderActivityPage({
      activity: {
        ...mockActivityWithLeadTeam,
        leadTeamId: undefined as unknown as number,
      },
    });

    await expect(screen.findByText(/Lead team/)).resolves.toBeInTheDocument();
  });
});

describe('ActivityPage restore button visibility', () => {
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

  it('shows Restore when status is deleted and user has DELETE_ANY', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key === PERMISSIONS.ACTIVITIES.DELETE_ANY,
      user: { id: 1, roleName: 'Admin', teamIds: [] },
    });

    renderActivityPage({
      activity: {
        ...mockActivityWithLeadTeam,
        activityStatus: 'Deleted',
      },
    });

    await expect(
      screen.findByRole('button', { name: /Restore/i })
    ).resolves.toBeInTheDocument();
  });

  it('does not show Restore when status is deleted and user lacks DELETE_ANY', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key !== PERMISSIONS.ACTIVITIES.DELETE_ANY,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });

    renderActivityPage({
      activity: {
        ...mockActivityWithLeadTeam,
        activityStatus: 'Deleted',
      },
    });

    await screen.findByText(/Lead team/);
    expect(
      screen.queryByRole('button', { name: /Restore/i })
    ).not.toBeInTheDocument();
  });

  it('shows Restore when status is delete_requested and user has REQUEST_DELETE and is lead-team member', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) =>
        key === PERMISSIONS.ACTIVITIES.REQUEST_DELETE,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });

    renderActivityPage({
      activity: {
        ...mockActivityWithLeadTeam,
        activityStatus: 'Delete requested',
      },
    });

    await expect(
      screen.findByRole('button', { name: /Restore/i })
    ).resolves.toBeInTheDocument();
  });
});

describe('ActivityPage edit toggle', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRelease.mockClear();
    mockAcquire.mockClear().mockResolvedValue(true);
    mockUseFormLookups.mockReturnValue(mockLookupsReady);
    mockUseLeadTeamOptions.mockReturnValue({
      data: [
        {
          id: 5,
          name: 'Test',
          displayName: 'Test',
          ministryId: 1,
          ministryName: 'M',
          memberCount: 1,
        },
      ],
      isFetched: true,
    });
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });
  });

  it('shows Edit button in view state and hides Cancel/Update', async () => {
    renderActivityPage();

    await expect(
      screen.findByRole('button', { name: /^Edit$/i })
    ).resolves.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Update$/i })
    ).not.toBeInTheDocument();
  });

  it('clicking Edit acquires lock and shows Cancel/Update buttons', async () => {
    const user = userEvent.setup();
    renderActivityPage();

    const editButton = await screen.findByRole('button', { name: /^Edit$/i });
    await user.click(editButton);

    await waitFor(() => expect(mockAcquire).toHaveBeenCalledTimes(1));
    await expect(
      screen.findByRole('button', { name: /^Cancel$/i })
    ).resolves.toBeInTheDocument();
    await expect(
      screen.findByRole('button', { name: /^Update$/i })
    ).resolves.toBeInTheDocument();
  });

  it('disables Edit button when user lacks EDIT permission', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key !== PERMISSIONS.ACTIVITIES.EDIT,
      user: { id: 1, roleName: 'Viewer', teamIds: [5] },
    });

    renderActivityPage();

    const editButton = await screen.findByRole('button', { name: /^Edit$/i });
    expect(editButton).toBeDisabled();
  });
});
