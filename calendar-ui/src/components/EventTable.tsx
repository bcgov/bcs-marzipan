import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Calendar24Regular,
  ChevronDown24Regular,
  CheckmarkCircle24Regular,
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
import { useNavigate } from 'react-router-dom';
import { fetchActivities } from '../api/activitiesApi';
import { fetchUsers } from '../api/lookupsApi';
import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { UserLookupItem } from '@corpcal/shared/api/types';

const useStyles = makeStyles({
  container: {
    width: '100%',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
  },
  headerCell: {
    padding: '12px',
    fontWeight: '600',
    fontSize: '14px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
    textAlign: 'left',
  },
  bodyRow: {
    borderBottom: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: '#fafafa',
    },
  },
  bodyCell: {
    padding: '12px',
    fontSize: '14px',
  },
  overviewCell: {
    minWidth: '200px',
  },
  summaryCell: {
    minWidth: '300px',
    maxWidth: '350px',
  },
  scheduleCell: {
    minWidth: '250px',
  },
  staticCell: {
    minWidth: '150px',
  },
  expandableCell: {
    minWidth: '200px',
  },
  statusCell: {
    minWidth: '120px',
  },
});

type Report = {
  id: string;
  name: string;
  type?: 'planning' | 'look-ahead' | '30-60-90' | 'exec-look-ahead';
};

type EventRow = {
  id: string;
  displayId: string;
  title: string;
  category: string[] | undefined;
  categories: Array<{ name: string; isApproved?: boolean }>;
  status: 'New' | 'Reviewed' | 'Changed' | 'Deleted';
  dateCreated: string;
  dateModified: Date | undefined;
  summary: string | undefined;
  representatives: string[] | undefined;
  leads: string[] | undefined;
  commsMaterials: string[] | undefined;
  reports: Report[] | undefined;
  startDate: Date;
  endDate: Date | undefined;
  location: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  dateConfirmed: boolean;
  timeConfirmed: boolean;
  premierInvited: boolean;
  premierConfirmed: boolean;
  ministers: Array<{ name: string; confirmed?: boolean }>;
};

const mapActivityToEventRow = (activity: ActivityResponse): EventRow => {
  const startDate = activity.startDate
    ? new Date(activity.startDate)
    : new Date();
  const endDate = activity.endDate ? new Date(activity.endDate) : undefined;

  const startTime = activity.startTime ? activity.startTime : undefined;
  const endTime = activity.endTime ? activity.endTime : undefined;

  const statusMap: Record<string, 'New' | 'Reviewed' | 'Changed' | 'Deleted'> =
    {
      new: 'New',
      none: 'Reviewed',
      changed: 'Changed',
    };
  const status = activity.lookAheadStatus
    ? statusMap[activity.lookAheadStatus] || 'Reviewed'
    : 'Reviewed';

  const representatives = activity.representativesAttending?.map(
    (r) => r.representative
  );

  const leads: string[] = [];
  const leadCommsContact = activity.commsContacts?.find((c) => c.isLead);
  if (leadCommsContact) {
    leads.push(String(leadCommsContact.userId));
  }
  if (
    activity.eventPlannerLeadId &&
    activity.eventPlannerLeadId !== leadCommsContact?.userId
  ) {
    leads.push(String(activity.eventPlannerLeadId));
  }

  const reports: Report[] = [];
  const omittedReportNames = new Set(
    activity.reportSettings
      ?.filter((setting) => setting.omitted === true)
      .map((setting) => setting.name) ?? []
  );

  if (!omittedReportNames.has('look-ahead')) {
    reports.push({ id: 'look-ahead', name: 'Look Ahead', type: 'look-ahead' });
  }

  if (!omittedReportNames.has('30-60-90')) {
    reports.push({
      id: '30-60-90',
      name: '30/60/90 Day Report',
      type: '30-60-90',
    });
  }

  const location = activity.venueAddress
    ? [
        activity.venueAddress.street,
        activity.venueAddress.city,
        activity.venueAddress.provinceOrState,
      ]
        .filter((part) => part)
        .join(', ') || undefined
    : undefined;

  // Extract ministers (excluding premier)
  const ministers =
    activity.representativesAttending
      ?.slice(0, 3)
      .map((r) => ({ name: r.representative })) || [];

  return {
    id: activity.displayId || `ACT-${activity.id}`,
    displayId: activity.displayId || `ACT-${activity.id}`,
    title: activity.title || '',
    category:
      activity.category && activity.category.length > 0
        ? activity.category
        : undefined,
    categories:
      activity.category?.map((cat) => ({ name: cat, isApproved: true })) || [],
    status,
    dateCreated: new Date(activity.createdDateTime).toLocaleDateString(),
    dateModified: activity.lastUpdatedDateTime
      ? new Date(activity.lastUpdatedDateTime)
      : undefined,
    summary: activity.summary || undefined,
    representatives: representatives || undefined,
    leads: leads.length > 0 ? leads : undefined,
    commsMaterials:
      activity.commsMaterials && activity.commsMaterials.length > 0
        ? activity.commsMaterials
        : undefined,
    reports: reports.length > 0 ? reports : undefined,
    startDate,
    endDate,
    location,
    startTime,
    endTime,
    dateConfirmed: activity.dateStatus === 'Confirmed' || false,
    timeConfirmed: activity.timeStatus === 'Confirmed' || false,
    premierInvited: activity.premierRequestedId !== null,
    premierConfirmed: activity.premierRequestedId !== null,
    ministers,
  };
};

// Summary text truncation component
const SummaryCell = ({ summary }: { summary: string | undefined }) => {
  const [expanded, setExpanded] = useState(false);
  const MAX_LINES = 5;
  const lineHeight = 20;
  const maxHeight = MAX_LINES * lineHeight;

  if (!summary) return <div style={{ color: '#999' }}>—</div>;

  const needsTruncation = summary.split('\n').length > MAX_LINES;

  return (
    <div>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: expanded ? 'none' : `${maxHeight}px`,
          transition: 'max-height 0.2s ease',
          lineHeight: '1.4',
        }}
      >
        {summary}
      </div>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0078d4',
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '4px',
            fontSize: '13px',
          }}
        >
          {expanded ? 'show less' : 'show more'}
        </button>
      )}
    </div>
  );
};

// Ministers expandable cell component
const MinistersCell = ({
  ministers,
}: {
  ministers: Array<{ name: string; confirmed?: boolean }>;
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!ministers || ministers.length === 0) {
    return <div style={{ color: '#999' }}>—</div>;
  }

  const displayedMinisters = expanded ? ministers : ministers.slice(0, 2);
  const hasMore = ministers.length > 2;

  return (
    <div>
      {displayedMinisters.map((minister, idx) => (
        <div key={idx} style={{ marginBottom: '4px' }}>
          <Badge
            appearance="outline"
            style={{
              whiteSpace: 'normal',
              height: 'auto',
              minHeight: '20px',
            }}
          >
            {minister.name}
            {minister.confirmed && ' ✓'}
          </Badge>
        </div>
      ))}
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0078d4',
            cursor: 'pointer',
            padding: '0',
            fontSize: '12px',
            marginTop: '4px',
          }}
        >
          + {ministers.length - 2} more
        </button>
      )}
      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0078d4',
            cursor: 'pointer',
            padding: '0',
            fontSize: '12px',
            marginTop: '4px',
          }}
        >
          show less
        </button>
      )}
    </div>
  );
};

// Schedule cell component
const ScheduleCell = ({
  startDate,
  endDate,
  startTime,
  endTime,
  location,
  dateConfirmed,
  timeConfirmed,
  premierInvited,
  premierConfirmed,
}: {
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  dateConfirmed: boolean;
  timeConfirmed: boolean;
  premierInvited: boolean;
  premierConfirmed: boolean;
}) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ fontSize: '13px' }}>
      <div
        style={{
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Calendar24Regular style={{ fontSize: '16px' }} />
        <span>
          {formatDate(startDate)}
          {endDate ? ` – ${formatDate(endDate)}` : ''}
        </span>
        {dateConfirmed && (
          <CheckmarkCircle24Regular
            style={{ fontSize: '14px', color: '#107c10' }}
          />
        )}
      </div>
      {(startTime || timeConfirmed) && (
        <div style={{ marginBottom: '6px' }}>
          {startTime && (
            <span>
              {startTime}
              {endTime ? ` – ${endTime}` : ''}
            </span>
          )}
          {timeConfirmed && (
            <CheckmarkCircle24Regular
              style={{ fontSize: '14px', color: '#107c10' }}
            />
          )}
        </div>
      )}
      {location && (
        <div style={{ marginBottom: '6px', fontSize: '12px', color: '#666' }}>
          {location}
        </div>
      )}
      {premierInvited && (
        <div style={{ marginTop: '6px' }}>
          <Badge
            appearance="filled"
            style={{
              whiteSpace: 'normal',
              height: 'auto',
              minHeight: '20px',
              backgroundColor: premierConfirmed ? '#107c10' : '#ffc107',
              color: '#fff',
            }}
          >
            Premier Eby: {premierConfirmed ? 'Confirmed' : 'TBC'}
          </Badge>
        </div>
      )}
    </div>
  );
};

interface EventTableProps {
  filters: ColumnFiltersState;
  globalFilterString: string;
}

const statusColor = {
  New: 'informative',
  Reviewed: 'success',
  Changed: 'warning',
  Deleted: 'danger',
} as const;

export const EventTable: React.FC<EventTableProps> = ({
  filters,
  globalFilterString,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [users, setUsers] = useState<UserLookupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitiesData, usersData] = await Promise.all([
          fetchActivities(),
          fetchUsers(),
        ]);
        setActivities(activitiesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      const displayName = user.name || user.email || String(user.id);
      map.set(String(user.id), displayName);
    });
    return map;
  }, [users]);

  const data = useMemo(
    () => activities.map(mapActivityToEventRow),
    [activities]
  );

  const columnHelper = createColumnHelper<EventRow>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Overview',
        size: 220,
        cell: ({ row }) => (
          <div
            onClick={() => void navigate(`/edit-activity/${row.original.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}
            >
              {row.original.displayId}
            </div>
            <div
              style={{
                fontWeight: '600',
                marginBottom: '8px',
                color: '#000',
              }}
            >
              {row.original.title}
            </div>
            {row.original.categories.map((cat, idx) => (
              <Badge
                key={idx}
                appearance="filled"
                style={{
                  whiteSpace: 'normal',
                  height: 'auto',
                  minHeight: '20px',
                  marginRight: '4px',
                  marginBottom: '4px',
                }}
              >
                {cat.name}
                {cat.isApproved && ' ✓'}
              </Badge>
            ))}
          </div>
        ),
      }),

      columnHelper.accessor('summary', {
        header: 'Summary',
        size: 300,
        cell: ({ row }) => <SummaryCell summary={row.original.summary} />,
      }),

      columnHelper.accessor('startDate', {
        header: 'Scheduling',
        size: 280,
        cell: ({ row }) => (
          <ScheduleCell
            startDate={row.original.startDate}
            endDate={row.original.endDate}
            startTime={row.original.startTime}
            endTime={row.original.endTime}
            location={row.original.location}
            dateConfirmed={row.original.dateConfirmed}
            timeConfirmed={row.original.timeConfirmed}
            premierInvited={row.original.premierInvited}
            premierConfirmed={row.original.premierConfirmed}
          />
        ),
      }),

      columnHelper.accessor('leads', {
        header: 'Leads',
        size: 180,
        cell: ({ row }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {row.original.leads?.map((lead) => {
              const displayName = userMap.get(lead) || lead;
              return (
                <div
                  key={lead}
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Ministry: {displayName}
                </div>
              );
            }) || <span style={{ color: '#999' }}>—</span>}
          </div>
        ),
      }),

      columnHelper.accessor('commsMaterials', {
        header: 'Materials',
        size: 200,
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {row.original.commsMaterials?.map((material, idx) => (
              <Badge key={idx} appearance="filled">
                {material}
              </Badge>
            )) || <span style={{ color: '#999' }}>—</span>}
          </div>
        ),
      }),

      columnHelper.accessor('status', {
        header: 'Status',
        size: 150,
        cell: ({ row }) => (
          <div>
            <Badge
              appearance="filled"
              color={statusColor[row.original.status]}
              shape="circular"
            >
              {row.original.status}
            </Badge>
            <div
              style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '4px',
              }}
            >
              Updated{' '}
              {row.original.dateModified
                ? new Date(row.original.dateModified).toLocaleDateString()
                : 'N/A'}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#666',
              }}
            >
              Created {row.original.dateCreated}
            </div>
          </div>
        ),
      }),
    ],
    [columnHelper, userMap, navigate]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      // Remove columnFilters from state since we're not using filter columns anymore
      // columnFilters: filters,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      userMap,
    },
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spinner label="Loading activities..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={styles.headerCell}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={styles.bodyRow}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={styles.bodyCell}
                  style={{ width: cell.column.columnDef.size }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
