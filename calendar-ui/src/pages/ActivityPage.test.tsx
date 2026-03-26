/**
 * ActivityPage form readiness, restore button visibility,
 * and optimistic inline-edit lock behavior.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared/auth';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import type { FormLookupData } from '../hooks/useFormLookups';
import { ActivityPage, type ActivityPageProps } from './ActivityPage';

vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return {
    ...actual,
    toast: { ...actual.toast, error: vi.fn(), success: vi.fn() },
  };
});

const mockActivityWithLeadTeam: ActivityPageProps['activity'] =
  createMockActivityResponse({
    id: 1,
    displayId: 'ACT-1',
    title: 'Test Activity',
    leadTeamId: 5,
    activityStatus: 'Draft',
    canEdit: true,
  });

const mockLookupsReady: FormLookupData = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  pitchStatuses: [],
  pitchRequiredStatuses: [],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [],
  premierRequested: [],
  newsReleaseOrigins: [],
  sharedWithTeams: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
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

let mockLockState = 'idle';
vi.mock('../hooks/useActivityLock', () => ({
  useActivityLock: () => ({
    lock: null,
    lockState: mockLockState,
    lockedByUsername: mockLockState === 'locked-by-other' ? 'Other User' : null,
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

const mockUseFormLookups = vi.fn<() => FormLookupData>();
const mockUseLeadTeamOptions = vi.fn();

vi.mock('../hooks/useFormLookups', () => ({
  useFormLookups: () => mockUseFormLookups(),
}));

vi.mock('../hooks/useLeadTeamOptions', () => ({
  useLeadTeamOptions: () => mockUseLeadTeamOptions(),
}));

vi.mock('../hooks/useCommsContactCandidates', () => ({
  useCommsContactCandidates: () => ({ data: undefined }),
}));

vi.mock('../hooks/useCommsContactSync', () => ({
  useCommsContactSync: () => {},
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
    mockLockState = 'idle';
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
    mockLockState = 'idle';
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

describe('ActivityPage optimistic inline edit', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRelease.mockClear();
    mockAcquire.mockClear().mockResolvedValue(true);
    mockLockState = 'idle';
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

  it('does not show Edit button (removed in optimistic model)', async () => {
    renderActivityPage();

    await screen.findByText(/Lead team/);
    expect(
      screen.queryByRole('button', { name: /^Edit$/i })
    ).not.toBeInTheDocument();
  });

  it('keeps Save disabled until edit lock and dirty', async () => {
    renderActivityPage();

    await screen.findByText(/Lead team/);
    const save = screen.getByRole('button', { name: /^Save$/i });
    expect(save).toBeDisabled();
  });

  it('shows Discard changes and enables Save after edits when lock is owned', async () => {
    mockLockState = 'owned';
    const user = userEvent.setup();
    renderActivityPage();

    const titleTextarea = await screen.findByPlaceholderText(
      'Enter activity title'
    );
    await user.click(titleTextarea);
    await user.type(titleTextarea, 'X');

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Discard changes/i })
      ).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Save$/i })).not.toBeDisabled()
    );
  });

  it('shows Review when user has activities.review', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) =>
        key === PERMISSIONS.ACTIVITIES.EDIT ||
        key === PERMISSIONS.ACTIVITIES.CREATE ||
        key === PERMISSIONS.ACTIVITIES.REVIEW,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });

    renderActivityPage();

    await screen.findByText(/Lead team/);
    expect(
      screen.getByRole('button', { name: /^(Save and )?Review$/i })
    ).toBeInTheDocument();
  });

  it('does not show Review without activities.review', async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) => key !== PERMISSIONS.ACTIVITIES.REVIEW,
      user: { id: 1, roleName: 'Editor', teamIds: [5] },
    });

    renderActivityPage();

    await screen.findByText(/Lead team/);
    expect(
      screen.queryByRole('button', { name: /^(Save and )?Review$/i })
    ).not.toBeInTheDocument();
  });

  it('typing in a text field triggers lock acquisition', async () => {
    const user = userEvent.setup();
    renderActivityPage();

    const titleTextarea = await screen.findByPlaceholderText(
      'Enter activity title'
    );
    await user.click(titleTextarea);
    await user.type(titleTextarea, 'X');

    await waitFor(() => expect(mockAcquire).toHaveBeenCalledTimes(1));
  });

  it('resets form and shows error toast when lock acquisition fails', async () => {
    mockAcquire.mockResolvedValue(false);
    const user = userEvent.setup();
    renderActivityPage();

    const titleTextarea = await screen.findByPlaceholderText(
      'Enter activity title'
    );
    await user.click(titleTextarea);
    await user.type(titleTextarea, 'X');

    await waitFor(() => expect(mockAcquire).toHaveBeenCalled());
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Cannot edit. Another user has started editing this activity.'
      )
    );
  });

  it('form controls are enabled for optimistic edit when user may edit', async () => {
    renderActivityPage();

    const titleTextarea = await screen.findByPlaceholderText(
      'Enter activity title'
    );
    expect(titleTextarea).not.toBeDisabled();
  });

  it('disables form fields when API canEdit is false', async () => {
    renderActivityPage({
      activity: {
        ...mockActivityWithLeadTeam,
        canEdit: false,
      },
    });

    const titleTextarea = await screen.findByPlaceholderText(
      'Enter activity title'
    );
    expect(titleTextarea).toHaveAttribute('readonly');
  });

  it('form is read-only when locked by another user', async () => {
    mockLockState = 'locked-by-other';
    renderActivityPage();

    await screen.findByText(/Lead team/);
    expect(screen.getByText(/Other User/)).toBeInTheDocument();
  });
});
