import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  Badge,
  Button,
  makeStyles,
  Spinner,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
} from '@fluentui/react-components';
import io from 'socket.io-client';

import {
  Calendar24Regular,
  CheckmarkCircle24Regular,
  Clock20Regular,
  Location20Regular,
} from '@fluentui/react-icons';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  createColumnHelper,
  SortingFn,
  FilterFn,
} from '@tanstack/react-table';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '@corpcal/shared';
import { fetchActivities } from '../api/activitiesApi';
import { fetchUsers } from '../api/lookupsApi';
import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { UserLookupItem } from '@corpcal/shared/api/types';
import { useAuth } from '../hooks/useAuth';

const useStyles = makeStyles({
  statusBadge: {
    paddingTop: '8px',
  },
  overviewInline: {
    display: 'inline',
  },
  overviewTitle: {
    fontWeight: 700,
  },
  overviewConfidential: {
    color: 'red',
  },
});

// Report entity type
type Report = {
  id: string;
  name: string;
  type?: 'planning' | 'look-ahead' | '30-60-90' | 'exec-look-ahead';
};

// Dummy data interface
type EventRow = {
  date: string;
  id: string;
  activityId: number;
  title: string;
  category: string[] | undefined;
  // type: string;
  status: 'New' | 'Reviewed' | 'Changed' | 'Deleted';
  confirmed: boolean;
  dateCreated: string;
  dateModified: Date | undefined;
  mine: boolean;
  sharedWithMe: boolean;
  ministry: string;
  summary: string | undefined;
  representatives: string[] | undefined;
  leads: string[] | undefined;
  commsMaterials: string[] | undefined;
  reports: Report[] | undefined;
  tags: string[] | undefined;
  startDate: Date;
  endDate: Date | undefined;
  location: string | undefined;
};

const getLastModifiedString = (modified: Date | undefined) => {
  if (!modified) {
    return undefined;
  }
  const rightNow = new Date();
  const difference = rightNow.getTime() - modified.getTime();
  const diffDays = getDaysDifference(modified, rightNow);
  if (diffDays < 1) {
    const hoursAgo = difference / (1000 * 3600);
    if (hoursAgo < 1) {
      if (Math.floor(difference / (1000 * 60)) < 2) {
        return 'Modified just now';
      } else {
        return `Modified ${Math.floor(difference / (1000 * 60))} minutes ago`;
      }
    } else {
      return `Modified ${Math.floor(difference / (1000 * 3600))} hours ago`;
    }
  } else if (diffDays < 30) {
    //we might want to be more precise about calculating months, etc. but not now
    return `Modified ${diffDays} days ago`;
  } else if (diffDays > 30 && diffDays < 365) {
    return `Modified ${rightNow.getMonth() - modified.getMonth()} months ago`;
  } else {
    return `Modified ${Math.floor(diffDays / 365)} years ago`;
  }
};

const sortStatusFn: SortingFn<EventRow> = (rowA, rowB) => {
  const a = rowA.original.dateModified;
  const b = rowB.original.dateModified;
  if (a && !b) return 1;
  else if (!a && b) return -1;
  else if (a && b) return b.getTime() - a.getTime();
  return 0;
};

const getDaysDifference = (date1: Date, date2: Date): number => {
  // Calculate the difference in milliseconds
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());

  // Convert milliseconds to days
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const diffInDays = diffInMs / oneDayInMs;

  // Round the result to the nearest whole day
  return Math.floor(diffInDays); // "round" and "ciel" are also options. I think floor makes most sense.
};

const mapActivityToEventRow = (activity: ActivityResponse): EventRow => {
  // Map ActivityResponse to EventRow format
  // Format date range
  const startDate = activity.startDate
    ? new Date(activity.startDate)
    : new Date();
  const endDate = activity.endDate ? new Date(activity.endDate) : undefined;
  const formatDateRange = () => {
    const start = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (endDate) {
      const end = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${start} – ${end}`;
    }
    return start;
  };

  // Map lookAheadStatus to status
  const statusMap: Record<string, 'New' | 'Reviewed' | 'Changed' | 'Deleted'> =
    {
      new: 'New',
      none: 'Reviewed',
      changed: 'Changed',
    };
  const status = activity.lookAheadStatus
    ? statusMap[activity.lookAheadStatus] || 'Reviewed'
    : 'Reviewed';

  // Check if confirmed - using dateStatus or timeStatus if available
  const confirmed = false; // TODO: Determine confirmation status from available fields

  // Compile representatives
  const representatives = activity.representativesAttending?.map(
    (r) => r.representative
  );

  // Compile leads from commsContacts and eventPlannerLeadId (store IDs, not names)
  const leads: string[] = [];
  // Add comms contact IDs if present (find the lead contact)
  const leadCommsContact = activity.commsContacts?.find((c) => c.isLead);
  if (leadCommsContact) {
    leads.push(String(leadCommsContact.userId));
  }
  // Add event planner ID if present (and different from comms contact lead)
  if (
    activity.eventPlannerLeadId &&
    activity.eventPlannerLeadId !== leadCommsContact?.userId
  ) {
    leads.push(String(activity.eventPlannerLeadId));
  }

  // Compile reports based on reportSettings
  // An activity appears in a report if it's NOT omitted (omitted !== true)
  const reports: Report[] = [];
  // Get report names that are omitted (omitted === true)
  const omittedReportNames = new Set(
    activity.reportSettings
      ?.filter((setting) => setting.omitted === true)
      .map((setting) => setting.name) ?? []
  );

  // Check if activity should appear in 'look-ahead' report
  if (!omittedReportNames.has('look-ahead')) {
    reports.push({ id: 'look-ahead', name: 'Look Ahead', type: 'look-ahead' });
  }

  // Check if activity should appear in 'thirty-sixty-ninety' report
  if (!omittedReportNames.has('30-60-90')) {
    reports.push({
      id: '30-60-90',
      name: '30/60/90 Day Report',
      type: '30-60-90',
    });
  }

  return {
    activityId: activity.id,
    id: activity.displayId || `ACT-${activity.id}`,
    title: activity.title || '',
    category:
      activity.category && activity.category.length > 0
        ? activity.category
        : undefined,
    // type: activity.type || 'General',
    status,
    confirmed,
    dateCreated: new Date(activity.createdDateTime).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    ),
    dateModified: activity.lastUpdatedDateTime
      ? new Date(activity.lastUpdatedDateTime)
      : undefined,
    mine: false, // TODO: check if current user is comms lead
    sharedWithMe: false, // TODO: check if user in sharedWith
    ministry: activity.leadOrg || '',
    summary: activity.summary || undefined,
    representatives:
      representatives && representatives.length > 0
        ? representatives
        : undefined,
    leads: leads.length > 0 ? leads : undefined,
    commsMaterials:
      activity.commsMaterials && activity.commsMaterials.length > 0
        ? activity.commsMaterials
        : undefined,
    reports: reports.length > 0 ? reports : undefined,
    tags:
      activity.tags && activity.tags.length > 0
        ? activity.tags.map((tag) => tag.text)
        : undefined,
    startDate,
    endDate,
    location: activity.venueAddress
      ? [
          activity.venueAddress.street,
          activity.venueAddress.city,
          activity.venueAddress.provinceOrState,
        ]
          .filter((part) => part)
          .join(', ') || undefined
      : undefined,
    date: formatDateRange(),
  };
};

const multiColumnTabFilterFn: FilterFn<EventRow> = (
  row,
  columnId,
  filterValue
) => {
  // Check if the filterValue exists in firstName, lastName, or email
  const lowerCaseFilter = String(filterValue).toLowerCase();
  if (lowerCaseFilter === 'recent' && row.original.dateModified) {
    const rightNow = new Date();
    return getDaysDifference(rightNow, row.original.dateModified) < 2;
  }
  return (
    filterValue === 'all' ||
    (lowerCaseFilter === 'mine' && row.original.mine) ||
    (lowerCaseFilter === 'shared' && row.original.sharedWithMe) ||
    String(row.original.ministry).toLowerCase().includes(lowerCaseFilter)
  );
};

// I'd love to consolidate this with the function above, but not bothering right now
const arrayIncludesStatusFilterFn: FilterFn<EventRow> = (
  row,
  columnId: string,
  filterValue: string[] | string | undefined
) => {
  if (filterValue && filterValue.length) {
    // don't filter anything if no filter selected
    return filterValue.includes(row.original.status.toLocaleLowerCase());
  }
  return true;
};
// Status colors map
const statusColor: Record<string, 'brand' | 'danger' | 'warning' | 'success'> =
  {
    New: 'success',
    Reviewed: 'brand',
    Changed: 'warning',
    Deleted: 'danger',
  };

interface EventTableProps {
  filters: ColumnFiltersState;
  globalFilterString: string;
}

export const EventTable: React.FC<EventTableProps> = ({
  filters,
  globalFilterString,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEditActivity = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [eventData, setEventData] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [users, setUsers] = useState<UserLookupItem[]>([]);
  const { dispatchToast } = useToastController();

  // Create a map from user ID to user name for display
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.id.toString(), user.name || user.label);
    });
    return map;
  }, [users]);

  // Fetch activities and users from API
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [activities, usersData] = await Promise.all([
        fetchActivities(),
        fetchUsers(),
      ]);
      setUsers(usersData);

      // Check if activities is an array
      if (!Array.isArray(activities)) {
        console.error('Activities response is not an array:', activities);
        setError('Invalid response format from server');
        setEventData([]);
        return;
      }

      const mappedData = activities.map(mapActivityToEventRow);
      setEventData(mappedData);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch activities'
      );
      setEventData([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const socket = io(apiUrl);

    socket.on('connect', () => {
      console.log('EventTable WebSocket connected:', socket.id);
      // Subscribe to activity table updates
      socket.emit('subscribeToActivities');
    });

    socket.on('connect_error', (error) => {
      console.error('EventTable WebSocket connection error:', error);
    });

    // Listen for new activity created
    socket.on('activityCreated', async (data) => {
      console.log('Activity created:', data);

      // Refresh the table data
      await loadActivities();

      // Show toast notification
      dispatchToast(
        <Toast>
          <ToastTitle>New Activity Created</ToastTitle>
          <ToastBody>
            {data.displayId || `ACT-${data.id}`}: {data.title}
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 5000 }
      );
    });

    // Listen for activity updated
    socket.on('activityUpdated', async (data) => {
      console.log('Activity updated:', data);

      // Refresh the table data
      await loadActivities();

      // Show toast notification
      dispatchToast(
        <Toast>
          <ToastTitle>Activity Updated</ToastTitle>
          <ToastBody>
            {data.displayId || `ACT-${data.id}`}: {data.title}
          </ToastBody>
        </Toast>,
        { intent: 'info', timeout: 5000 }
      );
    });

    // Cleanup on unmount
    return () => {
      socket.emit('unsubscribeFromActivities');
      socket.off('activityCreated');
      socket.off('activityUpdated');
      socket.disconnect();
    };
  }, [dispatchToast]);

  useEffect(() => {
    setColumnFilters(filters);
  }, [filters]);

  // this might be redundant. Alex should give this some more thought.
  useEffect(() => {
    setGlobalFilter(globalFilterString);
  }, [globalFilterString, globalFilter]);

  const styles = useStyles();
  const columnHelper = createColumnHelper<EventRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select', // Unique ID for your checkbox column
        size: 20, // Narrow for checkboxes
        enableResizing: false, // Disable resizing for this column
        enablePinning: true,
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            //  indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            title="these checkboxes don't do anything yet"
          />
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Overview',
        enableResizing: false,
        enablePinning: true,
        size: 180,
        cell: ({ row }) => (
          <div>
            {/* todo: Let's make these complicated columns separate components, and pass everything in as props*/}
            <div className={styles.overviewInline}>
              <div>{row.original.id}</div>
            </div>
            <div className={styles.overviewTitle}>{row.original.title}</div>
            <div>
              <Badge
                className={row.original.category?.[0]}
                appearance={
                  row.original.category?.[0] === 'Release'
                    ? 'filled'
                    : 'outline'
                }
                style={{
                  whiteSpace: 'normal',
                  height: 'auto',
                  minHeight: '20px',
                }}
              >
                {row.original.category?.[0]}
              </Badge>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('summary', {
        header: 'Summary',
        size: 250,
        enableResizing: false,
        cell: ({ row }) => (
          <div>
            {row.original.summary}
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {row.original.tags && row.original.tags.length
                ? row.original.tags.map((tag) => (
                    <Badge
                      key={tag}
                      appearance="filled"
                      style={{
                        whiteSpace: 'normal',
                        height: 'auto',
                        minHeight: '20px',
                      }}
                    >
                      {tag}
                    </Badge>
                  ))
                : null}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('date', {
        header: 'Schedule',
        cell: ({ row }) => {
          const start: Date = row.original.startDate;
          const end: Date | undefined = row.original.endDate;

          const dateLine = (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Calendar24Regular />
              <span>
                {start.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
                {end
                  ? ` – ${end.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}`
                  : ''}
              </span>
            </div>
          );

          const timeLine = (
            <div
              style={{ marginTop: 6, display: 'flex', alignItems: 'center' }}
            >
              <Clock20Regular />
              <span>
                {start.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {end
                  ? ` – ${end.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  : ''}
              </span>
            </div>
          );

          const locationLine = row.original.location ? (
            <div
              style={{ marginTop: 6, display: 'flex', alignItems: 'center' }}
            >
              <Location20Regular />
              <span>{row.original.location}</span>
            </div>
          ) : null;

          return (
            <div>
              {dateLine}
              {timeLine}
              {locationLine}
            </div>
          );
        },
      }),
      columnHelper.accessor('representatives', {
        header: 'Representatives',
        filterFn: (row, columnId, filterValue: string[] | undefined) => {
          // filterValue is an array of selected representative names
          if (!filterValue || !filterValue.length) return true;
          const representatives = row.original.representatives || [];
          // Only show rows that have at least one selected representative
          return filterValue.some((val: string) =>
            representatives.includes(val)
          );
        },
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {row.original.representatives && row.original.representatives.length
              ? row.original.representatives.map((rep) => (
                  <Badge
                    key={rep}
                    appearance="outline"
                    style={{
                      whiteSpace: 'normal',
                      height: 'auto',
                      minHeight: '20px',
                    }}
                  >
                    {rep}
                  </Badge>
                ))
              : null}
          </div>
        ),
      }),
      columnHelper.accessor('leads', {
        header: 'Leads',
        size: 80,
        cell: ({ row, table }) => {
          const userMap = (
            table.options.meta as { userMap?: Map<string, string> }
          )?.userMap;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {row.original.leads && row.original.leads.length
                ? row.original.leads.map((lead) => {
                    const displayName = userMap?.get(lead) || lead;
                    return (
                      <div key={lead} style={{ fontWeight: 'bold' }}>
                        {displayName}
                      </div>
                    );
                  })
                : null}
            </div>
          );
        },
        filterFn: (row, columnId, filterValue: string[] | undefined) => {
          // filterValue is an array of selected event lead IDs
          if (!filterValue || !filterValue.length) return true;
          const leads = row.original.leads || [];
          // Only show rows that have at least one selected event lead
          return filterValue.some((val: string) => leads.includes(val));
        },
      }),
      columnHelper.accessor('commsMaterials', {
        header: 'Comms Materials',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('reports', {
        header: 'Reports',
        size: 100,
        filterFn: (row, columnId, filterValue: string[] | undefined) => {
          // filterValue is an array of selected report IDs or names
          if (!filterValue || !filterValue.length) return true;
          const reports = row.original.reports || [];
          // Only show rows that have at least one selected report
          return filterValue.some((val: string) =>
            reports.some((r) => r.id === val || r.name === val)
          );
        },
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {row.original.reports && row.original.reports.length
              ? row.original.reports.map((report) => (
                  <Badge
                    key={report.id}
                    appearance="filled"
                    style={{
                      whiteSpace: 'normal',
                      height: 'auto',
                      minHeight: '20px',
                    }}
                  >
                    {report.name}
                  </Badge>
                ))
              : null}
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        //id: 'status', // Unique ID for this display column
        header: 'Status',
        size: 100,
        filterFn: arrayIncludesStatusFilterFn,
        sortingFn: sortStatusFn,
        sortUndefined: -1,

        cell: ({ row }) => (
          <div className={styles.statusBadge}>
            <Badge
              appearance="filled"
              color={
                statusColor[row.original.status as keyof typeof statusColor]
              }
              shape="circular"
              size="large"
            >
              {row.original.status}
            </Badge>
            {row.original.dateModified && (
              <div>{getLastModifiedString(row.original.dateModified)}</div>
            )}
            <div>Created {row.original.dateCreated}</div>
          </div>
        ),
      }),
      columnHelper.accessor('confirmed', {
        size: 20,
        cell: (info) => (info.getValue() ? <CheckmarkCircle24Regular /> : null),
      }),

      // TODO: make all these a 'tabListFilter' column with all the values, and custom filter to victory.
      columnHelper.accessor('category', {
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: (row, columnId, filterValue) => {
          // Expecting filterValue to be an array of selected category strings
          if (!filterValue) return true;
          const selected = Array.isArray(filterValue)
            ? filterValue
            : [filterValue];
          if (selected.length === 0) return true;
          const lowerSelected = selected.map((s: string) =>
            String(s).toLowerCase()
          );
          const rowCategories = row.original.category || [];
          const lowerRowCategories = rowCategories.map((cat) =>
            cat.toLowerCase()
          );
          // Return true if any selected category is in the row's categories
          return lowerSelected.some((selected) =>
            lowerRowCategories.includes(selected)
          );
        },
      }),
      columnHelper.accessor('title', {
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: multiColumnTabFilterFn,
      }),
      columnHelper.accessor('mine', {
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: multiColumnTabFilterFn,
      }),
      columnHelper.accessor('sharedWithMe', {
        enableHiding: true,
        cell: (info) => (info.getValue() ? <CheckmarkCircle24Regular /> : null),
        filterFn: multiColumnTabFilterFn,
      }),
      columnHelper.accessor('ministry', {
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: multiColumnTabFilterFn,
      }),
      columnHelper.accessor('tags', {
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: (row, columnId, filterValue: string[] | undefined) => {
          if (filterValue && filterValue.length) {
            // don't filter anything if no filter selected
            const rowTags = row.original.tags || [];
            return filterValue.some((val: string) => rowTags.includes(val));
          } else return true;
        },
      }),
      // Hidden column for updatedDateRange filtering
      columnHelper.accessor('dateModified', {
        id: 'updatedDateRange',
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: (
          row,
          columnId,
          filterValue: { start: string; end: string } | undefined
        ) => {
          if (!filterValue || !filterValue.start || !filterValue.end)
            return true;

          const dateModified = row.original.dateModified;
          if (!dateModified) return false;

          const startDate = new Date(filterValue.start);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(filterValue.end);
          endDate.setHours(23, 59, 59, 999);

          const modifiedDate = new Date(dateModified);

          return modifiedDate >= startDate && modifiedDate <= endDate;
        },
      }),
      // Hidden column for createdDateRange filtering
      columnHelper.accessor('dateCreated', {
        id: 'createdDateRange',
        enableHiding: true,
        cell: (info) => info.getValue(),
        filterFn: (
          row,
          columnId,
          filterValue: { start: string; end: string } | undefined
        ) => {
          if (!filterValue || !filterValue.start || !filterValue.end)
            return true;

          const dateCreated = row.original.dateCreated;
          if (!dateCreated) return false;

          const startDate = new Date(filterValue.start);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(filterValue.end);
          endDate.setHours(23, 59, 59, 999);

          const createdDate = new Date(dateCreated);

          return createdDate >= startDate && createdDate <= endDate;
        },
      }),
    ],
    [
      columnHelper,
      styles.overviewInline,
      styles.overviewTitle,
      styles.statusBadge,
    ]
  );

  const table = useReactTable({
    meta: {
      userMap,
    },
    data: eventData,
    columns,
    enableRowSelection: true,
    state: {
      sorting,
      pagination: { pageIndex, pageSize: 5 },
      globalFilter,
      columnFilters,
      columnVisibility: {
        sharedWithMe: false,
        mine: false,
        ministry: false,
        title: false,
        category: false,
        tags: false,
        updatedDateRange: false,
        createdDateRange: false,
      },
      columnPinning: { left: ['select', 'id'] },
    },
    filterFns: {
      multiColumn: multiColumnTabFilterFn,
      // dateRange: dateRangeFilterFn,
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize: 2 });
        setPageIndex(newState.pageIndex);
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // needed for client-side filtering
    onColumnFiltersChange: setColumnFilters,

    onGlobalFilterChange: setGlobalFilter,
    manualPagination: false,
    manualSorting: false,
    enableColumnFilters: true,
    autoResetPageIndex: false, // Preserve current page when data updates
  });

  const filteredRows = table.getFilteredRowModel().rows;

  return (
    <div
      style={{
        // padding: '0px, 100px, 0px, 24px',
        background: '#fff',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {isLoading && (
        <div
          style={{
            padding: 32,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spinner label="Loading activities..." />
        </div>
      )}
      {error && (
        <div
          style={{
            padding: 32,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'red',
          }}
        >
          Error: {error}
        </div>
      )}
      {!isLoading && !error && (
        <>
          <div
            onScroll={(e) => {
              const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
              setIsScrolled(scrollLeft > 0);
            }}
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {filteredRows.length > 0 && (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHeaderCell
                          key={header.id}
                          onClick={
                            header.column.getCanSort()
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                          style={{
                            cursor: header.column.getCanSort()
                              ? 'pointer'
                              : undefined,
                            width: header.getSize(),
                            position: header.column.getIsPinned()
                              ? 'sticky'
                              : 'relative', // Make pinned columns sticky
                            left: header.column.getIsPinned()
                              ? header.column.id === 'id' // Only offset the 'id' column. This was a freaking ordeal
                                ? `${header.column.getStart('left') + 16}px`
                                : `${header.column.getStart('left')}px`
                              : 'auto',
                            zIndex:
                              header.column.getIsPinned() && isScrolled
                                ? 1
                                : 'auto', // Only apply z-index when scrolled
                            background: header.column.getIsPinned()
                              ? '#fff'
                              : 'transparent', // Optional: Match table background
                            boxShadow:
                              header.column.getIsPinned() && isScrolled
                                ? '2px 0 4px rgba(0, 0, 0, 0.1)'
                                : 'none', // Add shadow when scrolled
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() === 'asc' && ' ▲'}
                          {header.column.getIsSorted() === 'desc' && ' ▼'}
                        </TableHeaderCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (canEditActivity) {
                          void navigate(
                            `/activities/${row.original.activityId}/edit`
                          );
                        } else {
                          dispatchToast(
                            <Toast>
                              <ToastTitle>View only</ToastTitle>
                              <ToastBody>
                                You have view-only access to activities.
                              </ToastBody>
                            </Toast>,
                            { intent: 'info', timeout: 3000 }
                          );
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            position: cell.column.getIsPinned()
                              ? 'sticky'
                              : 'relative', // Make pinned cells sticky
                            left: cell.column.getIsPinned()
                              ? cell.column.id === 'id'
                                ? `${cell.column.getStart('left') + 16}px`
                                : `${cell.column.getStart('left')}px`
                              : 'auto',
                            zIndex:
                              cell.column.getIsPinned() && isScrolled
                                ? 1
                                : 'auto', // Only apply z-index when scrolled
                            background: cell.column.getIsPinned()
                              ? '#fff'
                              : 'transparent', // Optional: Match row background
                            boxSizing: 'border-box', // Include padding in width calculation
                            width: cell.column.columnDef.size,
                            minWidth: cell.column.columnDef.size,
                            boxShadow:
                              cell.column.getIsPinned() && isScrolled
                                ? '2px 0 4px rgba(0, 0, 0, 0.1)'
                                : 'none', // Add shadow when scrolled
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {filteredRows.length === 0 && (
              <div
                style={{
                  padding: 32,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                No events found matching the selected filters.
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// This component renders a table of events with columns for date, ID, title, category, type, status, and confirmation status.
// It uses Fluent UI components for styling and TanStack Table for data management.
