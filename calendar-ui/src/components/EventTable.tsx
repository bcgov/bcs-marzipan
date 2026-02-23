import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type Column,
  type ColumnPinningState,
} from '@tanstack/react-table';
import {
  Calendar,
  Clock,
  Languages,
  Loader2,
  MapPin,
  NotebookText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ActivityResponse,
  UserLookupItem,
} from '@corpcal/shared/api/types';

import { fetchActivities } from '../api/activitiesApi';
import { fetchUsers } from '../api/lookupsApi';
import { ErrorState } from '../components/ErrorState';
import { createLogger } from '../lib/logger';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from './Table/tableConstants';
import { TablePagination } from './Table/TablePagination';
import { TableScrollContainer } from './Table/TableScrollContainer';
import { TableSummaryBar } from './Table/TableSummaryBar';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

const DEFAULT_PAGE_SIZE = 10;

/** Sticky column pinning styles for th/td (see TanStack Table column pinning sticky example) */
function getCommonPinningStyles<T>(
  column: Column<T, unknown>
): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '4px 0 4px -4px rgba(0,0,0,0.1)'
      : isFirstRightPinnedColumn
        ? '-4px 0 4px -4px rgba(0,0,0,0.1)'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: (isPinned
      ? 'sticky'
      : 'relative') as React.CSSProperties['position'],
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? 'var(--sticky-bg, #fff)' : undefined,
  };
}

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
  lastUpdatedBy: number;
  summary: string | undefined;
  tags: Array<{ id: number; text: string }> | undefined;
  representatives: string[] | undefined;
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

  const representatives = activity.representativesAttending;

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
    activity.representativesAttending?.slice(0, 3).map((name) => ({ name })) ||
    [];

  return {
    id: String(activity.id),
    displayId: activity.displayId || `ACT-${activity.id}`,
    activityId: activity.id,
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
    lastUpdatedBy: activity.lastUpdatedBy,
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

  if (!summary) return <div className="text-slate-400">—</div>;

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
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-primary mt-1 cursor-pointer border-none bg-transparent p-0 text-[13px] font-normal"
        >
          {expanded ? 'show less' : 'show more'}
        </button>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="h-auto min-h-5 text-xs whitespace-normal text-slate-600"
            >
              {tag.text}
            </Badge>
          ))}
        </div>
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
  premierStatus: string;
  representatives?: string[];
}) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="text-[13px]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
        <span>
          {formatDate(startDate)}
          {endDate ? ` – ${formatDate(endDate)}` : ''}
        </span>
        <Badge
          variant="outline"
          className="h-5 border-slate-200 text-xs text-slate-600"
        >
          {dateConfirmed ? 'Confirmed' : 'Not confirmed'}
        </Badge>
      </div>
      {(startTime || timeConfirmed !== undefined) && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
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
            variant="outline"
            className="h-5 border-slate-200 text-xs text-slate-600"
          >
            {timeConfirmed ? 'Confirmed' : 'Not confirmed'}
          </Badge>
        </div>
      )}
      {location && (
        <div className="mb-1.5 flex items-start gap-1 text-xs text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{location}</span>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {premierStatus && premierStatus !== 'No' && (
          <Badge
            variant="outline"
            className="h-auto min-h-5 text-xs text-slate-600"
          >
            Premier Eby: {premierStatus}
          </Badge>
        )}
        {representatives && representatives.length > 0 && (
          <>
            <Badge
              variant="outline"
              className="h-auto min-h-5 text-xs text-slate-600"
            >
              {representatives[0]}
            </Badge>
            {representatives.length > 1 && (
              <Badge
                variant="outline"
                className="h-auto min-h-5 text-xs text-slate-600"
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

const statusVariant = {
  New: 'info' as const,
  Reviewed: 'success' as const,
  Changed: 'warning' as const,
  Deleted: 'destructive' as const,
};

const logger = createLogger('EventTable');

export const EventTable: React.FC = () => {
  const navigate = useNavigate();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['id'],
  });
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [users, setUsers] = useState<UserLookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onPaginationChangeStable = useCallback(
    (
      updaterOrValue:
        | ((prev: typeof pagination) => typeof pagination)
        | typeof pagination
    ) => {
      setPagination((prev) => {
        const next =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue;
        if (
          next.pageIndex === prev.pageIndex &&
          next.pageSize === prev.pageSize
        ) {
          return prev;
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitiesData, usersData] = await Promise.all([
          fetchActivities(),
          fetchUsers(),
        ]);
        setActivities(activitiesData);
        setUsers(usersData);
        setError(null);
      } catch (error) {
        logger.error('Error loading data:', error);
        setError('Failed to load activities. Please try again.');
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
            onClick={() => {
              void navigate(`/activity/${row.original.id}`);
            }}
            style={{
              cursor: 'pointer',
            }}
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
                variant="secondary"
                className="mr-1 mb-1 h-auto min-h-5 whitespace-normal"
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
            }) || <span className="text-slate-400">—</span>}
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
            return <span className="text-slate-400">—</span>;
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
        cell: ({ row }) => {
          const lastUpdatedUser = userMap.get(
            String(row.original.lastUpdatedBy)
          );
          const userName = lastUpdatedUser?.name || 'Unknown';
          const initials = userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          const hasUpdatedDate = row.original.dateModified;

          return (
            <div>
              <Badge variant={statusVariant[row.original.status]}>
                {row.original.status}
              </Badge>
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Avatar size="sm" title={userName}>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span>
                  {hasUpdatedDate
                    ? `Updated ${new Date(row.original.dateModified!).toLocaleDateString()}`
                    : `Created ${row.original.dateCreated}`}
                </span>
              </div>
              {hasUpdatedDate && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '4px',
                  }}
                >
                  Created {row.original.dateCreated}
                </div>
              )}
            </div>
          );
        },
      }),
    ],
    [columnHelper, userMap, navigate]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnPinning,
    },
    onSortingChange: setSorting,
    onPaginationChange: onPaginationChangeStable,
    onColumnPinningChange: (updater) =>
      setColumnPinning((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      ),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
    meta: {
      userMap,
    },
  });

  if (loading) {
    return (
      <div className="min-w-0 space-y-4">
        <TableSummaryBar
          count={0}
          singularLabel="entry"
          pluralLabel="entries"
        />
        <TableScrollContainer ref={tableScrollRef}>
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="text-sm text-slate-600">
              Loading activities...
            </span>
          </div>
        </TableScrollContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <ErrorState
          title="Failed to load activities"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            fetchActivities()
              .then((activitiesData) => {
                setActivities(activitiesData);
                return fetchUsers();
              })
              .then((usersData) => {
                setUsers(usersData);
              })
              .catch((err) => {
                logger.error('Error loading data:', err);
                setError('Failed to load activities. Please try again.');
              })
              .finally(() => setLoading(false));
          }}
        />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="min-w-0 space-y-4">
        <TableSummaryBar
          count={0}
          singularLabel="entry"
          pluralLabel="entries"
        />
        <TableScrollContainer ref={tableScrollRef}>
          <div className="py-12 text-center text-sm text-slate-600">
            <div className="mb-2 font-semibold">No activities found</div>
            <div>
              Create a new entry or adjust filters to see activities here.
            </div>
          </div>
        </TableScrollContainer>
      </div>
    );
  }

  const pageRows = table.getRowModel().rows;

  return (
    <div className="min-w-0 space-y-4">
      <TableSummaryBar
        count={data.length}
        singularLabel="entry"
        pluralLabel="entries"
      />
      <TableScrollContainer ref={tableScrollRef}>
        <table
          className={`${tableTable} min-w-[640px] border-separate border-spacing-0`}
          role="grid"
          aria-colcount={columns.length}
        >
          <thead className={tableThead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const pinStyles = getCommonPinningStyles(header.column);
                  return (
                    <th
                      key={header.id}
                      className={tableTh}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: header.getSize(),
                        cursor: header.column.getCanSort()
                          ? 'pointer'
                          : 'default',
                        ...pinStyles,
                        ...(pinStyles.position === 'sticky'
                          ? { backgroundColor: 'rgb(248 250 252)' }
                          : {}),
                      }}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className={`${tableBodyRow} bg-white`}>
                {row.getVisibleCells().map((cell) => {
                  const pinStyles = getCommonPinningStyles(cell.column);
                  const isSticky = pinStyles.position === 'sticky';
                  return (
                    <td
                      key={cell.id}
                      className={`${tableTd} text-sm text-slate-600`}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                        ...pinStyles,
                        ...(isSticky ? { backgroundColor: 'white' } : {}),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScrollContainer>
      {data.length > 0 && (
        <TablePagination
          totalItems={data.length}
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          onPageChange={(p) => {
            setPagination((prev) => ({ ...prev, pageIndex: p - 1 }));
            tableScrollRef.current?.scrollTo({ top: 0 });
          }}
          onPageSizeChange={(ps) => {
            setPagination((prev) => ({ ...prev, pageSize: ps, pageIndex: 0 }));
            tableScrollRef.current?.scrollTo({ top: 0 });
          }}
          aria-label="Calendar entries table pagination"
        />
      )}
    </div>
  );
};
