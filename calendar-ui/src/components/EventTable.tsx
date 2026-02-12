import { Badge, makeStyles, Spinner } from '@fluentui/react-components';
import {
  Calendar24Regular,
  Clock24Regular,
  LocationRegular,
} from '@fluentui/react-icons';
import {
  ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Languages, NotebookText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type {
  ActivityResponse,
  UserLookupItem,
} from '@corpcal/shared/api/types';

import { fetchActivities } from '../api/activitiesApi';
import { fetchUsers } from '../api/lookupsApi';
import { useAuth } from '../hooks/useAuth';
import { createLogger } from '../lib/logger';

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

type LeadInfo = {
  userId: number | string;
  type: 'comms' | 'eventPlanner';
};

type EventRow = {
  id: string;
  displayId: string;
  activityId: number;
  title: string;
  category: string[] | undefined;
  categories: Array<{ name: string; isApproved?: boolean }>;
  status: 'New' | 'Reviewed' | 'Changed' | 'Deleted';
  dateCreated: string;
  dateModified: Date | undefined;
  summary: string | undefined;
  tags: Array<{ id: number; text: string }> | undefined;
  representatives:
    | Array<{ representative: string; invitationStatus: string }>
    | undefined;
  leads: LeadInfo[] | undefined;
  commsMaterials: string[] | undefined;
  translationsRequired: string[] | undefined;
  reports: Report[] | undefined;
  startDate: Date;
  endDate: Date | undefined;
  location: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  dateConfirmed: boolean;
  timeConfirmed: boolean;
  premierInvited: boolean;
  premierStatus: string;
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

  const representatives = activity.representativesAttending?.map((r) => ({
    representative: r.representative,
    invitationStatus: r.invitationStatus || 'No',
  }));

  const leads: LeadInfo[] = [];
  const leadCommsContact = activity.commsContacts?.find((c) => c.isLead);
  if (leadCommsContact) {
    leads.push({ userId: String(leadCommsContact.userId), type: 'comms' });
  }
  if (
    activity.eventPlannerLeadId &&
    activity.eventPlannerLeadId !== leadCommsContact?.userId
  ) {
    leads.push({
      userId: String(activity.eventPlannerLeadId),
      type: 'eventPlanner',
    });
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
    id: String(activity.id),
    displayId: activity.displayId || `ACT-${activity.id}`,
    activityId: activity.id, // <- ADD THIS LINE
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
    tags: activity.tags && activity.tags.length > 0 ? activity.tags : undefined,
    representatives: representatives || undefined,
    leads: leads.length > 0 ? leads : undefined,
    commsMaterials:
      activity.commsMaterials && activity.commsMaterials.length > 0
        ? activity.commsMaterials
        : undefined,
    translationsRequired:
      activity.translationsRequired && activity.translationsRequired.length > 0
        ? activity.translationsRequired
        : undefined,
    reports: reports.length > 0 ? reports : undefined,
    startDate,
    endDate,
    location,
    startTime,
    endTime,
    dateConfirmed: activity.dateStatus === 'confirmed',
    timeConfirmed: activity.timeStatus === 'confirmed',
    premierInvited: activity.premierRequestedId !== null,
    premierStatus: activity.premierRequested || 'No',
    ministers,
  };
};

// Summary text truncation component
const SummaryCell = ({
  summary,
  tags,
}: {
  summary: string | undefined;
  tags: Array<{ id: number; text: string }> | undefined;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      // Check if content height exceeds 5 lines (approximately 100px with line-height 1.4)
      const lineHeight = 20;
      const maxLines = 5;
      const scrollHeight = contentRef.current.scrollHeight;
      const maxHeight = lineHeight * maxLines;
      setNeedsTruncation(scrollHeight > maxHeight);
    }
  }, [summary]);

  if (!summary) return <div style={{ color: '#999' }}>—</div>;

  return (
    <div>
      <div
        ref={contentRef}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4',
          fontSize: '13px',
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
            fontWeight: '400',
          }}
        >
          {expanded ? 'show less' : 'show more'}
        </button>
      )}
      {tags && tags.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              appearance="outline"
              style={{
                color: '#616161',
                whiteSpace: 'normal',
                height: 'auto',
                minHeight: '20px',
                fontSize: '12px',
              }}
            >
              {tag.text}
            </Badge>
          ))}
        </div>
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
  premierStatus,
  representatives,
}: {
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  dateConfirmed: boolean;
  timeConfirmed: boolean;
  premierInvited: boolean;
  premierStatus: string;
  representatives?: Array<{ representative: string; invitationStatus: string }>;
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
          gap: '6px',
        }}
      >
        <Calendar24Regular style={{ fontSize: '16px' }} />
        <span>
          {formatDate(startDate)}
          {endDate ? ` – ${formatDate(endDate)}` : ''}
        </span>
        <Badge
          appearance="outline"
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            height: '20px',
            color: '#616161',
            borderColor: '#d1d1d1',
            whiteSpace: 'nowrap',
          }}
        >
          {dateConfirmed ? 'Confirmed' : 'Not confirmed'}
        </Badge>
      </div>
      {(startTime || timeConfirmed !== undefined) && (
        <div
          style={{
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock24Regular style={{ fontSize: '16px' }} />
          <span>
            {startTime && (
              <>
                {startTime}
                {endTime ? ` – ${endTime}` : ''}
              </>
            )}
            {!startTime && '--:-- – --:--'}
          </span>
          <Badge
            appearance="outline"
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              height: '20px',
              color: '#616161',
              borderColor: '#d1d1d1',
              whiteSpace: 'nowrap',
            }}
          >
            {timeConfirmed ? 'Confirmed' : 'Not confirmed'}
          </Badge>
        </div>
      )}
      {location && (
        <div
          style={{
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '4px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <LocationRegular
            style={{ fontSize: '16px', marginTop: '2px', flexShrink: 0 }}
          />
          <span>{location}</span>
        </div>
      )}
      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        {premierStatus && premierStatus !== 'No' && (
          <Badge
            appearance="outline"
            style={{
              whiteSpace: 'normal',
              height: 'auto',
              minHeight: '20px',
              fontSize: '12px',
              color: '#616161',
            }}
          >
            Premier Eby: {premierStatus}
          </Badge>
        )}
        {representatives && representatives.length > 0 && (
          <>
            <Badge
              appearance="outline"
              style={{
                whiteSpace: 'normal',
                height: 'auto',
                minHeight: '20px',
                fontSize: '12px',
                color: '#616161',
              }}
            >
              {representatives[0].representative}
            </Badge>
            {representatives.length > 1 && (
              <Badge
                appearance="outline"
                style={{
                  whiteSpace: 'normal',
                  height: 'auto',
                  minHeight: '20px',
                  fontSize: '12px',
                  color: '#616161',
                }}
              >
                +{representatives.length - 1} other
                {representatives.length - 1 !== 1 ? 's' : ''}
              </Badge>
            )}
          </>
        )}
      </div>
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
const logger = createLogger('EventTable');

export const EventTable: React.FC<EventTableProps> = ({
  filters,
  globalFilterString,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEditActivity = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);

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
    const map = new Map<string, { name: string; jobTitle?: string | null }>();
    users.forEach((user) => {
      const displayName = user.name || user.email || String(user.id);
      const jobTitle = user.jobTitle ?? null;
      map.set(String(user.id), { name: displayName, jobTitle });
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
            onClick={() => void navigate(`/activities/${row.original.id}/edit`)}
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
        cell: ({ row }) => (
          <SummaryCell
            summary={row.original.summary}
            tags={row.original.tags}
          />
        ),
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
            premierStatus={row.original.premierStatus}
            representatives={row.original.representatives}
          />
        ),
      }),

      columnHelper.accessor('leads', {
        header: 'Leads',
        size: 180,
        cell: ({ row }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {row.original.leads?.map((lead) => {
              const userInfo = userMap.get(String(lead.userId));
              const displayName = userInfo?.name || String(lead.userId);
              const leadTitle = lead.type === 'comms' ? 'Comms' : 'Event Lead';
              return (
                <div key={lead.userId} style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: '400' }}>{leadTitle}</div>
                  <div>
                    <span style={{ fontWeight: '600' }}>{displayName}</span>
                  </div>
                </div>
              );
            }) || <span style={{ color: '#999' }}>—</span>}
          </div>
        ),
      }),

      columnHelper.accessor('commsMaterials', {
        header: 'Materials',
        size: 200,
        cell: ({ row }) => {
          const hasMaterials =
            row.original.commsMaterials &&
            row.original.commsMaterials.length > 0;
          const hasTranslations =
            row.original.translationsRequired &&
            row.original.translationsRequired.length > 0;

          if (!hasMaterials && !hasTranslations) {
            return <span style={{ color: '#999' }}>—</span>;
          }

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              {hasMaterials && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <NotebookText
                    size={16}
                    strokeWidth={1.5}
                    style={{ color: '#666', flexShrink: 0 }}
                  />
                  <span>{row.original.commsMaterials!.join(', ')}</span>
                </div>
              )}
              {hasTranslations && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Languages
                    size={16}
                    strokeWidth={1.5}
                    style={{ color: '#666', flexShrink: 0 }}
                  />
                  <span>{row.original.translationsRequired!.join(', ')}</span>
                </div>
              )}
            </div>
          );
        },
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
