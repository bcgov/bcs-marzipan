import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toCalendarDateString } from '@corpcal/shared/datetime';
import { createMockActivityListItem } from '@corpcal/shared/test-utils';
import type { ReportDataResponse } from '@/api/reportsApi';

import { ReportsPage } from './ReportsPage';

const mockHandleReportExport = vi.hoisted(() => vi.fn());
const mockFetchReportData = vi.hoisted(() => vi.fn());
const mockTrackReportFiltersApplied = vi.hoisted(() => vi.fn());
const mockTrackReportNoResultsShown = vi.hoisted(() => vi.fn());
const mockTrackReportExportCompleted = vi.hoisted(() => vi.fn());
const mockTrackReportExportStarted = vi.hoisted(() => vi.fn());
const mockTrackReportPaginationChanged = vi.hoisted(() => vi.fn());
const mockTrackReportResultOpened = vi.hoisted(() => vi.fn());
const mockTrackReportSearchResultsLoaded = vi.hoisted(() => vi.fn());
const mockReports = vi.hoisted(() => [
  { id: 1, name: 'custom', displayName: 'Custom Report' },
]);

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { roleName: 'user' },
  }),
}));

vi.mock('@/hooks/useLookups', () => ({
  useReports: () => ({
    data: mockReports,
  }),
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

vi.mock('@/lib/analytics', () => ({
  default: {
    countActiveReportFilterCriteria: (filterState: any) =>
      filterState?.dateRange?.startDate === '2020-01-01' ? 1 : 0,
    getActiveReportFilterKeys: (filterState: any) =>
      filterState?.dateRange?.startDate === '2020-01-01' ? ['dateRange'] : [],
    trackReportExportCompleted: (...args: any[]) =>
      mockTrackReportExportCompleted(...args),
    trackReportExportStarted: (...args: any[]) =>
      mockTrackReportExportStarted(...args),
    trackReportFiltersApplied: (...args: any[]) =>
      mockTrackReportFiltersApplied(...args),
    trackReportNoResultsShown: (...args: any[]) =>
      mockTrackReportNoResultsShown(...args),
    trackReportPaginationChanged: (...args: any[]) =>
      mockTrackReportPaginationChanged(...args),
    trackReportResultOpened: (...args: any[]) =>
      mockTrackReportResultOpened(...args),
    trackReportSearchResultsLoaded: (...args: any[]) =>
      mockTrackReportSearchResultsLoaded(...args),
  },
}));

vi.mock('@/hooks/useLiveActivitySyncContext', () => ({
  useLiveActivityRowHighlights: () => new Set<number>(),
}));

vi.mock('@/hooks/useReportsSavedFilters', () => ({
  useReportsSavedFilters: ({
    setPreferences,
  }: {
    setPreferences: (partial: Record<string, unknown>) => void;
  }) => ({
    setPreferencesAndClearSaved: setPreferences,
    savedFiltersHook: {
      savedFilters: [],
      isLoading: false,
      createSavedFilter: vi.fn(),
      updateSavedFilter: vi.fn(),
      deleteSavedFilter: vi.fn(),
    },
    onApplySavedFilter: vi.fn(),
    activeSavedFilter: null,
    filterSummaryContext: {},
    parseSavedFilterForDraft: vi.fn(),
    validFilterLookups: {},
    appliedSavedFilterName: null,
    handleClearPanelFilters: vi.fn(),
  }),
}));

vi.mock('@/hooks/useReportsTablePreferences', async (importOriginal) => {
  const React = await import('react');
  const { mergeActivityTablePreferences, buildDefaultPreferencesForReport } =
    await import('@/lib/report-preferences-defaults');

  return {
    ...(await importOriginal<
      typeof import('@/hooks/useReportsTablePreferences')
    >()),
    useReportsTablePreferences: () => {
      const [preferences, setPreferencesState] = React.useState(() =>
        buildDefaultPreferencesForReport('custom', false)
      );
      const setPreferences = React.useCallback(
        (partial: Parameters<typeof mergeActivityTablePreferences>[1]) => {
          setPreferencesState((prev) =>
            mergeActivityTablePreferences(prev, partial, false)
          );
        },
        []
      );
      return { preferences, setPreferences };
    },
  };
});

vi.mock('@/lib/custom-report-config-storage', () => ({
  loadCustomReportConfig: () => [],
  saveCustomReportConfig: vi.fn(),
}));

vi.mock('@/api/reportsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reportsApi')>();
  return {
    ...actual,
    fetchReportData: mockFetchReportData,
  };
});

vi.mock('@/lib/report-export', () => ({
  handleReportExport: mockHandleReportExport,
}));

vi.mock('@/components/reports/ReportFiltersBar', () => ({
  ReportFiltersBar: ({
    preferences,
    setPreferences,
  }: {
    preferences: {
      filterState: {
        dateRange: {
          startDate: string;
          endDate: string;
          noStartDate: boolean;
          noEndDate: boolean;
        };
      };
    };
    setPreferences: (partial: {
      filterState: typeof preferences.filterState;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        setPreferences({
          filterState: {
            ...preferences.filterState,
            dateRange: {
              startDate: '2020-01-01',
              endDate: '2024-12-31',
              noStartDate: false,
              noEndDate: false,
            },
          },
        })
      }
    >
      Apply wide date range
    </button>
  ),
}));

vi.mock('@/components/reports/ReportTableSummaryBar', () => ({
  ReportTableSummaryBar: () => null,
}));

vi.mock('@/components/reports/CustomReportPreviewSection', () => ({
  CustomReportPreviewSection: () => <div>Custom preview</div>,
}));

vi.mock('@/components/reports/PrintReportPreview', () => ({
  PrintReportPreview: () => (
    <a href="/activity/1" target="_blank" rel="noreferrer">
      Open activity
    </a>
  ),
}));

function makeReportData(
  activityTitle: string,
  reportName = 'custom',
  displayName = 'Custom Report',
  metaOverrides: Partial<NonNullable<ReportDataResponse['meta']>> = {}
): ReportDataResponse {
  return {
    report: {
      id: 1,
      name: reportName,
      displayName,
      sortOrder: 0,
      isActive: true,
      visibility: 'global',
      config: null,
      description: null,
    },
    sections: [
      {
        id: 'section-1',
        name: 'Activities',
        order: 0,
        activities: [
          createMockActivityListItem({ id: 1, title: activityTitle }),
        ],
      },
    ],
    meta: {
      resolvedDateRange: {
        start: toCalendarDateString('2024-01-01'),
        end: toCalendarDateString('2024-03-31'),
      },
      wasClamped: false,
      inferredBound: null,
      activityCount: 1,
      largeResultWarning: false,
      ...metaOverrides,
    },
  };
}

function makeEmptyReportData(
  reportName = 'custom',
  displayName = 'Custom Report'
): ReportDataResponse {
  return {
    ...makeReportData('No activity placeholder', reportName, displayName),
    sections: [
      {
        id: 'section-1',
        name: 'Activities',
        order: 0,
        activities: [],
      },
    ],
    meta: {
      resolvedDateRange: {
        start: toCalendarDateString('2024-01-01'),
        end: toCalendarDateString('2024-03-31'),
      },
      wasClamped: false,
      inferredBound: null,
      activityCount: 0,
      largeResultWarning: false,
    },
  };
}

function renderReportsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter initialEntries={['/reports?report=custom']}>
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ReportsPage placeholder data handling', () => {
  let fetchCount = 0;
  let resolvePendingFetch: ((value: ReportDataResponse) => void) | undefined;
  let settledReportData = makeReportData('Initial activity');

  beforeEach(() => {
    vi.clearAllMocks();
    mockReports.splice(0, mockReports.length, {
      id: 1,
      name: 'custom',
      displayName: 'Custom Report',
    });
    fetchCount = 0;
    resolvePendingFetch = undefined;
    settledReportData = makeReportData('Initial activity');

    mockFetchReportData.mockImplementation(() => {
      fetchCount += 1;
      if (fetchCount === 1) {
        return Promise.resolve(settledReportData);
      }
      if (fetchCount === 2) {
        return new Promise<ReportDataResponse>((resolve) => {
          resolvePendingFetch = (value) => {
            settledReportData = value;
            resolve(value);
          };
        });
      }
      return Promise.resolve(settledReportData);
    });

    mockHandleReportExport.mockResolvedValue(undefined);
  });

  it('disables custom XLSX export while placeholder data is shown for new filters', async () => {
    renderReportsPage();

    const exportButton = await screen.findByRole('button', {
      name: /export xlsx/i,
    });
    await waitFor(() => expect(exportButton).not.toBeDisabled());

    fireEvent.click(
      screen.getByRole('button', { name: /apply wide date range/i })
    );

    await waitFor(() => expect(exportButton).toBeDisabled());
    expect(mockHandleReportExport).not.toHaveBeenCalled();
  });

  it('exports fresh rows after the in-flight fetch settles', async () => {
    renderReportsPage();

    const exportButton = await screen.findByRole('button', {
      name: /export xlsx/i,
    });
    await waitFor(() => expect(exportButton).not.toBeDisabled());

    fireEvent.click(
      screen.getByRole('button', { name: /apply wide date range/i })
    );
    await waitFor(() => expect(exportButton).toBeDisabled());

    resolvePendingFetch?.(makeReportData('Fresh activity'));
    await waitFor(() => expect(exportButton).not.toBeDisabled());

    fireEvent.click(exportButton);

    await waitFor(() =>
      expect(mockHandleReportExport).toHaveBeenCalledTimes(1)
    );
    expect(mockHandleReportExport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportType: 'custom',
        format: 'xlsx',
        data: expect.objectContaining({
          sections: [
            expect.objectContaining({
              activities: [
                expect.objectContaining({ title: 'Fresh activity' }),
              ],
            }),
          ],
        }),
      })
    );

    expect(mockTrackReportExportStarted).toHaveBeenCalledWith({
      report_name: 'custom',
      export_type: 'xlsx',
      rows_count: 1,
      active_filter_count: 1,
      search_present: false,
    });

    expect(mockTrackReportExportCompleted).toHaveBeenCalledWith({
      report_name: 'custom',
      export_type: 'xlsx',
      status: 'success',
      duration_ms: expect.any(Number),
    });
  });

  it('shows large-range warnings from current filters while fetch is in flight', async () => {
    mockFetchReportData.mockResolvedValueOnce(
      makeReportData('Initial activity', 'custom', 'Custom Report', {
        largeResultWarning: false,
        wasClamped: false,
      })
    );

    renderReportsPage();

    expect(
      screen.queryByText(/large date range — report may load slowly/i)
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: /apply wide date range/i })
    );

    expect(
      await screen.findByText(/large date range — report may load slowly/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/date range adjusted to 2-year maximum/i)
    ).toBeTruthy();
  });

  it('tracks report_search_results_loaded after fresh report data renders', async () => {
    renderReportsPage();

    await screen.findByText('Custom preview');

    await waitFor(() =>
      expect(mockTrackReportSearchResultsLoaded).toHaveBeenCalledWith({
        report_name: 'custom',
        results_count: 1,
        latency_ms: expect.any(Number),
        search_present: false,
        active_filter_count: 0,
      })
    );
  });

  it('tracks report_filters_applied when report filters change', async () => {
    renderReportsPage();

    fireEvent.click(
      await screen.findByRole('button', { name: /apply wide date range/i })
    );

    await waitFor(() =>
      expect(mockTrackReportFiltersApplied).toHaveBeenCalledWith({
        report_name: 'custom',
        filter_keys_used: ['dateRange'],
        active_filter_count: 1,
        category_count: 0,
        status_count: 0,
        tag_count: 0,
        ministry_count: 0,
        org_count: 0,
      })
    );
  });

  it('tracks report_no_results_shown when a fresh report has no matching rows', async () => {
    mockFetchReportData.mockReset();
    mockFetchReportData.mockResolvedValue(makeEmptyReportData());

    renderReportsPage();

    await waitFor(() =>
      expect(mockTrackReportNoResultsShown).toHaveBeenCalledWith({
        report_name: 'custom',
        active_filter_count: 0,
        search_present: false,
        date_range_active: false,
        filter_keys_used: [],
      })
    );
  });

  it('tracks report_result_opened when a report preview activity link is clicked', async () => {
    mockReports.splice(0, mockReports.length, {
      id: 1,
      name: 'look-ahead',
      displayName: 'Look-ahead Report',
    });
    settledReportData = makeReportData(
      'Initial activity',
      'look-ahead',
      'Look-ahead Report'
    );
    mockFetchReportData.mockReset();
    mockFetchReportData.mockResolvedValue(settledReportData);

    renderReportsPage();

    const previewLink = await screen.findByRole('link', {
      name: /open activity/i,
    });
    fireEvent.click(previewLink);

    expect(mockTrackReportResultOpened).toHaveBeenCalledWith({
      report_name: 'look-ahead',
      item_type: 'activity',
      position_in_results: 1,
      results_count: 1,
      open_method: 'link',
      active_filter_count: 0,
    });
  });
});
