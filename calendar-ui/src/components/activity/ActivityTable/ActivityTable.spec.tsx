import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import { clearStrictModeScrollRestoreFallback } from '@/lib/activity-list-scroll-restore';
import { ACTIVITY_GRID_STORAGE_KEY } from '@/lib/activityTableLayoutPreferences';

import { ActivityTable } from './ActivityTable';

const mockNavigate = vi.fn();
const mockSetPreferences = vi.fn();
let mockLocationState: unknown = null;
let mockNavigationType: 'POP' | 'PUSH' | 'REPLACE' = 'PUSH';

function makeActivity(id: number) {
  return {
    id,
    displayId: `INF-${String(id).padStart(6, '0')}`,
    title: `Test Activity ${id}`,
    category: ['Release'],
    isConfidential: false,
    isIssue: false,
    summary: `Summary ${id}`,
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
    leadTeamId: null,
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
  };
}

const mockActivities = Array.from({ length: 30 }, (_, i) =>
  makeActivity(i + 1)
);
mockActivities[0].commsMaterials = ['Backgrounder'] as never[];

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/',
      search: '?tab=all',
      hash: '#list',
      state: mockLocationState,
    }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useNavigationType: () => mockNavigationType,
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
    statusArchiveIds: {},
    statusOptions: [],
    tagOptions: [],
    leadTeamOptions: [],
    commsContactOptions: [],
    eventPlannerOptions: [],
    translationOptions: [],
    translationStatusOptions: [],
    filterSummaryContext: {
      statusOptions: [],
      tagOptions: [],
      leadTeamOptions: [],
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
      sortKey: 'startDate',
      sortDirection: 'asc',
      showCompleted: false,
      showDeleted: false,
      searchKeyword: '',
      pageSize: 25,
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
  useTags: () => ({ data: [] }),
  useTeams: () => ({ data: [] }),
  useTranslationLanguages: () => ({ data: [], isLoading: false }),
  useUsers: () => ({ data: [] }),
}));

vi.mock('@/hooks/useFavourites', () => ({
  useFavourites: () => ({
    favouriteActivityIds: [],
    toggle: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCalendar', () => ({
  useActivityList: () => ({
    isPending: false,
    data: mockActivities,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useBulkUpdateActivities: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useBulkUnshareActivities: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
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

describe('ActivityTable layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('renders column headers with Comms hidden by default', () => {
    render(<ActivityTable />);

    expect(
      screen.getByRole('columnheader', { name: /Overview/i })
    ).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /Summary/i })).toBeTruthy();
    expect(
      screen.getByRole('columnheader', { name: /Scheduling/i })
    ).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: /Comms/i })).toBeNull();
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeTruthy();
    expect(screen.queryByText('Backgrounder')).toBeNull();
  });

  it('persists column visibility, order, and widths across remounts', async () => {
    const user = userEvent.setup();
    const savedOrder = [
      'select',
      'overview',
      'status',
      'summary',
      'scheduling',
      'materials',
    ];
    window.sessionStorage.setItem(
      ACTIVITY_GRID_STORAGE_KEY,
      JSON.stringify({
        columnOrder: savedOrder,
        columnSizing: { summary: 500 },
        columnVisibility: { materials: false },
      })
    );

    const first = render(<ActivityTable />);

    await user.click(screen.getByRole('button', { name: /Columns/i }));
    await user.click(
      await screen.findByRole('menuitemcheckbox', { name: 'Comms' })
    );
    await user.click(
      await screen.findByRole('menuitemcheckbox', { name: 'Scheduling' })
    );
    // The open menu marks the page aria-hidden; close it before querying.
    await user.keyboard('{Escape}');

    expect(
      await screen.findByRole('columnheader', { name: /Comms/i })
    ).toBeTruthy();
    expect(
      screen.queryByRole('columnheader', { name: /Scheduling/i })
    ).toBeNull();
    expect(screen.getAllByText('Backgrounder').length).toBeGreaterThan(0);

    const stored = JSON.parse(
      window.sessionStorage.getItem(ACTIVITY_GRID_STORAGE_KEY) as string
    );
    expect(stored.columnVisibility).toEqual({
      materials: true,
      scheduling: false,
    });
    expect(stored.columnOrder).toEqual(savedOrder);
    expect(stored.columnSizing).toEqual({ summary: 500 });

    first.unmount();
    render(<ActivityTable />);

    expect(screen.getByRole('columnheader', { name: /Comms/i })).toBeTruthy();
    expect(
      screen.queryByRole('columnheader', { name: /Scheduling/i })
    ).toBeNull();
    const headerNames = screen
      .getAllByRole('columnheader')
      .map((h) => h.textContent ?? '');
    const indexOf = (label: RegExp) =>
      headerNames.findIndex((name) => label.test(name));
    expect(indexOf(/Status/i)).toBeLessThan(indexOf(/Summary/i));
    expect(indexOf(/Summary/i)).toBeLessThan(indexOf(/Comms/i));
    expect(screen.getAllByText('Backgrounder').length).toBeGreaterThan(0);

    const reread = JSON.parse(
      window.sessionStorage.getItem(ACTIVITY_GRID_STORAGE_KEY) as string
    );
    expect(reread.columnOrder).toEqual(savedOrder);
    expect(reread.columnSizing).toEqual({ summary: 500 });
    expect(reread.columnVisibility).toEqual({
      materials: true,
      scheduling: false,
    });
  });
});

describe('ActivityTable scroll state capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
    mockNavigationType = 'PUSH';
    window.sessionStorage.clear();
    clearStrictModeScrollRestoreFallback();
  });

  it('captures page and focus activity when opening details', () => {
    render(<ActivityTable />);

    const title = screen.getByText('Test Activity 1');
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

  it('restores from location state and clears persisted state after restore', async () => {
    mockLocationState = {
      activityListPageIndex: 1,
      activityListScrollTop: 180,
    };
    window.sessionStorage.setItem(
      'activityListScrollState',
      JSON.stringify({
        activityListPageIndex: 1,
        activityListScrollTop: 180,
        activityListFocusActivityId: 12,
      })
    );

    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    const cancelSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    render(<ActivityTable />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    const table = screen.getByRole('grid');
    const scroller = table.closest('div.overflow-auto');
    expect(scroller).toBeTruthy();
    expect(scroller?.scrollTop).toBe(180);
    expect(window.sessionStorage.getItem('activityListScrollState')).toBeNull();

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it('restores from sessionStorage when location state has no scroll fields (browser back)', async () => {
    mockNavigationType = 'POP';
    mockLocationState = null;
    window.sessionStorage.setItem(
      'activityListScrollState',
      JSON.stringify({
        activityListPageIndex: 1,
        activityListScrollTop: 180,
        activityListFocusActivityId: 12,
      })
    );

    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    const cancelSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    render(<ActivityTable />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    const table = screen.getByRole('grid');
    const scroller = table.closest('div.overflow-auto');
    expect(scroller).toBeTruthy();
    expect(scroller?.scrollTop).toBe(180);
    expect(window.sessionStorage.getItem('activityListScrollState')).toBeNull();

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it('does not restore from sessionStorage on direct navigation (non-POP)', async () => {
    mockNavigationType = 'PUSH';
    mockLocationState = null;
    window.sessionStorage.setItem(
      'activityListScrollState',
      JSON.stringify({
        activityListPageIndex: 1,
        activityListScrollTop: 180,
        activityListFocusActivityId: 12,
      })
    );

    render(<ActivityTable />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    expect(screen.getByText('Test Activity 1')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('activityListScrollState')).toBeNull();
  });
});
