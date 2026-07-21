import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import { render } from '@/test/test-utils';

import { ReportFiltersBar } from '../ReportFiltersBar';

// Mock analytics module
const mockBucketSearchLength = vi.fn();
const mockCountActiveReportFilterCriteria = vi.fn();
const mockTrackReportSearchCleared = vi.fn();
const mockTrackReportSearchSubmitted = vi.fn();
vi.mock('@/lib/analytics', () => ({
  default: {
    bucketSearchLength: (...args: any[]) => mockBucketSearchLength(...args),
    countActiveReportFilterCriteria: (...args: any[]) =>
      mockCountActiveReportFilterCriteria(...args),
    trackReportSearchCleared: (...args: any[]) =>
      mockTrackReportSearchCleared(...args),
    trackReportSearchSubmitted: (...args: any[]) =>
      mockTrackReportSearchSubmitted(...args),
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
    mockBucketSearchLength.mockReset();
    mockBucketSearchLength.mockReturnValue('lt20');
    mockCountActiveReportFilterCriteria.mockReset();
    mockCountActiveReportFilterCriteria.mockReturnValue(0);
    mockTrackReportSearchCleared.mockReset();
    mockTrackReportSearchSubmitted.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends report_search_submitted on Enter key when searchKeyword is present', () => {
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

    expect(mockTrackReportSearchSubmitted).toHaveBeenCalledWith({
      report_name: 'Activity Report',
      search_present: true,
      search_length_bucket: 'lt20',
      active_filter_count: 0,
      timestamp_client: expect.any(String),
      category_count: 0,
      status_count: 0,
      tag_count: 0,
      date_range_active: false,
      date_confirmed_filter: 'any',
      time_confirmed_filter: 'any',
    });
  });

  it('sends report_search_cleared on clear search click and clears search', () => {
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

    expect(mockTrackReportSearchCleared).toHaveBeenCalledWith({
      report_name: 'Activity Report',
      had_search_text: true,
      had_filters: false,
      active_filter_count_before_clear: 0,
    });
    expect(setPreferences).toHaveBeenCalledWith({ searchKeyword: '' });
  });
});
