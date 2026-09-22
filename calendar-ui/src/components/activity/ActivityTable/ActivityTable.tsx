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
  MapPin,
  NotebookText,
  Star,
  Users,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { sanitizeLegendSwatchHexColor } from '@corpcal/shared/schemas';
import { contrastingBlackOrWhiteForegroundHex } from '@corpcal/shared/utils';
import {
  ActivityFlagAssigneeStack,
  activityFlagAssigneeTooltip,
  uniqueActivityFlagsByAssignee,
} from '@/components/activity/activities/ActivityFlagAssigneeStack';
import { ActivityFlagPopover } from '@/components/activity/activities/ActivityFlagPopover';
import { ActivityDisplayIdCopy } from '@/components/activity/ActivityTable/cells/ActivityDisplayIdCopy';
import { LeadContactLine } from '@/components/activity/ActivityTable/cells/LeadContactLine';
import { OverviewPitchLine } from '@/components/activity/ActivityTable/cells/OverviewPitchLine';
import {
  ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS,
  gridOverviewFlagTriggerClassName,
} from '@/components/activity/ActivityTable/overviewIconsLayout';
import {
  COLUMN_SORT_DROPDOWN_DATA_ATTR,
  ColumnSortDropdown,
} from '@/components/table/ColumnSortDropdown';
import { SortableColumnHeader } from '@/components/table/SortableColumnHeader';
import { SortIndicator } from '@/components/table/SortIndicator';
import {
  getActivityColumnSizes,
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/table/tableConstants';
import {
  handleTableRowClick,
  handleTableRowKeyDown,
} from '@/components/table/tableRowNavigation';
import { ActivityRichTextContent } from '@/components/ui/activity-rich-text-content';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { BadgeGroup, type BadgeGroupItem } from '@/components/ui/badge-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useActivityTableCore,
  type ActivityTableActiveSavedFilter,
  type ActivityTableCoreOptions,
} from '@/hooks/useActivityTableCore';
import {
  getLookAheadSectionLegendColorFromRows,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatDateRange,
  formatExactDate,
  formatRelativeTime,
  formatTime12h,
  parseDateOnlyString,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import { ActivityBulkSelectHeader } from './ActivityBulkSelectHeader';
import { ActivityTableFrame } from './ActivityTableFrame';
import type { ActivityTableRow } from './activityTableRow';
import {
  formatRepresentativeBadgeText,
  LIST_REVIEW_HIGHLIGHT_BG,
  rowHasAnyChangedPath,
  rowHasChangedPath,
  toSentenceCase,
} from './activityTableRowDisplay';
import {
  ACTIVITY_SORT_COLUMNS,
  STATUS_COLUMN_SORT_KEYS,
} from './activityTableSortColumns';
import {
  ACTIVITY_GRID_ROW_ICON_CLASS,
  ACTIVITY_GRID_ROW_ICON_TOP_CLASS,
} from './cells/activityGridRowIcons';
import { formatLookAheadBadgeLabel } from './cells/formatLookAheadBadgeLabel';

export type { ActivityTableActiveSavedFilter };

/**
 * Table width: The table uses table-fixed layout; its width is the sum of column
 * sizes. To increase max width, adjust ACTIVITY_TABLE_COLUMN_WIDTHS in tableConstants.ts
 * (size, minSize, maxSize per column). min-w-[640px] on the
 * table enforces a minimum width and more horizontal scroll when the container is narrow.
 * The page is wrapped by Layout > PageContainer (max-w-[104rem], px-12), so content width
 * is also capped there; any table width beyond that scrolls inside TableScrollContainer.
 */

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
// Cell sub-components
// ---------------------------------------------------------------------------

/**
 * List Overview: only pitch **status** is gated by `activities.pitchStatus.view`.
 */
function OverviewCell({
  row,
  canViewPitchStatus,
  canSelect,
  isSelected,
  onSelectedChange,
  canFlag,
  isFavourite,
  onFlagSync,
  flagPending,
  showReviewHighlights,
}: {
  row: ActivityTableRow;
  canViewPitchStatus: boolean;
  canSelect: boolean;
  isSelected: boolean;
  onSelectedChange: (selected: boolean) => void;
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
  const displayIdText = row.displayId ?? String(row.id);
  const titleChanged = showReviewHighlights && rowHasChangedPath(row, 'title');
  const categoriesChanged =
    showReviewHighlights && rowHasChangedPath(row, 'categoryIds');
  const assignedFlags = uniqueActivityFlagsByAssignee(row.flags);
  const hasAssignedUsers = assignedFlags.length > 0;
  const assignedTooltip = activityFlagAssigneeTooltip(row.flags);
  const flagStackTrigger = hasAssignedUsers ? (
    <span
      title={assignedTooltip}
      aria-label={assignedTooltip}
      className="inline-flex"
    >
      <ActivityFlagAssigneeStack flags={row.flags} reverseStackOrder />
    </span>
  ) : undefined;

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs font-semibold text-slate-900">
        {canSelect && (
          <span
            data-no-row-nav
            className="-m-1 inline-flex size-6 items-center justify-center"
          >
            <Checkbox
              aria-label={`Select activity ${displayIdText}`}
              checked={isSelected}
              onCheckedChange={(checked) => onSelectedChange(checked === true)}
            />
          </span>
        )}
        <span
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
        >
          <ActivityDisplayIdCopy displayId={displayIdText} variant="minimal" />
        </span>
        {isFavourite && (
          <span
            title="Added to watch list"
            aria-label="Added to watch list"
            className="inline-flex"
          >
            <Star
              className={cn('size-5', ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS)}
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
            triggerClassName={gridOverviewFlagTriggerClassName(true)}
            triggerContent={flagStackTrigger}
          />
        ) : hasAssignedUsers ? (
          <span
            data-no-row-nav
            onClick={(e) => e.stopPropagation()}
            title={assignedTooltip}
            aria-label={assignedTooltip}
            className="inline-flex"
          >
            {flagStackTrigger}
          </span>
        ) : canFlag && onFlagSync ? (
          <ActivityFlagPopover
            activityId={row.id}
            flags={row.flags}
            readOnly={!canFlag}
            onSync={onFlagSync}
            isPending={flagPending}
            triggerClassName={gridOverviewFlagTriggerClassName(false)}
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
      <OverviewPitchLine
        row={row}
        canViewPitchStatus={canViewPitchStatus}
        showReviewHighlights={showReviewHighlights}
        className="mb-2"
      />
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
  const section = row.lookAheadSection;
  const lookAheadLabel = formatLookAheadBadgeLabel(
    row.lookAheadStatus,
    section,
    lookAheadSectionRows
  );

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
          <Calendar className={ACTIVITY_GRID_ROW_ICON_CLASS} />
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
          <Clock className={ACTIVITY_GRID_ROW_ICON_CLASS} />
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
          <MapPin className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} />
          <span>{row.venue}</span>
        </div>
      )}

      {badgeGroupItems.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <div className="flex items-start gap-1.5">
            <Users className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} />
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
  if (row.eventPlanners?.length)
    lines.push({
      label: 'Event planners',
      value: row.eventPlanners.join(', '),
    });

  if (lines.length === 0) {
    return <span className="text-slate-400">&mdash;</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      {lines.map(({ label, value }) => (
        <div key={label}>
          <span className="text-slate-500">{label}: </span>
          <span className="font-medium">{value}</span>
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

  const hasCommsLead = row.commsLeadName != null;

  if (!showTranslationBlock && !hasMaterials && !hasCommsLead) {
    return <span className="text-slate-400">&mdash;</span>;
  }

  return (
    <div className="flex flex-col gap-2 text-[13px]">
      {hasCommsLead && <LeadContactLine row={row} variant="labelled" />}
      {showTranslationBlock && (
        <div className="flex items-start gap-1.5">
          <Languages className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} />
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
          <NotebookText className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} />
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

export type ActivityTableProps = ActivityTableCoreOptions;

/**
 * Grid C: the original activity list layout. Column structure is unchanged;
 * shared orchestration lives in {@link useActivityTableCore} and shared chrome
 * in {@link ActivityTableFrame}.
 */
export function ActivityTable(coreOptions: ActivityTableProps = {}) {
  const core = useActivityTableCore(coreOptions);
  const {
    canBulkSelect,
    canFlag,
    showReviewHighlights,
    pitchFieldVisibility,
    sortedData,
    userMap,
    effectiveSortKey,
    effectiveSortDirection,
    handleSortChange,
    handleHeaderSort,
    pagination,
    onPaginationChange,
    selectedActivityIds,
    toggleActivitySelected,
    watchlistActivityIdSet,
    syncFlagsMutation,
    newRowIds,
    remoteHighlightIds,
    openActivityWithScroll,
  } = core;

  const columnHelper = createColumnHelper<ActivityTableRow>();
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['overview'],
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'overview',
        header: () => (
          <div className="flex items-center gap-2">
            {canBulkSelect && <ActivityBulkSelectHeader core={core} />}
            <SortableColumnHeader
              title="Overview"
              sortColumnId="activityId"
              sortColumns={ACTIVITY_SORT_COLUMNS}
              effectiveSortKey={effectiveSortKey}
              effectiveSortDirection={effectiveSortDirection}
            />
          </div>
        ),
        meta: { sortKey: 'activityId' as const },
        ...getActivityColumnSizes('overview'),
        cell: ({ row }) => (
          <OverviewCell
            row={row.original}
            canViewPitchStatus={pitchFieldVisibility.canViewPitchStatus}
            canSelect={canBulkSelect}
            isSelected={selectedActivityIds.has(row.original.id)}
            onSelectedChange={(selected) =>
              toggleActivitySelected(row.original.id, selected)
            }
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
        header: 'Comms',
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
      core,
      userMap,
      effectiveSortKey,
      effectiveSortDirection,
      handleSortChange,
      pitchFieldVisibility.canViewPitchStatus,
      showReviewHighlights,
      canFlag,
      watchlistActivityIdSet,
      syncFlagsMutation,
      selectedActivityIds,
      toggleActivitySelected,
      canBulkSelect,
    ]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { pagination, columnPinning },
    onPaginationChange,
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

  return (
    <ActivityTableFrame core={core}>
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
                  meta?.sortKey != null || (meta?.sortKeys?.length ?? 0) > 0;
                const sortPayload = meta?.sortKeys ?? meta?.sortKey;
                const hasMultiSort = (meta?.sortKeys?.length ?? 0) > 0;
                return (
                  <th
                    key={header.id}
                    className={cn(tableTh, hasMultiSort && 'group')}
                    style={{
                      width: header.getSize(),
                      minWidth:
                        header.column.columnDef.minSize ?? header.getSize(),
                      maxWidth:
                        header.column.columnDef.maxSize ?? header.getSize(),
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
                      const onHeaderSort = table.options.meta?.handleHeaderSort;
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
          {table.getRowModel().rows.map((row) => {
            const isNewRow = newRowIds.has(row.original.id);
            const isHighlightRow = remoteHighlightIds.has(row.original.id);
            return (
              <tr
                key={row.id}
                data-activity-id={row.original.id}
                role="button"
                aria-label={`Open activity ${row.original.title}`}
                className={cn(
                  `group/row ${tableBodyRow} focus-visible:bg-accent/30 cursor-pointer focus-visible:outline-none`,
                  isNewRow && 'animate-in fade-in-0 duration-300',
                  isHighlightRow && 'live-row-highlight'
                )}
                tabIndex={0}
                onClick={(e) => {
                  handleTableRowClick(e, () => {
                    openActivityWithScroll(row.original.id);
                  });
                }}
                onKeyDown={(e) => {
                  handleTableRowKeyDown(e, () => {
                    openActivityWithScroll(row.original.id);
                  });
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
    </ActivityTableFrame>
  );
}
