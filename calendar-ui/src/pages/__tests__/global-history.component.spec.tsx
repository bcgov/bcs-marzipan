import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchGlobalActivityHistoryPaged } from '@/api/activitiesApi';

import { GlobalHistory } from '../GlobalHistory';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 42, displayName: 'Test User' },
    isSystemAdmin: false,
  }),
}));

vi.mock('@/api/activitiesApi', () => ({
  fetchGlobalActivityHistoryPaged: vi.fn(),
}));

vi.mock('@/hooks/useLookups', () => ({
  useTeams: () => ({ data: [] }),
  useCategories: () => ({ data: [] }),
  useUsers: () => ({ data: [] }),
  useOrganizations: () => ({ data: [] }),
  useMinistries: () => ({ data: [] }),
  useActivityStatuses: () => ({ data: [] }),
}));

vi.mock('@/api/lookupsApi', () => ({
  fetchDateStatuses: vi.fn().mockResolvedValue([]),
  fetchNewsReleaseDistributions: vi.fn().mockResolvedValue([]),
  fetchNewsReleaseOrigins: vi.fn().mockResolvedValue([]),
  fetchPitchRequiredStatuses: vi.fn().mockResolvedValue([]),
  fetchPremierRequested: vi.fn().mockResolvedValue([]),
  fetchTimeStatuses: vi.fn().mockResolvedValue([]),
  fetchTranslationRequiredStatuses: vi.fn().mockResolvedValue([]),
}));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('GlobalHistory component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchGlobalActivityHistoryPaged as unknown as any).mockImplementation(
      (params?: { query?: string }) => {
        if (params?.query === 'no-match') {
          return Promise.resolve({
            items: [],
            page: 1,
            pageSize: 10,
            hasNext: false,
            totalItems: 0,
          });
        }

        return Promise.resolve({
          items: [
            {
              id: 1,
              timestamp: new Date().toISOString(),
              userId: 42,
              userName: 'alice',
              actor: { displayName: 'Alice Tester', username: 'alice' },
              actionType: 'updated',
              activity: {
                id: 11,
                displayId: 'ACT-11',
                title: 'Event 11',
                categories: [],
                leadTeamId: 1,
              },
              notes: 'note',
              changes: [],
            },
          ],
          page: 1,
          pageSize: 10,
          hasNext: false,
          totalItems: 1,
        });
      }
    );
  });

  it('renders entries, summary count, and supports search filter', async () => {
    const qc = createQueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <GlobalHistory />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchGlobalActivityHistoryPaged).toHaveBeenCalled();
    });
    expect(await screen.findByText('Showing 1 record')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /ACT-11 Event 11/i })
    ).toBeInTheDocument();

    const search = screen.getByRole('textbox', { name: /search history/i });
    fireEvent.change(search, { target: { value: 'no-match' } });
    expect(await screen.findByText('Showing 0 records')).toBeInTheDocument();
    expect(await screen.findByText('No matching history found')).toBeTruthy();
  });
});
