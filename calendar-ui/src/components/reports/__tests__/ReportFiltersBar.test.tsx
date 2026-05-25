import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

// Mock analytics module
const mockTrackCalendarAction = vi.fn();
const mockTrackCalendarClick = vi.fn();
vi.mock('@/lib/analytics', () => ({
  default: {
    trackCalendarAction: (...args: any[]) => mockTrackCalendarAction(...args),
    trackCalendarClick: (...args: any[]) => mockTrackCalendarClick(...args),
  },
}));

// Mock useAuth to avoid needing AuthProvider
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { roleName: 'user' },
    isLoading: false,
    isAuthenticated: true,
    pendingLoginModal: false,
    login: async () => ({ success: false }),
    logout: async () => {},
    refreshUser: async () => {},
    dismissLoginModal: () => {},
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
  }),
}));

import { ReportFiltersBar } from '../ReportFiltersBar';

describe('ReportFiltersBar analytics', () => {
  beforeEach(() => {
    mockTrackCalendarAction.mockReset();
    mockTrackCalendarClick.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends calendar_action on Enter key when searchKeyword is present', async () => {
    const preferences = {
      sortKey: 'startDate',
      sortDirection: 'desc',
      showCompleted: false,
      showDeleted: false,
      pageSize: 10,
      searchKeyword: 'covid',
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
    } as any;

    const setPreferences = vi.fn();

    const { getByLabelText } = render(
      <ReportFiltersBar preferences={preferences} setPreferences={setPreferences} />
    );

    const input = getByLabelText('Search activities') as HTMLElement;
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockTrackCalendarAction).toHaveBeenCalled();
    const [[payload]] = mockTrackCalendarAction.mock.calls;
    expect(payload.action).toBe('Search');
  });

  it('sends calendar_click on clear search click and clears search', async () => {
    const preferences = {
      sortKey: 'startDate',
      sortDirection: 'desc',
      showCompleted: false,
      showDeleted: false,
      pageSize: 10,
      searchKeyword: 'term',
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
    } as any;

    const setPreferences = vi.fn();

    const { getByLabelText, getByRole } = render(
      <ReportFiltersBar preferences={preferences} setPreferences={setPreferences} />
    );

    // button has aria-label "Clear search"
    const btn = getByRole('button', { name: /Clear search/i });
    fireEvent.click(btn);

    expect(mockTrackCalendarClick).toHaveBeenCalledWith('clear_search');
    expect(setPreferences).toHaveBeenCalledWith({ searchKeyword: '' });
  });
});
