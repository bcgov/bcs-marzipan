import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import { render } from '@/test/test-utils';

import { ReportFiltersBar } from '../ReportFiltersBar';

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
    user: { roleName: 'user', permissions: [] },
    isLoading: false,
    isAuthenticated: true,
    pendingLoginModal: false,
    login: () => Promise.resolve({ success: false }),
    logout: () => Promise.resolve(),
    refreshUser: () => Promise.resolve(),
    dismissLoginModal: () => {},
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
  }),
}));

vi.mock('@/hooks/useLookups', () => ({
  useActivityStatuses: () => ({ data: [] }),
  useCategories: () => ({ data: [] }),
  useEventPlanners: () => ({ data: [] }),
  useMinistries: () => ({ data: [] }),
  useOrganizations: () => ({ data: [] }),
  usePitchRequiredStatuses: () => ({ data: [] }),
  useTags: () => ({ data: [] }),
  useTranslationLanguages: () => ({ data: [] }),
  useTranslationRequiredStatuses: () => ({ data: [] }),
  useUsers: () => ({ data: [] }),
}));

describe('ReportFiltersBar analytics', () => {
  beforeEach(() => {
    mockTrackCalendarAction.mockReset();
    mockTrackCalendarClick.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends calendar_action on Enter key when searchKeyword is present', () => {
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
      <ReportFiltersBar
        reportName="Activity Report"
        preferences={preferences}
        setPreferences={setPreferences}
      />
    );

    const input = getByLabelText('Search activities');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockTrackCalendarAction).toHaveBeenCalledWith({
      action: 'Search',
      filters: expect.objectContaining({
        search_present: true,
        search_length_bucket: '<20',
      }),
    });
  });

  it('sends calendar_click on clear search click and clears search', () => {
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

    const { getByRole } = render(
      <ReportFiltersBar
        reportName="Activity Report"
        preferences={preferences}
        setPreferences={setPreferences}
      />
    );

    // button has aria-label "Clear search"
    const btn = getByRole('button', { name: /Clear search/i });
    fireEvent.click(btn);

    expect(mockTrackCalendarClick).toHaveBeenCalledWith('clear_search');
    expect(setPreferences).toHaveBeenCalledWith({ searchKeyword: '' });
  });
});
