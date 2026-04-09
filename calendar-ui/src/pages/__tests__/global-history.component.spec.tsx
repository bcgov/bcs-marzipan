import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchGlobalActivityHistoryPaged } from '@/api/activitiesApi';

import { GlobalHistory } from '../GlobalHistory';

// Mock the auth hook so tests don't need the real AuthProvider wrapper.
// Provide a minimal user shape expected by GlobalHistory.
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', displayName: 'Test User' },
    isSystemAdmin: false,
  }),
}));

vi.mock('@/api/activitiesApi', () => ({
  fetchGlobalActivityHistoryPaged: vi.fn(),
}));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('GlobalHistory component', () => {
  beforeEach(() => {
    (fetchGlobalActivityHistoryPaged as unknown as any).mockResolvedValue({
      items: [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          userId: 42,
          userName: 'alice',
          actor: { displayName: 'Alice Tester', username: 'alice' },
          actionType: 'UPDATE',
          activity: {
            id: 11,
            displayId: 'ACT-11',
            title: 'Event 11',
            categories: [],
          },
          notes: 'note',
          changes: [],
        },
      ],
      page: 1,
      pageSize: 10,
      hasNext: false,
    });
  });

  it('renders entries and supports search filter', async () => {
    const qc = createQueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <GlobalHistory />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // wait for entry
    expect(await screen.findByText('Event 11')).toBeDefined();

    const search = screen.getByRole('textbox', { name: /search history/i });
    fireEvent.change(search, { target: { value: 'no-match' } });
    expect(await screen.findByText('No matching history found.')).toBeTruthy();
  });
});
