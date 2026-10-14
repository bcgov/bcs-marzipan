import type { SortColumnConfig } from '@/components/table/SortDropdown';

export const DEFAULT_SORT_KEY = 'startDate';
export const DEFAULT_SORT_DIRECTION = 'asc' as const;

/** Sort options offered by the activity list header and sort dropdown. */
export const ACTIVITY_SORT_COLUMNS: SortColumnConfig[] = [
  { id: 'activityId', label: 'Activity ID', defaultDirection: 'asc' },
  {
    id: 'activityStatus',
    label: 'Status',
    defaultDirection: 'asc',
    tieBreakers: [
      { key: 'startDate', direction: 'asc' },
      { key: 'startTime', direction: 'asc' },
    ],
  },
  {
    id: 'lookAheadStatus',
    label: 'LA Status',
    defaultDirection: 'asc',
    tieBreakers: [
      { key: 'startDate', direction: 'asc' },
      { key: 'startTime', direction: 'asc' },
    ],
  },
  {
    id: 'startDate',
    label: 'Date',
    defaultDirection: 'asc',
    directionLabels: { asc: 'Soonest', desc: 'Latest' },
    tieBreakers: [{ key: 'startTime', direction: 'asc' }],
  },
  { id: 'lastUpdated', label: 'Last updated', defaultDirection: 'desc' },
  { id: 'createdDateTime', label: 'Date created', defaultDirection: 'desc' },
];

/** Status column can be sorted by activity status, last updated, or date created. */
export const STATUS_COLUMN_SORT_KEYS = [
  'activityStatus',
  'lastUpdated',
  'createdDateTime',
] as const;
