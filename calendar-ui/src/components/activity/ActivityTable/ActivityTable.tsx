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
  Star,
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
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { sanitizeLegendSwatchHexColor } from '@corpcal/shared/schemas';
import { contrastingBlackOrWhiteForegroundHex } from '@corpcal/shared/utils';
import {
  ActivityFlagIcon,
  ActivityFlagOverflowIcon,
} from '@/components/activity/activities/ActivityFlagIcon';
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
import { useActivityListScrollRestore } from '@/hooks/useActivityListScrollRestore';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import { useActivityTablePreferences } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';
import { useActivityList, useSyncActivityFlags } from '@/hooks/useCalendar';
import {
  useLiveActivityRowHighlights,
  useLiveActivitySyncContext,
} from '@/hooks/useLiveActivitySyncContext';
import {
  getLookAheadSectionLabelFromRows,
  getLookAheadSectionLegendColorFromRows,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import {
  useCategories,
  useTranslationLanguages,
  useUsers,
} from '@/hooks/useLookups';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import {
  canResolveTranslationLanguageFilter,
  filterActivityRowsByFilters,
  filterActivityRowsByKeyword,
  type ActivityListQueryParams,
  type FilterActivityRowsContext,
} from '@/lib/activity-query-utils';
import {
  buildActivityTableBooleanFilters,
  buildActivityTableFilterSummaryDetails,
  resolveEffectiveArchiveFilterVisibility,
} from '@/lib/activity-table-summary-bar-state';
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
  mapActivityToTableRow,
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
    label: 'Scheduled date',
    defaultDirection: 'asc',
    tieBreakers: [{ key: 'startTime', direction: 'asc' }],
  },
  { id: 'lastUpdated', label: 'Last updated', defaultDirection: 'desc' },
  { id: 'createdDateTime', label: 'Date created', defaultDirection: 'desc' },
];

/** Status column can be sorted by activity status, last updated, or date created. */
const STATUS_COLUMN_SORT_KEYS = [
  'activityStatus',
  'lastUpdated',
  'createdDateTime',
] as const;

const LIST_REVIEW_HIGHLIGHT_BG = 'bg-[#FFDDB3]';

function rowHasChangedPath(row: ActivityTableRow, path: string): boolean {
  const changed = row.changedFieldsSinceReview ?? [];
  return changed.some((changedPath: string) => {
    if (changedPath === path) {
      return true;
    }
    return (
      changedPath.startsWith(`${path}.`) || path.startsWith(`${changedPath}.`)
    );
  });
}

function rowHasAnyChangedPath(
  row: ActivityTableRow,
  paths: readonly string[]
): boolean {
  return paths.some((path) => rowHasChangedPath(row, path));
}

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
  isFavourite,
  onFlagSync,
  flagPending,
  showReviewHighlights,
}: {
  row: ActivityTableRow;
  canViewPitchStatus: boolean;
  canFlag?: boolean;
  isFavourite?: boolean;
  onFlagSync?: (
    teamId: number,
    assigneeIds: number[],
    assigneeNames?: string[],
    displayTeamPerAssignee?: Record<number, number | null>
  ) => void;
  flagPending?: boolean;
  showReviewHighlights: boolean;
}) {
  const pitchLabel =
    (canViewPitchStatus ? row.pitchRequiredStatus : null) ??
    row.pitchDate ??
    null;
  const displayIdText = row.displayId ?? String(row.id);
  const titleChanged = showReviewHighlights && rowHasChangedPath(row, 'title');
  const pitchChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['pitchDate', 'pitchRequiredStatusId']);
  const categoriesChanged =
    showReviewHighlights && rowHasChangedPath(row, 'categoryIds');
  const assignedFlags = useMemo(() => {
    const uniqueFlags = new Map<number, ActivityTableRow['flags'][number]>();
    row.flags.forEach((flag) => {
      if (!uniqueFlags.has(flag.assigneeId)) {
        uniqueFlags.set(flag.assigneeId, flag);
      }
    });
    return Array.from(uniqueFlags.values());
  }, [row.flags]);
  const hasAssignedUsers = assignedFlags.length > 0;
  const visibleAssignedFlags = assignedFlags.slice(0, 3);
  const overflowAssignedCount = Math.max(assignedFlags.length - 3, 0);
  const assignedTooltip = assignedFlags
    .map((flag) => flag.assigneeName)
    .join(', ');

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
            copiedTooltipContent="Activity ID copied"
          >
            {displayIdText}
          </CopyableText>
        </span>
        {isFavourite && (
          <span
            title="Added to watch list"
            aria-label="Added to watch list"
            className="inline-flex"
          >
            <Star
              className="size-5 text-amber-500"
              fill="currentColor"
              aria-hidden
            />
          </span>
        )}
        {hasAssignedUsers && canFlag && onFlagSync ? (
          <ActivityFlagPopover
            activityId={row.id}
            flags={row.flags}
            readOnly={!canFlag}
            onSync={onFlagSync}
            isPending={flagPending}
            triggerContent={
              <span
                title={assignedTooltip}
                aria-label={assignedTooltip}
                className="inline-flex"
              >
                <div className="flex items-center">
                  {visibleAssignedFlags.map((flag, index) => (
                    <span
                      key={`${flag.teamId}:${flag.assigneeId}`}
                      className={index > 0 ? '-ml-0.5' : undefined}
                      style={{ zIndex: index + 1 }}
                    >
                      <ActivityFlagIcon
                        assigneeName={flag.assigneeName}
                        assigneeFlagColour={flag.assigneeFlagColour}
                      />
                    </span>
                  ))}
                  {overflowAssignedCount > 0 ? (
                    <span
                      className={
                        visibleAssignedFlags.length > 0 ? '-ml-0.5' : undefined
                      }
                      style={{ zIndex: visibleAssignedFlags.length + 1 }}
                    >
                      <ActivityFlagOverflowIcon
                        extraCount={overflowAssignedCount}
                      />
                    </span>
                  ) : null}
                </div>
              </span>
            }
          />
        ) : hasAssignedUsers ? (
          <span
            data-no-row-nav
            onClick={(e) => e.stopPropagation()}
            title={assignedTooltip}
            aria-label={assignedTooltip}
            className="inline-flex"
          >
            <div className="flex items-center">
              {visibleAssignedFlags.map((flag, index) => (
                <span
                  key={`${flag.teamId}:${flag.assigneeId}`}
                  className={index > 0 ? '-ml-0.5' : undefined}
                  style={{ zIndex: index + 1 }}
                >
                  <ActivityFlagIcon
                    assigneeName={flag.assigneeName}
                    assigneeFlagColour={flag.assigneeFlagColour}
                  />
                </span>
              ))}
              {overflowAssignedCount > 0 ? (
                <span
                  className={
                    visibleAssignedFlags.length > 0 ? '-ml-0.5' : undefined
                  }
                  style={{ zIndex: visibleAssignedFlags.length + 1 }}
                >
                  <ActivityFlagOverflowIcon
                    extraCount={overflowAssignedCount}
                  />
                </span>
              ) : null}
            </div>
          </span>
        ) : canFlag && onFlagSync ? (
          <ActivityFlagPopover
            activityId={row.id}
            flags={row.flags}
            readOnly={!canFlag}
            onSync={onFlagSync}
            isPending={flagPending}
          />
        ) : null}
      </div>
      {(row.isConfidential || row.isIssue) && (
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-sm font-semibold">
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
      )}
      <div
        className={cn(
          'mb-1 line-clamp-4 text-[16px] font-semibold wrap-anywhere text-slate-900',
          titleChanged && 'rounded-sm px-1',
          titleChanged && LIST_REVIEW_HIGHLIGHT_BG
        )}
        title={row.title}
      >
        {row.title}
      </div>
      {pitchLabel && (
        <div
          className={cn(
            'mb-2 text-[13px] text-slate-600',
            pitchChanged && 'inline-block rounded-sm px-1',
            pitchChanged && LIST_REVIEW_HIGHLIGHT_BG
          )}
        >
          Pitch: {toSentenceCase(pitchLabel)}
        </div>
      )}
      {row.activityCategories.length > 0 && (
        <BadgeGroup
          items={row.activityCategories.map(
            (cat, index): BadgeGroupItem => ({
              key: `${cat}:${index}`,
              label: cat,
              variant: 'outline',
              className: cn(
                'h-auto min-h-5 whitespace-normal border-slate-200 text-slate-600',
                categoriesChanged && 'border-transparent',
                categoriesChanged && LIST_REVIEW_HIGHLIGHT_BG
              ),
            })
          )}
          maxLines={1}
          lineHeight={28}
          badgeVariant="outline"
          badgeClassName="h-auto min-h-5 whitespace-normal text-slate-600"
          containerClassName="gap-1"
        />
      )}
    </div>
  );
}

const SUMMARY_MAX_LINES = 5;
const SUMMARY_LINE_HEIGHT_PX = 20;

function summaryContentNeedsTruncation(el: HTMLDivElement): boolean {
  const maxHeight = SUMMARY_LINE_HEIGHT_PX * SUMMARY_MAX_LINES;
  return el.scrollHeight > maxHeight + 1 || el.scrollWidth > el.clientWidth + 1;
}

function SummaryCell({
  row,
  showReviewHighlights,
}: {
  row: ActivityTableRow;
  showReviewHighlights: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const showMoreLessRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setNeedsTruncation(summaryContentNeedsTruncation(el));
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
    const sectionLegendColor = sanitizeLegendSwatchHexColor(
      section
        ? getLookAheadSectionLegendColorFromRows(lookAheadSectionRows, section)
        : null
    );
    const lookAheadItem: BadgeGroupItem | null = lookAheadLabel
      ? {
          key: 'look-ahead',
          label: lookAheadLabel,
          variant: 'primary',
          className: sectionLegendColor
            ? 'h-auto min-h-5 border-transparent text-xs'
            : 'h-auto min-h-5 text-xs text-white',
          style: sectionLegendColor
            ? {
                backgroundColor: sectionLegendColor,
                color: contrastingBlackOrWhiteForegroundHex(sectionLegendColor),
                borderColor: 'transparent',
              }
            : undefined,
        }
      : null;
    const tagItems: BadgeGroupItem[] = row.tags.map((tag, index) => ({
      key: `${tag.id}:${index}`,
      label: tag.text,
      variant: 'outline',
      className: 'h-auto min-h-5 text-xs whitespace-normal text-slate-600',
    }));
    return lookAheadItem ? [lookAheadItem, ...tagItems] : tagItems;
  }, [lookAheadLabel, lookAheadSectionRows, row.tags, section]);

  const isCollapsedWithTruncation = needsTruncation && !expanded;
  const summaryChanged =
    showReviewHighlights && rowHasChangedPath(row, 'summary');

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
          className={cn(
            'text-[14px] leading-[1.4] wrap-anywhere',
            summaryChanged && 'rounded-sm px-1',
            summaryChanged && LIST_REVIEW_HIGHLIGHT_BG,
            !expanded && 'line-clamp-5'
          )}
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

function SchedulingCell({
  row,
  showReviewHighlights,
}: {
  row: ActivityTableRow;
  showReviewHighlights: boolean;
}) {
  const dateStatusChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['dateStatusId', 'dateStatus']);
  const timeStatusChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['timeStatusId', 'timeStatus']);
  const premierChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['premierRequestedId', 'premierRequested']);
  const representativeBadgeItems = useMemo(
    () =>
      row.activityRepresentatives.map(
        (name, index): BadgeGroupItem => ({
          key: `${name}:${index}`,
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
          className: cn(
            'h-auto min-h-5 text-xs text-white',
            premierChanged && LIST_REVIEW_HIGHLIGHT_BG,
            premierChanged && 'border-transparent text-slate-900'
          ),
        },
        ...representativeBadgeItems,
      ];
    }
    return representativeBadgeItems;
  }, [premierChanged, row.premierRequested, representativeBadgeItems]);
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
            className={cn(
              'h-auto min-h-5 border-slate-200 text-xs text-slate-600',
              dateStatusChanged && LIST_REVIEW_HIGHLIGHT_BG,
              dateStatusChanged && 'border-transparent'
            )}
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
            className={cn(
              'h-5 border-slate-200 text-xs text-slate-600',
              timeStatusChanged && LIST_REVIEW_HIGHLIGHT_BG,
              timeStatusChanged && 'border-transparent'
            )}
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

  const leadMinistryDisplay =
    row.leadMinistryAbbreviation ?? row.leadMinistry ?? null;
  if (row.leadOrg && row.leadOrg !== leadMinistryDisplay)
    lines.push({ label: 'Lead org', value: row.leadOrg });
  if (leadMinistryDisplay)
    lines.push({ label: 'Lead ministry', value: leadMinistryDisplay });
  if (row.commsLeadName)
    lines.push({ label: 'Comms contact', value: row.commsLeadName });
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
          {label === 'Comms contact' && additionalComms > 0 && (
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
  /** When set, only activities with any of these lead teams are shown (e.g. ministry tab). */
  leadTeamIds?: number[];
  /** When set, only activities where any of these users is comms contact lead are shown. */
  commsContactLeadUserIds?: number[];
  /** When set, only activities shared with any of these teams are shown. */
  sharedWithTeamIds?: number[];
  /** When set, only activities whose IDs are in this list are shown (favourites tab). */
  favouriteActivityIds?: number[];
  /** IDs currently in the user's watchlist; used to show the watchlist star indicator. */
  watchlistActivityIds?: number[];
  /** When set, only activities flag-assigned to any of these users are shown. */
  flagAssigneeUserIds?: number[];
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
  leadTeamIds,
  commsContactLeadUserIds,
  sharedWithTeamIds,
  favouriteActivityIds,
  watchlistActivityIds,
  flagAssigneeUserIds,
  activeSavedFilter: activeSavedFilterFromParent,
  onActiveSavedFilterChange,
}: ActivityTableProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActivityListRoute = location.pathname === '/';
  const { user, hasPermission } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  const showReviewHighlights = canSeeDeleted;

  const {
    pitchFieldVisibility,
    statusArchiveIds,
    statusOptions,
    pitchRequiredStatusOptions,
    tagOptions,
    ministryOptions,
    organizationOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationOptions,
    translationStatusOptions,
    filterSummaryContext: filterSummaryContextForBar,
    hasActivityStatuses,
  } = useActivityTableFilterLookups(canSeeDeleted);

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
  const {
    data: translationLanguagesForFilter = [],
    isLoading: isTranslationLanguagesLoading,
  } = useTranslationLanguages();
  const categoryOptions = useMemo(
    () =>
      categoriesForFilter
        .filter((c) => c.isActive)
        .map((c) => ({ value: c.displayName, label: c.displayName })),
    [categoriesForFilter]
  );

  const translationLanguageOptionsForFilter = useMemo(
    () =>
      translationLanguagesForFilter.map((l) => ({
        value: String(l.id),
        label: l.shortcode ?? l.displayName ?? String(l.id),
      })),
    [translationLanguagesForFilter]
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
    hasActivityStatuses && !savedFiltersHook.isLoading;

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

  const { hasStatusFilter, effectiveShowCompleted, effectiveShowDeleted } =
    resolveEffectiveArchiveFilterVisibility(
      filterState,
      statusArchiveIds,
      showCompleted,
      showDeleted,
      canSeeDeleted
    );

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
      ...(leadTeamIds !== undefined &&
        leadTeamIds.length > 0 && { leadTeamIds }),
      ...(commsContactLeadUserIds !== undefined &&
        commsContactLeadUserIds.length > 0 && { commsContactLeadUserIds }),
      ...(sharedWithTeamIds !== undefined &&
        sharedWithTeamIds.length > 0 && { sharedWithTeamIds }),
      ...(flagAssigneeUserIds !== undefined &&
        flagAssigneeUserIds.length > 0 && { flagAssigneeUserIds }),
    };
  }, [
    effectiveShowCompleted,
    effectiveShowDeleted,
    leadTeamIds,
    commsContactLeadUserIds,
    sharedWithTeamIds,
    flagAssigneeUserIds,
  ]);

  const sameNumericArray = (
    a: number[] | undefined,
    b: number[] | undefined
  ): boolean =>
    (a == null && b == null) ||
    (a != null &&
      b != null &&
      a.length === b.length &&
      a.every((id, i) => id === b[i]));

  // Reset to first page when user changes filters so results match expectations
  const prevFiltersRef = useRef(activityFilters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const same =
      prev.includeCompleted === activityFilters.includeCompleted &&
      prev.includeDeleted === activityFilters.includeDeleted &&
      sameNumericArray(prev.leadTeamIds, activityFilters.leadTeamIds) &&
      sameNumericArray(
        prev.commsContactLeadUserIds,
        activityFilters.commsContactLeadUserIds
      ) &&
      sameNumericArray(
        prev.sharedWithTeamIds,
        activityFilters.sharedWithTeamIds
      ) &&
      sameNumericArray(
        prev.flagAssigneeUserIds,
        activityFilters.flagAssigneeUserIds
      );
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
  const syncFlagsMutation = useSyncActivityFlags();

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
    () => (activitiesQuery.data ?? []).map(mapActivityToTableRow),
    [activitiesQuery.data]
  );

  const filterContext = useMemo((): FilterActivityRowsContext | undefined => {
    const hasTranslationStatus = translationStatusOptions.length > 0;
    const hasTranslationLanguages =
      translationLanguageOptionsForFilter.length > 0;
    if (!hasTranslationStatus && !hasTranslationLanguages) return undefined;
    return {
      ...(hasTranslationStatus && {
        translationRequiredStatusOptions: translationStatusOptions,
      }),
      ...(hasTranslationLanguages && {
        translationLanguageOptions: translationLanguageOptionsForFilter,
      }),
    };
  }, [translationStatusOptions, translationLanguageOptionsForFilter]);

  const filteredData = useMemo(() => {
    const translationLanguageFilterPending =
      filterState.translationLanguageIds.length > 0 &&
      (isTranslationLanguagesLoading ||
        !canResolveTranslationLanguageFilter(filterState, filterContext));

    if (translationLanguageFilterPending) {
      return [];
    }

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
  }, [
    data,
    searchKeyword,
    filterState,
    filterContext,
    favouriteActivityIds,
    isTranslationLanguagesLoading,
  ]);

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

  const sortedActivityIds = useMemo(
    () => sortedData.map((row) => row.id),
    [sortedData]
  );

  const { openActivityWithScroll } = useActivityListScrollRestore({
    enabled: isActivityListRoute,
    location,
    navigate,
    scrollRef: tableScrollRef,
    pageIndex,
    setPageIndex,
    pageSize: pagination.pageSize,
    loading,
    sortedActivityIds,
  });

  const watchlistActivityIdSet = useMemo(
    () => new Set(watchlistActivityIds ?? []),
    [watchlistActivityIds]
  );

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
            showReviewHighlights={showReviewHighlights}
            isFavourite={watchlistActivityIdSet.has(row.original.id)}
            onFlagSync={(
              teamId,
              assigneeIds,
              assigneeNames,
              displayTeamPerAssignee
            ) =>
              syncFlagsMutation.mutate({
                activityId: row.original.id,
                body: { teamId, assigneeIds, displayTeamPerAssignee },
                assigneeNames,
              })
            }
            flagPending={syncFlagsMutation.isPending}
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
        cell: ({ row }) => (
          <SummaryCell
            row={row.original}
            showReviewHighlights={showReviewHighlights}
          />
        ),
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
        cell: ({ row }) => (
          <SchedulingCell
            row={row.original}
            showReviewHighlights={showReviewHighlights}
          />
        ),
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
      showReviewHighlights,
      canFlag,
      watchlistActivityIdSet,
      syncFlagsMutation,
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

  const eventTableFilters = useMemo(
    () =>
      buildActivityTableBooleanFilters({
        hasStatusFilter,
        effectiveShowCompleted,
        effectiveShowDeleted,
        canSeeDeleted,
        onShowCompletedChange: (checked) => {
          setActiveSavedFilter(null);
          setPreferences({ showCompleted: checked });
        },
        onShowDeletedChange: (checked) => {
          setActiveSavedFilter(null);
          setPreferences({ showDeleted: checked });
        },
      }),
    [
      hasStatusFilter,
      effectiveShowCompleted,
      effectiveShowDeleted,
      canSeeDeleted,
      setPreferences,
      setActiveSavedFilter,
    ]
  );

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

  const { appliedFilterTypeLabels, filterDetailLines, hasActiveCriteria } =
    useMemo(
      () =>
        buildActivityTableFilterSummaryDetails({
          filterState,
          searchKeyword,
          filterSummaryContext: filterSummaryContextForBar,
          pitchFieldVisibility,
        }),
      [
        filterState,
        searchKeyword,
        filterSummaryContextForBar,
        pitchFieldVisibility,
      ]
    );

  const handleClearAllCriteria = useCallback(() => {
    defaultSuppressedByClearRef.current = true;
    defaultAppliedRef.current = false;
    setActiveSavedFilter(null);
    setPreferences({
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
      searchKeyword: '',
    });
  }, [setPreferences, setActiveSavedFilter]);

  const tableSummaryOnClearFilters = hasActiveCriteria
    ? handleClearAllCriteria
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
          singularLabel="activity"
          pluralLabel="activities"
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
          singularLabel="activity"
          pluralLabel="activities"
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
          singularLabel="activity"
          pluralLabel="activities"
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
                      data-activity-id={row.original.id}
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
                        openActivityWithScroll(row.original.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        if (
                          (e.target as HTMLElement).closest('[data-no-row-nav]')
                        )
                          return;
                        e.preventDefault();
                        openActivityWithScroll(row.original.id);
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
