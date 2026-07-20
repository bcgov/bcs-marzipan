import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

import { ActivityTable } from './ActivityTable';

const mockNavigate = vi.fn();
const mockSetPreferences = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/',
      search: '?tab=all',
      hash: '#list',
      state: null,
    }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { roleName: 'user', permissions: [] },
    hasPermission: () => false,
  }),
}));

vi.mock('@/hooks/useActivityTableFilterLookups', () => ({
  useActivityTableFilterLookups: () => ({
    pitchFieldVisibility: {
      canViewPitchStatus: false,
      canViewPitchDate: false,
    },
    statusArchiveIds: {},
    statusOptions: [],
    pitchRequiredStatusOptions: [],
    tagOptions: [],
    ministryOptions: [],
    organizationOptions: [],
    commsContactOptions: [],
    eventPlannerOptions: [],
    translationOptions: [],
    translationStatusOptions: [],
    filterSummaryContext: {
      statusOptions: [],
      pitchRequiredStatusOptions: [],
      tagOptions: [],
      ministryOptions: [],
      organizationOptions: [],
      commsContactOptions: [],
      eventPlannerOptions: [],
      translationStatusOptions: [],
      translationOptions: [],
    },
    hasActivityStatuses: true,
  }),
}));

vi.mock('@/hooks/useActivityTablePreferences', () => ({
  useActivityTablePreferences: () => ({
    preferences: {
      sortKey: null,
      sortDirection: 'desc',
      showCompleted: false,
      showDeleted: false,
      searchKeyword: '',
      pageSize: 10,
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
    },
    setPreferences: mockSetPreferences,
  }),
}));

vi.mock('@/hooks/useSavedFilters', () => ({
  useSavedFilters: () => ({
    savedFilters: [],
    defaultFilter: null,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useLookups', () => ({
  useCategories: () => ({ data: [] }),
  useTranslationLanguages: () => ({ data: [], isLoading: false }),
  useUsers: () => ({ data: [] }),
}));

vi.mock('@/hooks/useCalendar', () => ({
  useActivityList: () => ({
    isPending: false,
    data: [
      {
        id: 1,
        displayId: 'INF-000001',
        title: 'Test Activity',
        category: ['Release'],
        pitchDate: null,
        pitchRequiredStatus: null,
        isConfidential: false,
        isIssue: false,
        summary: 'Summary',
        executiveSummary: '',
        tags: [],
        lookAheadStatus: null,
        lookAheadSection: null,
        isAllDay: false,
        startDate: '2026-07-20',
        endDate: '2026-07-20',
        dateStatus: 'confirmed',
        startTime: '10:00:00',
        endTime: '11:00:00',
        timeStatus: 'confirmed',
        venueAddress: null,
        premierRequested: 'No',
        representativesAttending: [],
        leadOrg: null,
        leadMinistry: null,
        leadMinistryAbbreviation: null,
        commsContacts: [],
        eventPlanners: [],
        eventPlannerLeadIds: [],
        leadMinistryId: null,
        leadOrgId: null,
        translationsRequired: [],
        translationsRequiredStatus: null,
        translationsRequiredStatusId: null,
        commsMaterials: [],
        activityStatus: 'Draft',
        activityStatusId: 1,
        lastUpdatedDateTime: '2026-07-20T10:00:00.000Z',
        lastUpdatedBy: 1,
        createdDateTime: '2026-07-19T10:00:00.000Z',
        flags: [],
      },
    ],
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useSyncActivityFlags: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useLiveActivitySyncContext', () => ({
  useLiveActivitySyncContext: () => ({ isSocketConnected: false }),
  useLiveActivityRowHighlights: () => new Set<number>(),
}));

vi.mock('@/hooks/useLookAheadSectionRows', () => ({
  useLookAheadSectionRows: () => ({ rows: [] }),
  getLookAheadSectionLabelFromRows: () => '',
  getLookAheadSectionLegendColorFromRows: () => null,
}));

vi.mock('./ActivityTableFilters', () => ({
  ActivityTableFilters: () => <div data-testid="activity-table-filters" />,
  hasAnyActivityTableFilterActive: () => false,
}));

describe('ActivityTable scroll state capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('captures page and focus activity when opening details', () => {
    render(<ActivityTable />);

    const title = screen.getByText('Test Activity');
    const row = title.closest('tr');
    expect(row).toBeTruthy();

    fireEvent.click(row!);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/activity/1',
      expect.objectContaining({
        state: expect.objectContaining({
          from: '/?tab=all#list',
          activityListPageIndex: 0,
          activityListScrollTop: expect.any(Number),
        }),
      })
    );

    const rawStored = window.sessionStorage.getItem('activityListScrollState');
    expect(rawStored).toBeTruthy();
    const stored = JSON.parse(rawStored as string) as {
      activityListPageIndex?: number;
      activityListFocusActivityId?: number;
    };
    expect(stored.activityListPageIndex).toBe(0);
    expect(stored.activityListFocusActivityId).toBe(1);
  });
});
