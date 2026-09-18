import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

import { ActivityTableGridA } from './ActivityTableGridA';
import type { ActivityTableRow } from './activityTableRow';
import { ActivityTableShell } from './ActivityTableShell';

const mockRow: ActivityTableRow = {
  id: 1,
  displayId: 'INF-000001',
  title: 'Grid test activity',
  activityCategories: ['Release'],
  categoryIds: [1],
  pitchDate: null,
  pitchRequiredStatus: null,
  isConfidential: false,
  isIssue: false,
  summary: 'Summary text',
  executiveSummary: '',
  tags: [],
  lookAheadStatus: 'new',
  lookAheadSection: 'events',
  allDay: false,
  startDate: '2026-07-20',
  endDate: '2026-07-20',
  dateStatus: 'Confirmed',
  startTime: '10:00:00',
  endTime: '11:00:00',
  timeStatus: 'Confirmed',
  venue: 'Victoria',
  premierRequested: 'No',
  activityRepresentatives: ['Minister Smith'],
  leadOrg: 'Health',
  leadMinistry: 'Health',
  leadMinistryAbbreviation: 'HLTH',
  leadTeamDisplayName: 'HLTH Comms',
  commsLeadName: 'Jane Smith',
  commsLeadPhone: '604-555-0100',
  commsContactsCount: 1,
  eventPlanners: [],
  eventPlannerLeadIds: [],
  leadTeamId: 1,
  leadMinistryId: 1,
  leadOrgId: 1,
  commsContactLeadUserId: 5,
  translationsRequired: [],
  translationsRequiredStatus: null,
  translationsRequiredStatusId: null,
  commsMaterials: ['Media release'],
  activityStatus: 'Reviewed',
  activityStatusId: 2,
  lastUpdatedDateTime: '2026-07-20T10:00:00.000Z',
  lastUpdatedBy: 1,
  createdDateTime: '2026-07-19T10:00:00.000Z',
  flags: [],
  sharedWith: ['Comms Team'],
  sharedWithTeamIds: [10],
  visibility: 'team',
};

const mockCore = {
  canBulkSelect: false,
  canBulkUpdateActivities: false,
  canBulkShareActivities: false,
  canUnshare: false,
  canSeeDeleted: false,
  canFlag: false,
  showReviewHighlights: false,
  pitchFieldVisibility: { canViewPitchStatus: false, canViewPitchDate: false },
  loading: false,
  error: null,
  refetchActivities: vi.fn(),
  data: [mockRow],
  filteredData: [mockRow],
  sortedData: [mockRow],
  sortedActivityIds: [1],
  userMap: new Map([['1', { name: 'Updater', jobTitle: null }]]),
  sortKey: 'startDate',
  sortDirection: 'asc' as const,
  effectiveSortKey: 'startDate',
  effectiveSortDirection: 'asc' as const,
  handleSortChange: vi.fn(),
  handleHeaderSort: vi.fn(),
  pagination: { pageIndex: 0, pageSize: 25 },
  onPaginationChange: vi.fn(),
  tableScrollRef: { current: null },
  openActivityWithScroll: vi.fn(),
  selectedActivityIds: new Set<number>(),
  selectedActivityCount: 0,
  selectedActivities: [],
  toggleActivitySelected: vi.fn(),
  selectActivityIds: vi.fn(),
  clearSelection: vi.fn(),
  bulkDialog: null,
  setBulkDialog: vi.fn(),
  bulkActionPending: false,
  handleBulkOperation: vi.fn(),
  selectedPitchStatusId: '',
  setSelectedPitchStatusId: vi.fn(),
  selectedTagIds: [],
  setSelectedTagIds: vi.fn(),
  selectedTeamIds: [],
  setSelectedTeamIds: vi.fn(),
  selectedFlagTeamId: '',
  setSelectedFlagTeamId: vi.fn(),
  selectedAssigneeIds: [],
  setSelectedAssigneeIds: vi.fn(),
  deleteReason: '',
  setDeleteReason: vi.fn(),
  unshareModalOpen: false,
  setUnshareModalOpen: vi.fn(),
  eligibleBulkUnshareTeams: [],
  handleBulkUnshareConfirm: vi.fn(),
  bulkUnsharePending: false,
  watchlistActivityIdSet: new Set<number>(),
  watchlistIds: [],
  toggleFavourite: vi.fn(),
  isFavouriteToggling: false,
  syncFlagsMutation: { mutate: vi.fn(), isPending: false },
  newRowIds: new Set<number>(),
  remoteHighlightIds: new Set<number>(),
  filterState: DEFAULT_ACTIVITY_FILTER_STATE,
  searchKeyword: '',
  handleFilterStateChange: vi.fn(),
  handleSearchKeywordChange: vi.fn(),
  handleApplySavedFilter: vi.fn(),
  handleClearAllCriteria: vi.fn(),
  savedFiltersHook: { savedFilters: [], defaultFilter: null, isLoading: false },
  activeSavedFilter: null,
  appliedSavedFilterName: null,
  appliedFilterTypeLabels: [],
  filterDetailLines: [],
  hasActiveCriteria: false,
  booleanFilters: [],
  leadFilterConflictsWithMinistryTab: false,
  favouriteActivityIds: undefined,
  categoryOptions: [],
  statusOptions: [],
  pitchRequiredStatusOptions: [],
  tagOptions: [],
  leadTeamOptions: [],
  commsContactOptions: [],
  eventPlannerOptions: [],
  translationOptions: [],
  translationStatusOptions: [],
  bulkPitchStatusOptions: [],
  tags: [],
  teams: [],
  user: null,
};

const mockLayoutPreferences = {
  getColumnOrder: vi.fn(() => []),
  setColumnOrder: vi.fn(),
  getColumnSizing: vi.fn(() => ({})),
  setColumnSizing: vi.fn(),
};

vi.mock('@/hooks/useActivityTableCore', () => ({
  useActivityTableCore: () => mockCore,
}));

vi.mock('./ActivityTableFilters', () => ({
  ActivityTableFilters: () => <div data-testid="activity-table-filters" />,
}));

vi.mock('@/hooks/useLookAheadSectionRows', () => ({
  useLookAheadSectionRows: () => ({
    rows: [
      {
        id: 1,
        lookAheadKey: 'events',
        uiLabel: 'Events',
        legendColor: '#ff0000',
        reportSectionKey: 'events',
        reportSectionLabel: 'Events',
      },
    ],
  }),
  getLookAheadSectionLabelFromRows: () => 'Events',
  getLookAheadSectionLegendColorFromRows: () => '#ff0000',
}));

describe('ActivityTable grids', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('renders Grid A column headers', () => {
    render(<ActivityTableGridA layoutPreferences={mockLayoutPreferences} />);

    expect(
      screen.getByRole('columnheader', { name: /Overview/i })
    ).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /Summary/i })).toBeTruthy();
    expect(
      screen.getByRole('columnheader', { name: /Scheduling/i })
    ).toBeTruthy();
    expect(
      screen.getByRole('columnheader', { name: /Materials/i })
    ).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeTruthy();
    expect(screen.getByText('Grid test activity')).toBeTruthy();
  });
});

describe('ActivityTableShell', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('renders Grid A by default', () => {
    render(<ActivityTableShell />);

    expect(
      screen.getByRole('columnheader', { name: /Materials/i })
    ).toBeTruthy();
    expect(
      screen.queryByRole('radiogroup', { name: 'Activity table layout' })
    ).toBeNull();
  });
});
