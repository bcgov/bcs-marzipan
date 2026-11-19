import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

import { ActivityListPage } from './ActivityListPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, roleName: 'user', teamIds: [] },
    hasPermission: (perm: string) =>
      perm === 'reports.view' || perm === 'activities.create',
  }),
}));

vi.mock('@/hooks/useFavourites', () => ({
  useFavourites: () => ({ favouriteActivityIds: [] }),
}));

vi.mock('@/hooks/useLeadTeamOptions', () => ({
  useLeadTeamOptions: () => ({ data: [] }),
}));

vi.mock('@/hooks/useLookups', () => ({
  useMinistries: () => ({ data: [] }),
  useActivityStatuses: () => ({ data: [] }),
  useReports: () => ({
    data: [
      { id: 1, name: 'planning', displayName: 'Planning Report' },
      { id: 2, name: 'custom', displayName: 'Custom Report' },
    ],
  }),
}));

vi.mock('@/hooks/useActivityTablePreferences', () => ({
  useActivityTablePreferences: () => ({
    preferences: {
      sortKey: 'startDate',
      sortDirection: 'desc',
      showCompleted: false,
      showDeleted: false,
      pageSize: 10,
      searchKeyword: '',
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
    },
    setPreferences: vi.fn(),
  }),
}));

vi.mock('@/components/activity/ActivityTable', () => ({
  ActivityTable: () => <div data-testid="activity-table" />,
}));

vi.mock('@/components/reports/ActivityListReportDialog', () => ({
  ActivityListReportDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="report-dialog">Report dialog</div> : null,
}));

function renderPage(
  initialEntry: string | { pathname: string; search?: string } = '/'
) {
  const entry = typeof initialEntry === 'string' ? initialEntry : initialEntry;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <ActivityListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('ActivityListPage reports entry', () => {
  it('shows Reports control enabled on non-All tabs', async () => {
    renderPage();
    const reportsButton = screen.getByRole('button', { name: /reports/i });
    expect(reportsButton).toBeEnabled();
    await userEvent.click(screen.getByRole('tab', { name: /my activities/i }));
    expect(screen.getByRole('button', { name: /reports/i })).toBeEnabled();
  });

  it('opens report dialog from ?report= query', async () => {
    renderPage('/?report=planning');
    expect(await screen.findByTestId('report-dialog')).toBeInTheDocument();
  });
});
