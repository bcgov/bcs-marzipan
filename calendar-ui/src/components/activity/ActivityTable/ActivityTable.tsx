import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { DEFAULT_ACTIVITY_FILTER_STATE, PERMISSIONS } from '@corpcal/shared';
import { canViewActivityFieldScope, SYSTEM_ROLES } from '@corpcal/shared/auth';
import { ActivityFlagPopover } from '@/components/activity/activities/ActivityFlagPopover';
import { ErrorState } from '@/components/shared';
import {
  COLUMN_SORT_DROPDOWN_DATA_ATTR,
  ColumnSortDropdown,
} from '@/components/table/ColumnSortDropdown';
import { SortableColumnHeader } from '@/components/table/SortableColumnHeader';
import type {
  SortColumnConfig,
  SortLevel,
} from '@/components/table/SortDropdown';
import { SortIndicator } from '@/components/table/SortIndicator';
import {
  getActivityColumnSizes,
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import { TablePagination } from '@/components/table/TablePagination';
import { ActivityRichTextContent } from '@/components/ui/activity-rich-text-content';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { BadgeGroup, type BadgeGroupItem } from '@/components/ui/badge-group';
import { CopyableText } from '@/components/ui/copyable-text';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getLookAheadStatusLabel } from '@/constants/form-options';
import { useActivityTablePreferences } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityList,
  useRemoveActivityFlag,
  useUpsertActivityFlag,
} from '@/hooks/useCalendar';
import {
  useLiveActivityRowHighlights,
  useLiveActivitySyncContext,
} from '@/hooks/useLiveActivitySyncContext';
import {
  getLookAheadSectionLabelFromRows,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import {
  useActivityStatuses,
  useCategories,
  useEventPlanners,
  useMinistries,
  useOrganizations,
  usePitchRequiredStatuses,
  useTags,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
} from '@/hooks/useLookups';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import {
  buildActivityFilterSummaryLinesForDetailPopover,
  getAppliedActivityFilterTypeLabels,
  type ActivityFilterSummaryContext,
} from '@/lib/activity-filter-summary';
import { activityFormLinkState } from '@/lib/activity-form-navigation-state';
import {
  filterActivityRowsByFilters,
  filterActivityRowsByKeyword,
  type ActivityListQueryParams,
  type FilterActivityRowsContext,
} from '@/lib/activity-query-utils';
import { hasAnyKnownParam } from '@/lib/activityTablePreferencesParams';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatDateRange,
  formatExactDate,
  formatRelativeTime,
  formatTime12h,
  parseDateOnlyString,
} from '@/lib/datetime-utils';
import { getFriendlyErrorMessage } from '@/lib/error-toast';
import { getSavedFilterAutoApplyDecision } from '@/lib/savedFilterAutoApplyDecision';
import {
  sanitizeSavedFilterPayload,
  type ValidFilterLookups,
} from '@/lib/savedFilterSanitize';
import { cn } from '@/lib/utils';
import type { OptionItem } from '@/schemas/types';

import { ActivityTableEmptyState } from './ActivityTableEmptyState';
import {
  ActivityTableFilters,
  hasAnyActivityTableFilterActive,
} from './ActivityTableFilters';
import { ActivityTableLayout } from './ActivityTableLayout';
import {
  mapActivityResponseToTableRow,
  type ActivityTableRow,
} from './activityTableRow';
import { compareActivityRowsByLevels } from './activityTableSort';

/**
 * Table width: The table uses table-fixed layout; its width is the sum of column
 * sizes. To increase max width, adjust ACTIVITY_TABLE_COLUMN_WIDTHS in tableConstants.ts
 * (size, minSize, maxSize per column). min-w-[640px] on the
 * table enforces a minimum width and more horizontal scroll when the container is narrow.
 * The page is wrapped by Layout > PageContainer (max-w-[104rem], px-12), so content width
 * is also capped there; any table width beyond that scrolls inside TableScrollContainer.
 */

const DEFAULT_SORT_KEY = 'startDate';
const DEFAULT_SORT_DIRECTION = 'desc' as const;

const ACTIVITY_SORT_COLUMNS: SortColumnConfig[] = [
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
    label: 'Scheduled Date',
    defaultDirection: 'asc',
    tieBreakers: [{ key: 'startTime', direction: 'asc' }],
  },
  { id: 'lastUpdated', label: 'Last Updated', defaultDirection: 'desc' },
  { id: 'createdDateTime', label: 'Date Created', defaultDirection: 'desc' },
];

/** Status column can be sorted by activity status, last updated, or date created. */
const STATUS_COLUMN_SORT_KEYS = [
  'activityStatus',
  'lastUpdated',
  'createdDateTime',
] as const;

function getCommonPinningStyles<T>(column: Column<T, unknown>): CSSProperties {
  const isPinned = column.getIsPinned();

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.99 : 1,
    backdropFilter: isPinned ? 'blur(8px)' : undefined,
    WebkitBackdropFilter: isPinned ? 'blur(8px)' : undefined,
    position: isPinned ? 'sticky' : 'relative',
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

/**
 * List Overview: only pitch **status** is gated by `activities.pitchStatus.view`.
 */
function OverviewCell({
  row,
  canViewPitchStatus,
  canFlag,
  onFlagAssign,
  onFlagUnassign,
  flagPending,
}: {
  row: ActivityTableRow;
  canViewPitchStatus: boolean;
  canFlag?: boolean;
  onFlagAssign?: (
    teamId: number,
    assigneeId: number,
    assigneeName?: string
  ) => void;
  onFlagUnassign?: (teamId: number, assigneeName?: string) => void;
  flagPending?: boolean;
}) {
  const pitchLabel =
    (canViewPitchStatus ? row.pitchRequiredStatus : null) ??
    row.pitchDate ??
    null;
  const displayIdText = row.displayId ?? String(row.id);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs font-semibold text-slate-900">
        {(canFlag || row.flags.length > 0) &&
          onFlagAssign &&
          onFlagUnassign && (
            <ActivityFlagPopover
              activityId={row.id}
              flags={row.flags}
              readOnly={!canFlag}
              onAssign={onFlagAssign}
              onUnassign={onFlagUnassign}
              isPending={flagPending}
            />
          )}
        <span
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
        >
          <CopyableText
            text={displayIdText}
            copyLabel="Copy activity ID"
            variant="minimal"
            copiedTooltipContent="Activity ID copied"
          >
            {displayIdText}
          </CopyableText>
        </span>
        {row.isConfidential && (
          <span className="text-corpcal-text-alert font-bold uppercase">
            CONFIDENTIAL
          </span>
        )}
        {row.isIssue && (
          <span className="text-corpcal-text-alert font-bold uppercase">
            ISSUE
          </span>
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
      {row.activityCategories.length > 0 && (
        <BadgeGroup
          items={row.activityCategories.map(
            (cat): BadgeGroupItem => ({
              key: cat,
              label: cat,
              variant: 'primary',
              className: 'h-auto min-h-5 whitespace-normal text-white',
            })
          )}
          maxLines={1}
          lineHeight={28}
          badgeVariant="primary"
          badgeClassName="h-auto min-h-5 whitespace-normal text-white"
          containerClassName="gap-1"
        />
      )}
    </div>
  );
}

function SummaryCell({ row }: { row: ActivityTableRow }) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const showMoreLessRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = 20;
      const maxLines = 5;
      setNeedsTruncation(
        contentRef.current.scrollHeight > lineHeight * maxLines
      );
    }
  }, [row.summary]);

  useEffect(() => {
    if (expanded && needsTruncation) {
      showMoreLessRef.current?.focus();
    }
  }, [expanded, needsTruncation]);

  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const status = row.lookAheadStatus;
  const section = row.lookAheadSection;
  const lookAheadLabel =
    status && status !== 'none'
      ? section
        ? `LA ${getLookAheadStatusLabel(status)}: ${getLookAheadSectionLabelFromRows(lookAheadSectionRows, section)}`
        : `LA ${getLookAheadStatusLabel(status)}`
      : null;

  const summaryBadgeGroupItems = useMemo((): BadgeGroupItem[] => {
    const lookAheadItem: BadgeGroupItem | null = lookAheadLabel
      ? {
          key: 'look-ahead',
          label: lookAheadLabel,
          variant: 'primary',
          className: 'h-auto min-h-5 text-xs text-white',
        }
      : null;
    const tagItems: BadgeGroupItem[] = row.tags.map((tag) => ({
      key: tag.id,
      label: tag.text,
      variant: 'outline',
      className: 'h-auto min-h-5 text-xs whitespace-normal text-slate-600',
    }));
    return lookAheadItem ? [lookAheadItem, ...tagItems] : tagItems;
  }, [lookAheadLabel, row.tags]);

  const isCollapsedWithTruncation = needsTruncation && !expanded;

  const showMoreLessButton = (
    <button
      ref={showMoreLessRef}
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
          <ActivityRichTextContent value={row.summary} stopLinkPropagation />
        </div>

        {needsTruncation &&
          (isCollapsedWithTruncation ? (
            <span className="absolute right-0 bottom-0 w-28 group-hover/row:bg-[linear-gradient(to_right,transparent_0%,rgb(248_250_252/0.5)_35%,rgb(248_250_252/0.5)_100%)]">
              <span className="flex justify-end bg-[linear-gradient(to_right,transparent_0%,white_35%,white_100%)] whitespace-nowrap [&>button]:inline">
                {showMoreLessButton}
              </span>
            </span>
          ) : (
            <div className="mt-1 flex justify-end">{showMoreLessButton}</div>
          ))}
      </div>

      {summaryBadgeGroupItems.length > 0 && (
        <div className="mt-2">
          <BadgeGroup
            items={summaryBadgeGroupItems}
            maxLines={2}
            lineHeight={28}
            badgeVariant="outline"
            badgeClassName="h-auto min-h-5 text-xs whitespace-normal text-slate-600"
            containerClassName="gap-1"
            overflowBadgeVariant="outline"
            overflowBadgeClassName="text-slate-600"
          />
        </div>
      )}
    </div>
  );
}

function SchedulingCell({ row }: { row: ActivityTableRow }) {
  const representativeBadgeItems = useMemo(
    () =>
      row.activityRepresentatives.map(
        (name): BadgeGroupItem => ({
          key: name,
          label: formatRepresentativeBadgeText(name),
        })
      ),
    [row.activityRepresentatives]
  );
  const badgeGroupItems = useMemo((): BadgeGroupItem[] => {
    const premier =
      row.premierRequested && row.premierRequested.toLowerCase() !== 'no';
    if (premier) {
      return [
        {
          key: 'premier',
          label: `Premier: ${row.premierRequested}`,
          variant: 'primary' as const,
          className: 'h-auto min-h-5 text-xs text-white',
        },
        ...representativeBadgeItems,
      ];
    }
    return representativeBadgeItems;
  }, [row.premierRequested, representativeBadgeItems]);
  const dateRangeText =
    row.startDate && row.endDate && row.endDate !== row.startDate
      ? formatDateRange(row.startDate, row.endDate)
      : row.startDate
        ? formatExactDate(parseDateOnlyString(row.startDate), {
            includeYear: 'auto',
          })
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

      {badgeGroupItems.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <div className="flex items-start gap-1.5">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <BadgeGroup
              items={badgeGroupItems}
              maxLines={2}
              lineHeight={28}
              badgeVariant="outline"
              badgeClassName="h-auto min-h-5 text-xs text-slate-600"
              containerClassName="min-w-0 flex-1 gap-1.5"
            />
          </div>
        </div>
      )}
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
  if (row.eventPlanners?.length)
    lines.push({
      label: 'Event planners',
      value: row.eventPlanners.join(', '),
    });

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

  const statusDisplay = status ? toSentenceCase(status) : '';
  const statusLower = status?.toLowerCase();
  const isPendingReview = statusLower === 'pending review';
  const isRequired = statusLower === 'required';
  const isNotRequired = statusLower === 'not required';

  let translationLine1: string | null = null;
  let translationLine2: string | null = null;

  if (isPendingReview) {
    translationLine1 = statusDisplay || null;
    if (hasLanguages) {
      translationLine2 = languages.map((s) => s.toUpperCase()).join(', ');
    }
  } else if (isRequired) {
    if (hasLanguages) {
      translationLine1 = languages.map((s) => s.toUpperCase()).join(', ');
    } else {
      translationLine1 = statusDisplay || null;
    }
  } else if (isNotRequired) {
    translationLine1 = statusDisplay || null;
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
          <span>{row.commsMaterials.join(', ')}</span>
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
    timeZone: CORP_PACIFIC_TIME_ZONE,
  });

  return (
    <div>
      <Badge variant={getActivityStatusBadgeVariant(row.activityStatus)}>
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

/** Active saved-filter preset shown in the summary bar and Saved filters menu. */
export type ActivityTableActiveSavedFilter = {
  id: number;
  name: string;
};

export interface ActivityTableProps {
  /** When set, only activities with this lead team are shown (e.g. ministry tab). */
  leadTeamId?: number;
  /** When set, only activities where this user is comms contact lead are shown. */
  commsContactLeadUserId?: number;
  /** When set, only activities shared with this team are shown. */
  sharedWithTeamId?: number;
  /** When set, only activities shared with any of these teams are shown. */
  sharedWithTeamIds?: number[];
  /** When set, only activities whose IDs are in this list are shown (favourites tab). */
  favouriteActivityIds?: number[];
  /** When set, only activities flag-assigned to this user are shown. */
  flagAssigneeUserId?: number;
  /**
   * When used with `onActiveSavedFilterChange`, the parent owns which saved filter
   * is considered applied (e.g. single ActivityTable across activity list tabs).
   */
  activeSavedFilter?: ActivityTableActiveSavedFilter | null;
  onActiveSavedFilterChange?: (
    value: ActivityTableActiveSavedFilter | null
  ) => void;
}

export function ActivityTable({
  leadTeamId,
  commsContactLeadUserId,
  sharedWithTeamId,
  sharedWithTeamIds,
  favouriteActivityIds,
  flagAssigneeUserId,
  activeSavedFilter: activeSavedFilterFromParent,
  onActiveSavedFilterChange,
}: ActivityTableProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const pitchFieldVisibility = useMemo(() => {
    if (!user) {
      return { canViewPitchStatus: false, canViewPitchDate: false };
    }
    const ctx = { permissions: user.permissions, roleName: user.roleName };
    return {
      canViewPitchStatus: canViewActivityFieldScope(ctx, 'pitchStatus'),
      canViewPitchDate: canViewActivityFieldScope(ctx, 'pitchDate'),
    };
  }, [user]);
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const { preferences, setPreferences } =
    useActivityTablePreferences(canSeeDeleted);
  const savedFiltersHook = useSavedFilters();
  const [currentSearchParams] = useSearchParams();
  const defaultAppliedRef = useRef(false);
  const defaultSuppressedByClearRef = useRef(false);
  const [internalActiveSavedFilter, setInternalActiveSavedFilter] =
    useState<ActivityTableActiveSavedFilter | null>(null);

  const savedFilterSelectionControlled = onActiveSavedFilterChange != null;
  const activeSavedFilter = savedFilterSelectionControlled
    ? (activeSavedFilterFromParent ?? null)
    : internalActiveSavedFilter;

  const setActiveSavedFilter = useCallback(
    (value: ActivityTableActiveSavedFilter | null) => {
      if (savedFilterSelectionControlled) {
        onActiveSavedFilterChange?.(value);
      } else {
        setInternalActiveSavedFilter(value);
      }
    },
    [savedFilterSelectionControlled, onActiveSavedFilterChange]
  );

  useEffect(() => {
    if (activeSavedFilter == null) return;
    const stillThere = savedFiltersHook.savedFilters.some(
      (f) => f.id === activeSavedFilter.id
    );
    if (!stillThere) setActiveSavedFilter(null);
  }, [activeSavedFilter, savedFiltersHook.savedFilters, setActiveSavedFilter]);

  const sortKey = preferences.sortKey;
  const sortDirection = preferences.sortDirection;
  const showCompleted = preferences.showCompleted;
  const showDeleted = preferences.showDeleted;
  const searchKeyword = preferences.searchKeyword;
  const filterState = preferences.filterState;
  const [pageIndex, setPageIndex] = useState(0);

  const { data: categoriesForFilter = [] } = useCategories();
  const { data: activityStatusesForFilter = [] } = useActivityStatuses();
  const { data: pitchRequiredStatusesForFilter = [] } =
    usePitchRequiredStatuses();
  const { data: tagsForFilter = [] } = useTags();
  const { data: ministriesForFilter = [] } = useMinistries();
  const { data: organizationsForFilter = [] } = useOrganizations();
  const { data: usersForFilter = [] } = useUsers();
  const { data: eventPlannersForFilter = [] } = useEventPlanners();
  const { data: translationLanguagesForFilter = [] } =
    useTranslationLanguages();
  const { data: translationRequiredStatusesForFilter = [] } =
    useTranslationRequiredStatuses();
  const categoryOptions = useMemo(
    () =>
      categoriesForFilter
        .filter((c) => c.isActive)
        .map((c) => ({ value: c.displayName, label: c.displayName })),
    [categoriesForFilter]
  );
  const statusArchiveIds = useMemo(() => {
    const completed = activityStatusesForFilter.find(
      (s) => s.name === 'completed'
    );
    const deleted = activityStatusesForFilter.find((s) => s.name === 'deleted');
    return {
      completedStatusId: completed?.id,
      deletedStatusId: deleted?.id,
    };
  }, [activityStatusesForFilter]);

  const statusOptions = useMemo(
    () =>
      activityStatusesForFilter
        .filter((s) => canSeeDeleted || s.name !== 'deleted')
        .map((s) => ({
          value: String(s.id),
          label: s.displayName,
        })),
    [activityStatusesForFilter, canSeeDeleted]
  );

  const pitchRequiredStatusOptions = useMemo(
    () =>
      pitchRequiredStatusesForFilter.map((s) => ({
        value: s.displayName,
        label: s.displayName,
      })),
    [pitchRequiredStatusesForFilter]
  );

  const tagOptions = useMemo(
    () =>
      tagsForFilter.map((t) => ({
        value: String(t.id),
        label: t.displayName ?? t.label ?? String(t.id),
      })),
    [tagsForFilter]
  );

  const ministryOptions = useMemo(
    () =>
      ministriesForFilter.map((m) => ({
        value: String(m.id),
        label: m.displayName ?? m.name ?? m.label ?? String(m.id),
      })),
    [ministriesForFilter]
  );
  const organizationOptions = useMemo(
    () =>
      organizationsForFilter.map((o) => ({
        value: String(o.id),
        label: o.displayName ?? o.name ?? o.label ?? String(o.id),
      })),
    [organizationsForFilter]
  );
  const commsContactOptions = useMemo(
    () =>
      usersForFilter.map((u) => ({
        value: String(u.id),
        label: u.name ?? u.email ?? String(u.id),
      })),
    [usersForFilter]
  );
  const eventPlannerOptions = useMemo(
    () =>
      eventPlannersForFilter.map((ep) => ({
        value: String(ep.id),
        label: ep.label ?? String(ep.id),
      })),
    [eventPlannersForFilter]
  );
  const translationOptions = useMemo(
    () =>
      translationLanguagesForFilter.map((l) => {
        const displayLabel = l.shortcode
          ? `${l.displayName} (${l.shortcode.toUpperCase()})`
          : (l.displayName ?? String(l.id));
        return { value: String(l.id), label: displayLabel };
      }),
    [translationLanguagesForFilter]
  );
  const translationLanguageOptionsForFilter = useMemo(
    () =>
      translationLanguagesForFilter.map((l) => ({
        value: String(l.id),
        label: l.shortcode ?? l.displayName ?? String(l.id),
      })),
    [translationLanguagesForFilter]
  );
  const translationStatusOptions = useMemo(
    () =>
      translationRequiredStatusesForFilter.map((s) => ({
        value: String(s.id),
        label: s.displayName ?? s.name ?? String(s.id),
      })),
    [translationRequiredStatusesForFilter]
  );
  const translationRequiredStatusOptionsForFilter = useMemo(
    () =>
      translationRequiredStatusesForFilter.map((s) => ({
        value: String(s.id),
        label: s.displayName ?? s.name ?? String(s.id),
      })),
    [translationRequiredStatusesForFilter]
  );

  const validFilterLookupsForDefaultApply = useMemo((): ValidFilterLookups => {
    const nums = (options: OptionItem[]) =>
      new Set(
        options
          .map((o) => parseInt(o.value, 10))
          .filter((n) => Number.isFinite(n))
      );
    return {
      statusIds: nums(statusOptions),
      tagIds: nums(tagOptions),
      ministryIds: nums(ministryOptions),
      orgIds: nums(organizationOptions),
      commsContactUserIds: nums(commsContactOptions),
      eventPlannerIds: nums(eventPlannerOptions),
      translationStatusIds: nums(translationStatusOptions),
      translationLanguageIds: nums(translationOptions),
    };
  }, [
    statusOptions,
    tagOptions,
    ministryOptions,
    organizationOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationStatusOptions,
    translationOptions,
  ]);

  const savedFilterDefaultLookupsReady =
    activityStatusesForFilter.length > 0 && !savedFiltersHook.isLoading;

  useEffect(() => {
    const decision = getSavedFilterAutoApplyDecision({
      lookupsReady: savedFilterDefaultLookupsReady,
      defaultAlreadyApplied: defaultAppliedRef.current,
      suppressedByClear: defaultSuppressedByClearRef.current,
      hasKnownUrlParams: hasAnyKnownParam(currentSearchParams),
      hasRestoredActivePreferences:
        hasAnyActivityTableFilterActive(filterState, pitchFieldVisibility) ||
        searchKeyword.trim().length > 0,
      hasDefaultFilter: savedFiltersHook.defaultFilter != null,
    });

    if (decision.shouldMarkContextApplied) {
      defaultAppliedRef.current = true;
    }

    if (decision.shouldClearActiveSavedFilter) {
      setActiveSavedFilter(null);
    }

    if (!decision.shouldApplyDefault) {
      return;
    }

    const defaultFilter = savedFiltersHook.defaultFilter;
    if (!defaultFilter) {
      return;
    }
    const {
      filterState: sanitized,
      searchKeyword: kw,
      hadInvalidValues,
    } = sanitizeSavedFilterPayload(
      defaultFilter,
      validFilterLookupsForDefaultApply
    );
    setPreferences({ filterState: sanitized, searchKeyword: kw });
    setActiveSavedFilter({
      id: defaultFilter.id,
      name: defaultFilter.name,
    });
    if (hadInvalidValues) {
      toast.warning(
        'Some filter values are no longer available and were skipped.'
      );
    }
  }, [
    savedFiltersHook.defaultFilter,
    savedFiltersHook.isLoading,
    currentSearchParams,
    filterState,
    searchKeyword,
    setPreferences,
    setActiveSavedFilter,
    validFilterLookupsForDefaultApply,
    savedFilterDefaultLookupsReady,
    pitchFieldVisibility,
  ]);

  const hasStatusFilter = filterState.activityStatusIds.length > 0;
  const statusFilterIncludesCompleted =
    statusArchiveIds.completedStatusId != null &&
    filterState.activityStatusIds.includes(statusArchiveIds.completedStatusId);
  const statusFilterIncludesDeleted =
    statusArchiveIds.deletedStatusId != null &&
    filterState.activityStatusIds.includes(statusArchiveIds.deletedStatusId);
  const effectiveShowCompleted = hasStatusFilter
    ? statusFilterIncludesCompleted
    : showCompleted;
  const effectiveShowDeleted = hasStatusFilter
    ? statusFilterIncludesDeleted && canSeeDeleted
    : showDeleted && canSeeDeleted;

  const pagination = useMemo(
    () => ({ pageIndex, pageSize: preferences.pageSize }),
    [pageIndex, preferences.pageSize]
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['overview'],
  });

  const activityFilters = useMemo((): ActivityListQueryParams => {
    return {
      includeCompleted: effectiveShowCompleted,
      includeDeleted: effectiveShowDeleted,
      ...(leadTeamId !== undefined && { leadTeamId }),
      ...(commsContactLeadUserId !== undefined && {
        commsContactLeadUserId,
      }),
      ...(sharedWithTeamId !== undefined && { sharedWithTeamId }),
      ...(sharedWithTeamIds !== undefined &&
        sharedWithTeamIds.length > 0 && { sharedWithTeamIds }),
      ...(flagAssigneeUserId !== undefined && { flagAssigneeUserId }),
    };
  }, [
    effectiveShowCompleted,
    effectiveShowDeleted,
    leadTeamId,
    commsContactLeadUserId,
    sharedWithTeamId,
    sharedWithTeamIds,
    flagAssigneeUserId,
  ]);

  // Reset to first page when user changes filters so results match expectations
  const prevFiltersRef = useRef(activityFilters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const sameSharedWithTeamIds =
      (prev.sharedWithTeamIds == null &&
        activityFilters.sharedWithTeamIds == null) ||
      (prev.sharedWithTeamIds != null &&
        activityFilters.sharedWithTeamIds != null &&
        prev.sharedWithTeamIds.length ===
          activityFilters.sharedWithTeamIds.length &&
        prev.sharedWithTeamIds.every(
          (id, i) => id === activityFilters.sharedWithTeamIds![i]
        ));
    const same =
      prev.includeCompleted === activityFilters.includeCompleted &&
      prev.includeDeleted === activityFilters.includeDeleted &&
      prev.leadTeamId === activityFilters.leadTeamId &&
      prev.commsContactLeadUserId === activityFilters.commsContactLeadUserId &&
      prev.sharedWithTeamId === activityFilters.sharedWithTeamId &&
      prev.flagAssigneeUserId === activityFilters.flagAssigneeUserId &&
      sameSharedWithTeamIds;
    if (!same) {
      prevFiltersRef.current = activityFilters;
      setPageIndex(0);
    }
  }, [activityFilters]);

  // Reset to first page when search keyword or filter state changes
  const prevSearchKeywordRef = useRef(searchKeyword);
  const prevFilterStateRef = useRef(filterState);
  useEffect(() => {
    if (prevSearchKeywordRef.current !== searchKeyword) {
      prevSearchKeywordRef.current = searchKeyword;
      setPageIndex(0);
    }
  }, [searchKeyword]);
  useEffect(() => {
    if (
      JSON.stringify(prevFilterStateRef.current) !== JSON.stringify(filterState)
    ) {
      prevFilterStateRef.current = filterState;
      setPageIndex(0);
    }
  }, [filterState]);

  const { isSocketConnected } = useLiveActivitySyncContext();

  const activitiesQuery = useActivityList(activityFilters, {
    suppressPollingWhileLive: isSocketConnected,
  });

  const tableRemoteHighlightIds = useLiveActivityRowHighlights(
    activitiesQuery.isFetching
  );

  const usersQuery = useUsers();
  const loading = activitiesQuery.isPending && !activitiesQuery.data;
  const error = activitiesQuery.isError ? activitiesQuery.error : null;

  const canFlag = hasPermission(PERMISSIONS.ACTIVITIES.FLAG);
  const upsertFlagMutation = useUpsertActivityFlag();
  const removeFlagMutation = useRemoveActivityFlag();

  const onPaginationChangeStable = useCallback(
    (
      updaterOrValue:
        | ((prev: typeof pagination) => typeof pagination)
        | typeof pagination
    ) => {
      const prev = pagination;
      const next =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(prev)
          : updaterOrValue;
      if (next.pageSize !== prev.pageSize) {
        setPreferences({ pageSize: next.pageSize });
        setPageIndex(0);
      } else {
        setPageIndex(next.pageIndex);
      }
    },
    [pagination, setPreferences]
  );
  const setPagination = onPaginationChangeStable;

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; jobTitle?: string | null }>();
    const users = usersQuery.data ?? [];
    users.forEach((u) => {
      const displayName = u.name || u.email || String(u.id);
      map.set(String(u.id), {
        name: displayName,
        jobTitle: u.jobTitle ?? null,
      });
    });
    return map;
  }, [usersQuery.data]);

  const data = useMemo(
    () => (activitiesQuery.data ?? []).map(mapActivityResponseToTableRow),
    [activitiesQuery.data]
  );

  const filterContext = useMemo((): FilterActivityRowsContext | undefined => {
    const hasTranslationStatus =
      translationRequiredStatusOptionsForFilter.length > 0;
    const hasTranslationLanguages =
      translationLanguageOptionsForFilter.length > 0;
    if (!hasTranslationStatus && !hasTranslationLanguages) return undefined;
    return {
      ...(hasTranslationStatus && {
        translationRequiredStatusOptions:
          translationRequiredStatusOptionsForFilter,
      }),
      ...(hasTranslationLanguages && {
        translationLanguageOptions: translationLanguageOptionsForFilter,
      }),
    };
  }, [
    translationRequiredStatusOptionsForFilter,
    translationLanguageOptionsForFilter,
  ]);

  const filteredData = useMemo(() => {
    const afterKeyword = filterActivityRowsByKeyword(data, searchKeyword);
    const afterFilters = filterActivityRowsByFilters(
      afterKeyword,
      filterState,
      filterContext
    );
    if (favouriteActivityIds !== undefined) {
      const favouriteSet = new Set(favouriteActivityIds);
      return afterFilters.filter((row) => favouriteSet.has(row.id));
    }
    return afterFilters;
  }, [data, searchKeyword, filterState, filterContext, favouriteActivityIds]);

  const effectiveSortKey = sortKey ?? DEFAULT_SORT_KEY;
  const effectiveSortDirection =
    sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION;
  const sortedData = useMemo(() => {
    const activeColumn = ACTIVITY_SORT_COLUMNS.find(
      (c) => c.id === effectiveSortKey
    );
    const sortLevels: SortLevel[] = [
      { key: effectiveSortKey, direction: effectiveSortDirection },
      ...(activeColumn?.tieBreakers ?? []),
    ];
    return [...filteredData].sort((a, b) =>
      compareActivityRowsByLevels(a, b, sortLevels)
    );
  }, [filteredData, effectiveSortKey, effectiveSortDirection]);

  // Track which row ids we have seen so we can animate only newly arrived rows on refetch
  const seenIdsRef = useRef<Set<number>>(new Set());
  const [newRowIds, setNewRowIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const currentIds = data.map((r) => r.id);
    const currentSet = new Set(currentIds);
    const newlyAdded = currentIds.filter((id) => !seenIdsRef.current.has(id));
    seenIdsRef.current = currentSet;
    if (newlyAdded.length > 0) {
      setNewRowIds((prev) => new Set([...prev, ...newlyAdded]));
      const timeout = window.setTimeout(() => {
        setNewRowIds((prev) => {
          const next = new Set(prev);
          newlyAdded.forEach((id) => next.delete(id));
          return next;
        });
      }, 400);
      return () => window.clearTimeout(timeout);
    }
  }, [data]);

  const handleSortChange = useCallback(
    (key: string | null, direction: 'asc' | 'desc') => {
      setPreferences({
        sortKey: key ?? DEFAULT_SORT_KEY,
        sortDirection: direction,
      });
    },
    [setPreferences]
  );

  const handleHeaderSort = useCallback(
    (columnSortKeyOrKeys: string | string[]) => {
      const keys = Array.isArray(columnSortKeyOrKeys)
        ? columnSortKeyOrKeys
        : [columnSortKeyOrKeys];
      const isActive = keys.includes(effectiveSortKey);
      if (isActive) {
        handleSortChange(
          effectiveSortKey,
          effectiveSortDirection === 'asc' ? 'desc' : 'asc'
        );
      } else {
        const primaryKey = keys[0];
        const col = ACTIVITY_SORT_COLUMNS.find((c) => c.id === primaryKey);
        handleSortChange(primaryKey, col?.defaultDirection ?? 'asc');
      }
    },
    [effectiveSortKey, effectiveSortDirection, handleSortChange]
  );

  const columnHelper = createColumnHelper<ActivityTableRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'overview',
        header: () => (
          <SortableColumnHeader
            title="Overview"
            sortColumnId="activityId"
            sortColumns={ACTIVITY_SORT_COLUMNS}
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
          />
        ),
        meta: { sortKey: 'activityId' as const },
        ...getActivityColumnSizes('overview'),
        cell: ({ row }) => (
          <OverviewCell
            row={row.original}
            canViewPitchStatus={pitchFieldVisibility.canViewPitchStatus}
            canFlag={canFlag}
            onFlagAssign={(teamId, assigneeId, assigneeName) =>
              upsertFlagMutation.mutate({
                activityId: row.original.id,
                body: { teamId, assigneeId },
                assigneeName,
              })
            }
            onFlagUnassign={(teamId, assigneeName) =>
              removeFlagMutation.mutate({
                activityId: row.original.id,
                teamId,
                assigneeName,
              })
            }
            flagPending={
              upsertFlagMutation.isPending || removeFlagMutation.isPending
            }
          />
        ),
      }),

      columnHelper.accessor('summary', {
        header: () => (
          <SortableColumnHeader
            title="Summary"
            sortColumnId="lookAheadStatus"
            sortColumns={ACTIVITY_SORT_COLUMNS}
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
          />
        ),
        meta: { sortKey: 'lookAheadStatus' as const },
        ...getActivityColumnSizes('summary'),
        cell: ({ row }) => <SummaryCell row={row.original} />,
      }),

      columnHelper.accessor('startDate', {
        header: () => (
          <SortableColumnHeader
            title="Scheduling"
            sortColumnId="startDate"
            sortColumns={ACTIVITY_SORT_COLUMNS}
            effectiveSortKey={effectiveSortKey}
            effectiveSortDirection={effectiveSortDirection}
          />
        ),
        meta: { sortKey: 'startDate' as const },
        ...getActivityColumnSizes('scheduling'),
        cell: ({ row }) => <SchedulingCell row={row.original} />,
      }),

      columnHelper.display({
        id: 'leads',
        header: 'Leads',
        ...getActivityColumnSizes('leads'),
        cell: ({ row }) => <LeadsCell row={row.original} />,
      }),

      columnHelper.display({
        id: 'materials',
        header: 'Materials',
        ...getActivityColumnSizes('materials'),
        cell: ({ row }) => <MaterialsCell row={row.original} />,
      }),

      columnHelper.accessor('activityStatus', {
        header: () => {
          const statusSortKeys: string[] = [...STATUS_COLUMN_SORT_KEYS];
          const isStatusSortActive = statusSortKeys.includes(effectiveSortKey);
          const statusLabel = isStatusSortActive
            ? (ACTIVITY_SORT_COLUMNS.find((c) => c.id === effectiveSortKey)
                ?.label ?? effectiveSortKey)
            : null;
          const sortIndicator = (
            <SortIndicator
              columnId={statusSortKeys}
              sortKey={effectiveSortKey}
              sortDirection={effectiveSortDirection}
              className="h-4 w-4"
            />
          );
          return (
            <span className="inline-flex items-center gap-1">
              Status
              <span className="inline-flex items-center gap-0.5">
                {isStatusSortActive && statusLabel ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">{sortIndicator}</span>
                    </TooltipTrigger>
                    <TooltipContent>Sorted by {statusLabel}</TooltipContent>
                  </Tooltip>
                ) : (
                  sortIndicator
                )}
                <ColumnSortDropdown
                  sortKeys={statusSortKeys}
                  columns={ACTIVITY_SORT_COLUMNS}
                  effectiveSortKey={effectiveSortKey}
                  effectiveSortDirection={effectiveSortDirection}
                  onSortChange={handleSortChange}
                  triggerClassName="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                  iconClassName="text-slate-400"
                  ariaLabel="Sort Status column by"
                />
              </span>
            </span>
          );
        },
        meta: { sortKeys: [...STATUS_COLUMN_SORT_KEYS] },
        ...getActivityColumnSizes('status'),
        cell: ({ row }) => <StatusCell row={row.original} userMap={userMap} />,
      }),
    ],
    [
      columnHelper,
      userMap,
      effectiveSortKey,
      effectiveSortDirection,
      handleSortChange,
      pitchFieldVisibility.canViewPitchStatus,
      canFlag,
      upsertFlagMutation,
      removeFlagMutation,
    ]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { pagination, columnPinning },
    onPaginationChange: onPaginationChangeStable,
    onColumnPinningChange: (updater) =>
      setColumnPinning((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      ),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    getRowId: (row) => String(row.id),
    meta: { userMap, handleHeaderSort },
  });

  const eventTableFilters = useMemo(() => {
    const disabledTooltip = hasStatusFilter
      ? 'Controlled by status filter'
      : undefined;
    const filters = [
      {
        id: 'show-completed',
        label: 'Show completed',
        checked: effectiveShowCompleted,
        onCheckedChange: (checked: boolean) => {
          setActiveSavedFilter(null);
          setPreferences({ showCompleted: checked });
        },
        disabled: hasStatusFilter,
        disabledTooltip,
      },
    ];
    if (canSeeDeleted) {
      filters.push({
        id: 'show-deleted',
        label: 'Show deleted',
        checked: effectiveShowDeleted,
        onCheckedChange: (checked: boolean) => {
          setActiveSavedFilter(null);
          setPreferences({ showDeleted: checked });
        },
        disabled: hasStatusFilter,
        disabledTooltip,
      });
    }
    return filters;
  }, [
    hasStatusFilter,
    effectiveShowCompleted,
    effectiveShowDeleted,
    canSeeDeleted,
    setPreferences,
    setActiveSavedFilter,
  ]);

  const handleFilterStateChange = useCallback(
    (nextFilterState: typeof filterState) => {
      setActiveSavedFilter(null);
      setPreferences({ filterState: nextFilterState });
    },
    [setPreferences, setActiveSavedFilter]
  );

  const appliedSavedFilterName = useMemo(() => {
    if (activeSavedFilter == null) return null;
    const fromList = savedFiltersHook.savedFilters.find(
      (f) => f.id === activeSavedFilter.id
    );
    return fromList?.name ?? activeSavedFilter.name;
  }, [activeSavedFilter, savedFiltersHook.savedFilters]);

  const filterSummaryContextForBar = useMemo(
    (): ActivityFilterSummaryContext => ({
      statusOptions,
      pitchRequiredStatusOptions,
      tagOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
    }),
    [
      statusOptions,
      pitchRequiredStatusOptions,
      tagOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
    ]
  );

  const appliedFilterTypeLabels = useMemo(
    () =>
      getAppliedActivityFilterTypeLabels(
        filterState,
        searchKeyword,
        filterSummaryContextForBar
      ),
    [filterState, searchKeyword, filterSummaryContextForBar]
  );

  const hasActiveCriteria =
    hasAnyActivityTableFilterActive(filterState, pitchFieldVisibility) ||
    searchKeyword.trim() !== '';

  const filterDetailLines = useMemo(
    () =>
      hasActiveCriteria
        ? buildActivityFilterSummaryLinesForDetailPopover(
            filterState,
            searchKeyword,
            filterSummaryContextForBar
          )
        : [],
    [filterState, searchKeyword, filterSummaryContextForBar, hasActiveCriteria]
  );

  const handleClearPanelFilters = useCallback(() => {
    defaultSuppressedByClearRef.current = true;
    defaultAppliedRef.current = false;
    setActiveSavedFilter(null);
    setPreferences({ filterState: DEFAULT_ACTIVITY_FILTER_STATE });
  }, [setPreferences, setActiveSavedFilter]);

  const handleClearAllCriteria = useCallback(() => {
    defaultSuppressedByClearRef.current = true;
    defaultAppliedRef.current = false;
    setActiveSavedFilter(null);
    setPreferences({
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
      searchKeyword: '',
    });
  }, [setPreferences, setActiveSavedFilter]);

  const tableSummaryOnClearFilters = hasAnyActivityTableFilterActive(
    filterState,
    pitchFieldVisibility
  )
    ? handleClearPanelFilters
    : undefined;

  const filterBar = (
    <ActivityTableFilters
      filterState={filterState}
      onFilterStateChange={handleFilterStateChange}
      searchKeyword={searchKeyword}
      onSearchKeywordChange={(value: string) => {
        setActiveSavedFilter(null);
        setPreferences({ searchKeyword: value });
      }}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={handleSortChange}
      defaultSortKey={DEFAULT_SORT_KEY}
      defaultSortDirection={DEFAULT_SORT_DIRECTION}
      sortColumns={ACTIVITY_SORT_COLUMNS}
      categoryOptions={categoryOptions}
      pitchRequiredStatusOptions={pitchRequiredStatusOptions}
      statusOptions={statusOptions}
      tagOptions={tagOptions}
      translationStatusOptions={translationStatusOptions}
      translationOptions={translationOptions}
      ministryOptions={ministryOptions}
      organizationOptions={organizationOptions}
      commsContactOptions={commsContactOptions}
      eventPlannerOptions={eventPlannerOptions}
      pitchFieldVisibility={pitchFieldVisibility}
      savedFilters={savedFiltersHook}
      activeSavedFilterId={activeSavedFilter?.id ?? null}
      onApplySavedFilter={(filterState, searchKeyword, appliedFrom) => {
        setActiveSavedFilter(appliedFrom);
        setPreferences({ filterState, searchKeyword });
      }}
    />
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-w-0 space-y-4">
        {filterBar}
        <ActivityTableLayout
          scrollRef={tableScrollRef}
          count={0}
          singularLabel="entry"
          pluralLabel="entries"
          filters={eventTableFilters}
          appliedSavedFilterName={appliedSavedFilterName}
          appliedFilterTypeLabels={appliedFilterTypeLabels}
          filterDetailLines={filterDetailLines}
          onClearFilters={tableSummaryOnClearFilters}
        >
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="text-sm text-slate-600">
              Loading activities...
            </span>
          </div>
        </ActivityTableLayout>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-10">
        <ErrorState
          title="Failed to load activities"
          message={getFriendlyErrorMessage(error)}
          onRetry={() => void activitiesQuery.refetch()}
        />
      </div>
    );
  }

  // Empty state (no activities from server)
  if (data.length === 0) {
    return (
      <div className="min-w-0 space-y-4">
        {filterBar}
        <ActivityTableLayout
          scrollRef={tableScrollRef}
          count={0}
          singularLabel="entry"
          pluralLabel="entries"
          filters={eventTableFilters}
          appliedSavedFilterName={appliedSavedFilterName}
          appliedFilterTypeLabels={appliedFilterTypeLabels}
          filterDetailLines={filterDetailLines}
          onClearFilters={tableSummaryOnClearFilters}
        >
          <ActivityTableEmptyState
            variant={
              favouriteActivityIds !== undefined
                ? 'no-favourites'
                : hasActiveCriteria
                  ? 'no-filter-match'
                  : 'no-data'
            }
            onClearFilters={
              hasActiveCriteria && favouriteActivityIds === undefined
                ? handleClearAllCriteria
                : undefined
            }
          />
        </ActivityTableLayout>
      </div>
    );
  }

  const pageRows = table.getRowModel().rows;

  // Single return so ActivityTableLayout stays mounted when switching to empty-search state.
  return (
    <TooltipProvider delayDuration={400}>
      <div className="min-w-0 space-y-4">
        {filterBar}
        <ActivityTableLayout
          scrollRef={tableScrollRef}
          count={sortedData.length}
          singularLabel="entry"
          pluralLabel="entries"
          filters={eventTableFilters}
          appliedSavedFilterName={appliedSavedFilterName}
          appliedFilterTypeLabels={appliedFilterTypeLabels}
          filterDetailLines={filterDetailLines}
          onClearFilters={tableSummaryOnClearFilters}
        >
          {filteredData.length === 0 ? (
            <ActivityTableEmptyState
              variant={
                favouriteActivityIds !== undefined
                  ? 'no-favourites'
                  : 'no-search-match'
              }
            />
          ) : (
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
                      const { backgroundColor: _pinBg, ...headerPinStyles } =
                        pinStyles;
                      const meta = header.column.columnDef.meta;
                      const isSortable =
                        meta?.sortKey != null ||
                        (meta?.sortKeys?.length ?? 0) > 0;
                      const sortPayload = meta?.sortKeys ?? meta?.sortKey;
                      const hasMultiSort = (meta?.sortKeys?.length ?? 0) > 0;
                      return (
                        <th
                          key={header.id}
                          className={cn(tableTh, hasMultiSort && 'group')}
                          style={{
                            width: header.getSize(),
                            minWidth:
                              header.column.columnDef.minSize ??
                              header.getSize(),
                            maxWidth:
                              header.column.columnDef.maxSize ??
                              header.getSize(),
                            cursor: isSortable ? 'pointer' : 'default',
                            ...headerPinStyles,
                          }}
                          onClick={(e) => {
                            if (
                              (e.target as HTMLElement).closest(
                                `[${COLUMN_SORT_DROPDOWN_DATA_ATTR}]`
                              )
                            ) {
                              return;
                            }
                            const onHeaderSort =
                              table.options.meta?.handleHeaderSort;
                            if (sortPayload != null && onHeaderSort)
                              onHeaderSort(sortPayload);
                          }}
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
                {pageRows.map((row) => {
                  const isNewRow = newRowIds.has(row.original.id);
                  const isHighlightRow = tableRemoteHighlightIds.has(
                    row.original.id
                  );
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        `group/row ${tableBodyRow} cursor-pointer`,
                        isNewRow && 'animate-in fade-in-0 duration-300',
                        isHighlightRow && 'live-row-highlight'
                      )}
                      tabIndex={0}
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).closest('[data-no-row-nav]')
                        )
                          return;
                        if (window.getSelection()?.toString().trim()) return;
                        void navigate(
                          `/activity/${row.original.id}`,
                          activityFormLinkState(location)
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        if (
                          (e.target as HTMLElement).closest('[data-no-row-nav]')
                        )
                          return;
                        e.preventDefault();
                        void navigate(
                          `/activity/${row.original.id}`,
                          activityFormLinkState(location)
                        );
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
                  );
                })}
              </tbody>
            </table>
          )}
        </ActivityTableLayout>

        {filteredData.length > 0 && (
          <TablePagination
            totalItems={sortedData.length}
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
        )}
      </div>
    </TooltipProvider>
  );
}
