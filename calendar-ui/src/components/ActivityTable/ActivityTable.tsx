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
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ActivityResponse,
  UserLookupItem,
} from '@corpcal/shared/api/types';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { fetchActivities } from '@/api/activitiesApi';
import { fetchUsers } from '@/api/lookupsApi';
import { ErrorState } from '@/components/ErrorState';
import {
  ACTIVITY_TABLE_COLUMN_WIDTHS,
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/Table/tableConstants';
import { TablePagination } from '@/components/Table/TablePagination';
import { TableScrollContainer } from '@/components/Table/TableScrollContainer';
import { TableSummaryBar } from '@/components/Table/TableSummaryBar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { CopyableText } from '@/components/ui/copyable-text';
import {
  getLookAheadSectionLabel,
  getLookAheadStatusLabel,
} from '@/constants/form-options';
import { useAuth } from '@/hooks/useAuth';
import {
  formatDateRange,
  formatExactDate,
  formatRelativeTime,
  formatTime12h,
} from '@/lib/datetime-utils';
import { createLogger } from '@/lib/logger';

import {
  mapActivityResponseToTableRow,
  type ActivityTableRow,
} from './activityTableRow';

/**
 * Table width: The table uses table-fixed layout; its width is the sum of column
 * sizes. To increase max width, adjust ACTIVITY_TABLE_COLUMN_WIDTHS in tableConstants.ts
 * (size, minSize, maxSize per column). min-w-[640px] on the
 * table enforces a minimum width and more horizontal scroll when the container is narrow.
 * The page is wrapped by Layout > PageContainer (max-w-[96rem], px-12), so content width
 * is also capped there; any table width beyond that scrolls inside TableScrollContainer.
 */

const DEFAULT_PAGE_SIZE = 10;
const logger = createLogger('ActivityTable');

function getCommonPinningStyles<T>(
  column: Column<T, unknown>
): React.CSSProperties {
  const isPinned = column.getIsPinned();
  // const isLastLeftPinnedColumn =
  //   isPinned === 'left' && column.getIsLastColumn('left');
  // const isFirstRightPinnedColumn =
  //   isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    // boxShadow: isLastLeftPinnedColumn
    //   ? '8px 0 8px -8px rgba(0,0,0,0.05)'
    //   : isFirstRightPinnedColumn
    //     ? '-8px 0 8px -8px rgba(0,0,0,0.05)'
    //     : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.99 : 1,
    backdropFilter: isPinned ? 'blur(8px)' : undefined,
    WebkitBackdropFilter: isPinned ? 'blur(8px)' : undefined,
    position: (isPinned
      ? 'sticky'
      : 'relative') as React.CSSProperties['position'],
    zIndex: isPinned ? 1 : 0,
    backgroundColor:
      isPinned && column.id !== 'overview'
        ? 'var(--sticky-bg, #fff)'
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format representative name for badge: ministers show as "Minister &lt;LastName&gt;", others as-is.
 */
function formatRepresentativeBadgeText(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return name;
  const isMinister = /minister/i.test(trimmed) || /^hon\.?\s/i.test(trimmed);
  if (isMinister) {
    const parts = trimmed.split(/\s+/);
    const lastName = parts[parts.length - 1];
    return lastName ? `Minister ${lastName}` : name;
  }
  return name;
}

/** Sentence case for lookup display values: first letter upper, rest lower. */
function toSentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Cell sub-components
// ---------------------------------------------------------------------------

function OverviewCell({ row }: { row: ActivityTableRow }) {
  const pitchLabel = row.pitchRequiredStatus ?? row.pitchDate;
  const displayIdText = row.displayId ?? String(row.id);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs font-semibold text-slate-900">
        <span
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
        >
          <CopyableText
            text={displayIdText}
            copyLabel="Copy activity ID"
            variant="minimal"
          >
            {displayIdText}
          </CopyableText>
        </span>
        {row.isConfidential && (
          <span className="font-bold text-red-600 uppercase">CONFIDENTIAL</span>
        )}
        {row.isIssue && (
          <span className="font-bold text-red-600 uppercase">ISSUE</span>
        )}
      </div>
      <div className="mb-1 text-[16px] font-semibold text-slate-900">
        {row.title}
      </div>
      {pitchLabel && (
        <div className="mb-2 text-[13px] text-slate-600">
          Pitch: {toSentenceCase(pitchLabel)}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {row.activityCategories.map((cat) => (
          <Badge
            key={cat}
            variant="primary"
            className="h-auto min-h-5 whitespace-normal"
          >
            {toSentenceCase(cat)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SummaryCell({ row }: { row: ActivityTableRow }) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = 20;
      const maxLines = 5;
      setNeedsTruncation(
        contentRef.current.scrollHeight > lineHeight * maxLines
      );
    }
  }, [row.summary]);

  const status = row.lookAheadStatus;
  const section = row.lookAheadSection;
  const lookAheadLabel =
    status && status !== 'none'
      ? section
        ? `LA ${getLookAheadStatusLabel(status)}: ${getLookAheadSectionLabel(section)}`
        : `LA ${getLookAheadStatusLabel(status)}`
      : null;

  const showMoreLessButton = (
    <button
      type="button"
      data-no-row-nav
      aria-expanded={expanded}
      onClick={(e) => {
        e.stopPropagation();
        setExpanded(!expanded);
      }}
      className="-m-2 cursor-pointer border-none bg-transparent p-2 text-[12px] font-normal text-(--fluent-primary)"
    >
      {expanded ? 'Show less' : 'Show more'}
    </button>
  );

  const isCollapsedWithTruncation = needsTruncation && !expanded;

  return (
    <div>
      <div
        className={
          isCollapsedWithTruncation ? 'relative min-h-[1.4em]' : undefined
        }
      >
        <div
          ref={contentRef}
          className="text-[14px] leading-[1.4]"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {row.summary}
        </div>

        {isCollapsedWithTruncation && (
          <span
            className="group-hover/bg-[linear-gradient(to_right,transparent_0%,slate-50_35%,slate-50_100%)] absolute right-0 bottom-0 w-28"
            aria-hidden
          >
            <span className="flex justify-end bg-[linear-gradient(to_right,transparent_0%,white_35%,white_100%)] whitespace-nowrap [&>button]:inline">
              {showMoreLessButton}
            </span>
          </span>
        )}
      </div>

      {needsTruncation && expanded && (
        <div className="mt-1">{showMoreLessButton}</div>
      )}

      {(row.tags.length > 0 || lookAheadLabel) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lookAheadLabel && (
            <Badge variant="primary" className="h-auto min-h-5 text-xs">
              {lookAheadLabel}
            </Badge>
          )}
          {row.tags.map((tag) => (
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
}

function SchedulingCell({ row }: { row: ActivityTableRow }) {
  const dateRangeText =
    row.startDate && row.endDate && row.endDate !== row.startDate
      ? formatDateRange(row.startDate, row.endDate)
      : row.startDate
        ? formatExactDate(new Date(row.startDate), { includeYear: 'auto' })
        : '';

  return (
    <div className="text-[13px]">
      {row.startDate && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
          <span>{dateRangeText}</span>
          <Badge
            variant="outline"
            className="h-auto min-h-5 border-slate-200 text-xs text-slate-600"
          >
            {toSentenceCase(row.dateStatus)}
          </Badge>
        </div>
      )}

      {(row.allDay || row.startTime || row.timeStatus) && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <span>
            {row.allDay
              ? 'All day'
              : row.startTime
                ? `${formatTime12h(row.startTime)}${row.endTime ? ` \u2013 ${formatTime12h(row.endTime)}` : ''}`
                : '--:-- \u2013 --:--'}
          </span>
          <Badge
            variant="outline"
            className="h-5 border-slate-200 text-xs text-slate-600"
          >
            {toSentenceCase(row.timeStatus)}
          </Badge>
        </div>
      )}

      {row.venue && (
        <div className="mb-1.5 flex items-start gap-1">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>{row.venue}</span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {row.premierRequested &&
          row.premierRequested.toLowerCase() !== 'no' && (
            <Badge variant="primary" className="h-auto min-h-5 text-xs">
              Premier: {row.premierRequested}
            </Badge>
          )}
        {row.activityRepresentatives.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-slate-500" />
            {row.activityRepresentatives.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="h-auto min-h-5 text-xs text-slate-600"
              >
                {formatRepresentativeBadgeText(name)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadsCell({ row }: { row: ActivityTableRow }) {
  const lines: Array<{ label: string; value: string }> = [];

  if (row.leadOrg) lines.push({ label: 'Lead org', value: row.leadOrg });
  const leadMinistryDisplay =
    row.leadMinistryAbbreviation ?? row.leadMinistry ?? null;
  if (leadMinistryDisplay)
    lines.push({ label: 'Lead ministry', value: leadMinistryDisplay });
  if (row.commsLeadName)
    lines.push({ label: 'Comms lead', value: row.commsLeadName });
  if (row.eventLead) lines.push({ label: 'Event lead', value: row.eventLead });

  if (lines.length === 0) {
    return <span className="text-slate-400">&mdash;</span>;
  }

  const additionalComms = row.commsContactsCount - 1;

  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      {lines.map(({ label, value }) => (
        <div key={label}>
          <span className="text-slate-500">{label}: </span>
          <span className="font-medium">{value}</span>
          {label === 'Comms lead' && additionalComms > 0 && (
            <Badge
              variant="outline"
              className="ml-1 h-auto min-h-5 text-xs text-slate-600"
            >
              +{additionalComms}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function MaterialsCell({ row }: { row: ActivityTableRow }) {
  const status = row.translationsRequiredStatus;
  const languages = row.translationsRequired;
  const hasLanguages = languages.length > 0;
  const hasMaterials = row.commsMaterials.length > 0;

  const statusLower = status?.toLowerCase();
  const isPendingReview = statusLower === 'pending review';
  const isRequired = statusLower === 'required';
  const isNotRequired = statusLower === 'not required';

  let translationLine1: string | null = null;
  let translationLine2: string | null = null;

  if (isPendingReview) {
    translationLine1 = toSentenceCase(status!);
    if (hasLanguages) {
      translationLine2 = languages.map((s) => s.toUpperCase()).join(', ');
    }
  } else if (isRequired) {
    if (hasLanguages) {
      translationLine1 = languages.map((s) => s.toUpperCase()).join(', ');
    } else {
      translationLine1 = toSentenceCase(status!);
    }
  } else if (isNotRequired) {
    translationLine1 = toSentenceCase(status!);
    if (hasLanguages) {
      translationLine2 = languages.map((s) => s.toUpperCase()).join(', ');
    }
  } else if (status) {
    translationLine1 = hasLanguages
      ? languages.map((s) => s.toUpperCase()).join(', ')
      : toSentenceCase(status);
  } else if (hasLanguages) {
    translationLine1 = languages.map((s) => s.toUpperCase()).join(', ');
  }

  const showTranslationBlock =
    translationLine1 != null || translationLine2 != null;

  if (!showTranslationBlock && !hasMaterials) {
    return <span className="text-slate-400">&mdash;</span>;
  }

  return (
    <div className="flex flex-col gap-2 text-[13px]">
      {showTranslationBlock && (
        <div className="flex items-start gap-1.5">
          <Languages
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          />
          <div className="flex flex-col gap-0.5">
            {translationLine1 && <span>{translationLine1}</span>}
            {translationLine2 && (
              <span className="text-slate-600">{translationLine2}</span>
            )}
          </div>
        </div>
      )}
      {hasMaterials && (
        <div className="flex items-start gap-1.5">
          <NotebookText
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          />
          <span>
            {row.commsMaterials.map((m) => toSentenceCase(m)).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusCell({
  row,
  userMap,
}: {
  row: ActivityTableRow;
  userMap: Map<string, { name: string; jobTitle?: string | null }>;
}) {
  const lastUpdatedUser = userMap.get(String(row.lastUpdatedBy));
  const userName = lastUpdatedUser?.name || 'Unknown';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const updatedDate = formatRelativeTime(new Date(row.lastUpdatedDateTime), {
    short: true,
  });
  const createdDate = formatExactDate(new Date(row.createdDateTime), {
    includeYear: true,
  });

  return (
    <div>
      <Badge
        variant={getActivityStatusBadgeVariant(row.activityStatus)}
        className="capitalize"
      >
        {row.activityStatus}
      </Badge>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <span>Updated {updatedDate}</span>
        <Avatar size="sm" title={userName}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
      <div className="mt-1 text-xs text-slate-500">Created {createdDate}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main table component
// ---------------------------------------------------------------------------

export function ActivityTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['overview'],
  });
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
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

  const activityFilters = useMemo(
    () => ({
      excludeCompleted: !showCompleted,
      includeDeleted: showDeleted && canSeeDeleted,
    }),
    [showCompleted, showDeleted, canSeeDeleted]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitiesData, usersData] = await Promise.all([
          fetchActivities(activityFilters),
          fetchUsers(),
        ]);
        setActivities(activitiesData);
        setUsers(usersData);
        setError(null);
      } catch (err) {
        logger.error('Error loading data:', err);
        setError('Failed to load activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [activityFilters]);

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; jobTitle?: string | null }>();
    users.forEach((u) => {
      const displayName = u.name || u.email || String(u.id);
      map.set(String(u.id), {
        name: displayName,
        jobTitle: u.jobTitle ?? null,
      });
    });
    return map;
  }, [users]);

  const data = useMemo(
    () => activities.map(mapActivityResponseToTableRow),
    [activities]
  );

  const columnHelper = createColumnHelper<ActivityTableRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'overview',
        header: 'Overview',
        size: ACTIVITY_TABLE_COLUMN_WIDTHS.overview.size,
        minSize: ACTIVITY_TABLE_COLUMN_WIDTHS.overview.minSize,
        maxSize: ACTIVITY_TABLE_COLUMN_WIDTHS.overview.maxSize,
        cell: ({ row }) => <OverviewCell row={row.original} />,
      }),

      columnHelper.accessor('summary', {
        header: 'Summary',
        size: ACTIVITY_TABLE_COLUMN_WIDTHS.summary.size,
        minSize: ACTIVITY_TABLE_COLUMN_WIDTHS.summary.minSize,
        maxSize: ACTIVITY_TABLE_COLUMN_WIDTHS.summary.maxSize,
        cell: ({ row }) => <SummaryCell row={row.original} />,
      }),

      columnHelper.accessor('startDate', {
        header: 'Scheduling',
        size: ACTIVITY_TABLE_COLUMN_WIDTHS.scheduling.size,
        minSize: ACTIVITY_TABLE_COLUMN_WIDTHS.scheduling.minSize,
        maxSize: ACTIVITY_TABLE_COLUMN_WIDTHS.scheduling.maxSize,
        cell: ({ row }) => <SchedulingCell row={row.original} />,
      }),

      columnHelper.display({
        id: 'leads',
        header: 'Leads',
        size: ACTIVITY_TABLE_COLUMN_WIDTHS.leads.size,
        minSize: ACTIVITY_TABLE_COLUMN_WIDTHS.leads.minSize,
        maxSize: ACTIVITY_TABLE_COLUMN_WIDTHS.leads.maxSize,
        cell: ({ row }) => <LeadsCell row={row.original} />,
      }),

      columnHelper.display({
        id: 'materials',
        header: 'Materials',
        size: ACTIVITY_TABLE_COLUMN_WIDTHS.materials.size,
        minSize: ACTIVITY_TABLE_COLUMN_WIDTHS.materials.minSize,
        maxSize: ACTIVITY_TABLE_COLUMN_WIDTHS.materials.maxSize,
        cell: ({ row }) => <MaterialsCell row={row.original} />,
      }),

      columnHelper.accessor('activityStatus', {
        header: 'Status',
        size: ACTIVITY_TABLE_COLUMN_WIDTHS.status.size,
        minSize: ACTIVITY_TABLE_COLUMN_WIDTHS.status.minSize,
        maxSize: ACTIVITY_TABLE_COLUMN_WIDTHS.status.maxSize,
        cell: ({ row }) => <StatusCell row={row.original} userMap={userMap} />,
      }),
    ],
    [columnHelper, userMap]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, columnPinning },
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
    meta: { userMap },
  });

  const eventTableFilters = useMemo(() => {
    const filters = [
      {
        id: 'show-completed',
        label: 'Show completed',
        checked: showCompleted,
        onCheckedChange: setShowCompleted,
      },
    ];
    if (canSeeDeleted) {
      filters.push({
        id: 'show-deleted',
        label: 'Show deleted',
        checked: showDeleted,
        onCheckedChange: setShowDeleted,
      });
    }
    return filters;
  }, [showCompleted, showDeleted, canSeeDeleted]);

  // Loading state
  if (loading) {
    return (
      <div className="min-w-0 space-y-4">
        <TableSummaryBar
          count={0}
          singularLabel="entry"
          pluralLabel="entries"
          filters={eventTableFilters}
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

  // Error state
  if (error) {
    return (
      <div className="p-10">
        <ErrorState
          title="Failed to load activities"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            fetchActivities(activityFilters)
              .then((activitiesData) => {
                setActivities(activitiesData);
                return fetchUsers();
              })
              .then((usersData) => setUsers(usersData))
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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="min-w-0 space-y-4">
        <TableSummaryBar
          count={0}
          singularLabel="entry"
          pluralLabel="entries"
          filters={eventTableFilters}
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
        filters={eventTableFilters}
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
                        minWidth:
                          header.column.columnDef.minSize ?? header.getSize(),
                        maxWidth:
                          header.column.columnDef.maxSize ?? header.getSize(),
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
              <tr
                key={row.id}
                className={`group/row ${tableBodyRow} cursor-pointer`}
                tabIndex={0}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-no-row-nav]'))
                    return;
                  if (window.getSelection()?.toString().trim()) return;
                  void navigate(`/activity/${row.original.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  if ((e.target as HTMLElement).closest('[data-no-row-nav]'))
                    return;
                  e.preventDefault();
                  void navigate(`/activity/${row.original.id}`);
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  const pinStyles = getCommonPinningStyles(cell.column);
                  const isOverview = cell.column.id === 'overview';
                  return (
                    <td
                      key={cell.id}
                      className={`${tableTd} border-b border-slate-100 ${
                        isOverview
                          ? 'bg-white/95 group-hover/row:bg-slate-50/50 supports-backdrop-filter:bg-white/80'
                          : ''
                      }`}
                      style={{
                        width: cell.column.getSize(),
                        minWidth:
                          cell.column.columnDef.minSize ??
                          cell.column.getSize(),
                        maxWidth:
                          cell.column.columnDef.maxSize ??
                          cell.column.getSize(),
                        ...pinStyles,
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

      <TablePagination
        totalItems={table.getFilteredRowModel().rows.length}
        page={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        onPageChange={(page) =>
          setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
        }
        onPageSizeChange={(pageSize) =>
          setPagination((prev) => ({ ...prev, pageSize, pageIndex: 0 }))
        }
        scrollContainerRef={tableScrollRef}
      />
    </div>
  );
}
