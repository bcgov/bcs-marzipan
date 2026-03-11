/**
 * ActivityPage form and lead team field tests (view mode), and edit-mode behavior.
 * Form always renders; Lead team uses a combobox (same as Lead Organization)
 * so the selected team label displays once options are available.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

const mockRelease = vi.fn().mockResolvedValue(undefined);
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
    lockedByOther: false,
    lockedByUsername: null,
    isLoading: false,
    release: mockRelease,
  }),
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
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
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

describe('ActivityPage form readiness (view mode)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRelease.mockClear();
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });
    mockUseFormLookups.mockReturnValue(mockLookupsReady);
  });

  it('renders Lead team field (combobox) even when lead team options have not been fetched yet', async () => {
    mockUseLeadTeamOptions.mockReturnValue({
      data: [],
      isFetched: false,
    });

    renderActivityPage();

    await expect(screen.findByText(/Lead team/)).resolves.toBeInTheDocument();
    const comboboxes = screen.getAllByRole('combobox');
    const leadTeamCombobox = comboboxes.find((el) =>
      el.textContent?.includes('Select lead team')
    );
    expect(leadTeamCombobox).toBeDefined();
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

describe('ActivityPage restore button visibility (view mode)', () => {
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

describe('ActivityPage edit mode', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRelease.mockClear();
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

  it('renders Update and Cancel when route is /activity/1/edit', async () => {
    renderActivityPage({ initialRoute: '/activity/1/edit' });

    await expect(
      screen.findByRole('button', { name: /Update/i })
    ).resolves.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('Cancel navigates to view and releases lock', async () => {
    const user = userEvent.setup();
    renderActivityPage({ initialRoute: '/activity/1/edit' });

    const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockRelease).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/activity/1', { replace: true });
  });

  it('redirects to view when user lacks EDIT permission and route is edit', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key !== PERMISSIONS.ACTIVITIES.EDIT,
      user: { id: 1, roleName: 'Viewer', teamIds: [5] },
    });

    renderActivityPage({ initialRoute: '/activity/1/edit' });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/activity/1', {
        replace: true,
      })
    );
  });

  it('redirects to view when user has EDIT permission but activity canEdit is false', async () => {
    const activityViewOnly = createMockActivityResponse({
      id: 1,
      displayId: 'ACT-1',
      title: 'Shared activity',
      leadTeamId: 5,
      activityStatus: 'Draft',
      canEdit: false,
    });

    renderActivityPage({
      activity: activityViewOnly,
      initialRoute: '/activity/1/edit',
    });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/activity/1', {
        replace: true,
      })
    );
  });
});
