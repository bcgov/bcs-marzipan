import {
  ChevronDownIcon,
  ChevronRight,
  Copy,
  Pencil,
  Save,
  SlidersHorizontal,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import type { ActivityFilterState } from '@/components/activity/ActivityTable/activityFilterState';
import { FILTER_PANEL_MIN_WIDTH } from '@/components/table/tableConstants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FilterTrigger,
  filterTriggerStyles,
} from '@/components/users/FilterTrigger';
import { useElementWidth } from '@/hooks/useElementWidth';
import type { UseSavedFiltersReturn } from '@/hooks/useSavedFilters';
import { useSubPopoverHover } from '@/hooks/useSubPopoverHover';
import {
  sanitizeSavedFilterPayload,
  type SavedFilterPayload,
} from '@/lib/savedFilterSanitize';
import { cn } from '@/lib/utils';

const SLOT_GAP_PX = 8;
const OVERFLOW_BUTTON_RESERVE_PX = 110;
const TRAILING_GROUP_OFFSET_PX = 32;
/** Min change in container width (px) before re-measuring. Avoids resize loop from small reflows. */
const WIDTH_CHANGE_THRESHOLD_PX = 10;
/** Debounce (ms) for ResizeObserver to avoid rapid re-measure during resize. */
const RESIZE_DEBOUNCE_MS = 80;

/** Renders one slot inline: Trigger + Popover + panel. */
function InlineFilterSlot({ slot }: { slot: ResponsiveFilterSlot }) {
  const { label, panel, triggerProps } = slot;
  const trigger = (
    <FilterTrigger
      label={label}
      active={triggerProps.active}
      count={triggerProps.count}
      onClear={triggerProps.onClear}
      clearAriaLabel={triggerProps.clearAriaLabel}
      disabled={triggerProps.disabled}
    />
  );
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn(
          FILTER_PANEL_MIN_WIDTH,
          'max-h-[min(80vh,400px)] w-auto overflow-y-auto p-0'
        )}
        align="start"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

const OverflowFilterRow = forwardRef<
  HTMLButtonElement,
  {
    labelWithCount: string;
    triggerProps: ResponsiveFilterSlotTriggerProps;
  } & ComponentPropsWithoutRef<'button'>
>(function OverflowFilterRow(
  { labelWithCount, triggerProps, className, ...buttonProps },
  ref
) {
  const handleClearClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      triggerProps.onClear();
    },
    [triggerProps]
  );
  const handleClearPointerDown = useCallback(
    (e: PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'data-[state=open]:bg-accent hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between gap-2 py-2 pr-4 pl-6 text-sm outline-none select-none',
        className
      )}
      {...buttonProps}
    >
      <span className="truncate">{labelWithCount}</span>
      <span className="flex shrink-0 items-center gap-1">
        {triggerProps.active && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearClick}
            onPointerDown={handleClearPointerDown}
            className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 align-middle"
            aria-label={triggerProps.clearAriaLabel}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronRight className="text-muted-foreground h-4 w-4" />
      </span>
    </button>
  );
});

/** Overflow filter slot with sub-popover that opens on hover (mouse) or click/keyboard. */
function OverflowFilterPopover({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: ResponsiveFilterSlot;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { label, panel, triggerProps } = entry;
  const labelWithCount =
    triggerProps.active && triggerProps.count > 0
      ? `${label} (${triggerProps.count})`
      : label;
  const subPopoverHover = useSubPopoverHover(isOpen, onOpenChange);

  return (
    <Popover open={isOpen} onOpenChange={subPopoverHover.onOpenChange}>
      <PopoverTrigger asChild>
        <OverflowFilterRow
          labelWithCount={labelWithCount}
          triggerProps={triggerProps}
          {...subPopoverHover.triggerPointerHandlers}
        />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className={cn(
          FILTER_PANEL_MIN_WIDTH,
          'max-h-[min(80vh,400px)] w-auto overflow-y-auto p-0'
        )}
        sideOffset={2}
        {...subPopoverHover.contentPointerHandlers}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

export interface ResponsiveFilterSlotTriggerProps {
  active: boolean;
  count: number;
  onClear: () => void;
  clearAriaLabel: string;
  disabled?: boolean;
}

export interface ResponsiveFilterSlot {
  key: string;
  label: string;
  /** Panel content only (no trigger, no scroll/border wrapper). Same in inline and overflow. */
  panel: ReactNode;
  /** Used for both inline trigger and overflow SubTrigger row (label, count, Clear). */
  triggerProps: ResponsiveFilterSlotTriggerProps;
}

export interface ResponsiveFilterRowProps {
  /** Ordered list of filter slots (panel + triggerProps). */
  slots: ResponsiveFilterSlot[];
  /** Label for the overflow trigger when some filters are visible inline. Default "More filters". */
  overflowTriggerLabel?: string;
  /** Label when no filters are visible inline (single "Filters" button). Default "Filters". */
  overflowTriggerLabelWhenAlone?: string;
  /** Class name for the overflow trigger button (e.g. h-10 for alignment). */
  overflowTriggerClassName?: string;
  /** Optional content rendered after the overflow trigger (e.g. Clear filters button). Shown only when some filters are visible inline; when only the Filters trigger is visible, use onClearAll instead. */
  trailingContent?: ReactNode;
  /** When provided and only the Filters trigger is visible (no inline slots), clicking the clear icon in the trigger calls this. Mirrors FilterTrigger clear behavior. */
  onClearAll?: () => void;
  /** Width in px to reserve for trailing content when measuring. */
  reservedWidthForTrailing?: number;
  /** Class name for the row container. */
  className?: string;
  /** Class name for the inner flex container that holds visible slots. */
  containerClassName?: string;
  /** Saved filters data/actions from useSavedFilters hook. */
  savedFilters?: UseSavedFiltersReturn;
  /** Current saved-filter context key. */
  contextKey?: string | null;
  /** Current filter state for saving/comparing. */
  filterState?: ActivityFilterState;
  /** Current search keyword for saving/comparing. */
  searchKeyword?: string;
  /** Callback to apply a saved filter (sets filterState + searchKeyword in preferences). */
  onApplySavedFilter?: (
    filterState: ActivityFilterState,
    searchKeyword: string
  ) => void;
}

/**
 * Renders as many slot contents as fit in one row; the rest are moved into a
 * "More filters" (or "Filters" when none visible) popover with a Filters accordion,
 * My saved filters, and Save current filter. Uses ResizeObserver and layout measurement to compute how many slots fit.
 */
export function ResponsiveFilterRow({
  slots,
  overflowTriggerLabel = 'More filters',
  overflowTriggerLabelWhenAlone = 'Filters',
  overflowTriggerClassName,
  trailingContent,
  onClearAll,
  reservedWidthForTrailing,
  className,
  containerClassName,
  savedFilters,
  contextKey,
  filterState,
  searchKeyword,
  onApplySavedFilter,
}: ResponsiveFilterRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useElementWidth(containerRef, {
    minChange: WIDTH_CHANGE_THRESHOLD_PX,
    debounceMs: RESIZE_DEBOUNCE_MS,
  });
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(false);
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  // Saved filter dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [updateDialogFilter, setUpdateDialogFilter] =
    useState<SavedFilterResponse | null>(null);
  const [renameDialogFilter, setRenameDialogFilter] =
    useState<SavedFilterResponse | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteDialogFilter, setDeleteDialogFilter] =
    useState<SavedFilterResponse | null>(null);

  const hasSavedFilters = savedFilters != null && contextKey != null;
  const savedFiltersList = savedFilters?.savedFilters ?? [];

  const hasActiveFilters = useCallback(() => {
    if (!filterState) return false;
    const fs = filterState;
    return (
      fs.dateRange.startDate !== '' ||
      fs.dateRange.endDate !== '' ||
      fs.dateRange.noStartDate ||
      fs.dateRange.noEndDate ||
      fs.categoryNames.length > 0 ||
      fs.activityStatusIds.length > 0 ||
      fs.pitchRequiredStatusNames.length > 0 ||
      fs.pitchDateFilter.kind !== 'any' ||
      fs.lookAheadStatusValues.length > 0 ||
      fs.lookAheadSectionValues.length > 0 ||
      fs.dateConfirmedFilter !== 'any' ||
      fs.timeConfirmedFilter !== 'any' ||
      fs.tagIds.length > 0 ||
      fs.leadMinistryIds.length > 0 ||
      fs.leadOrgIds.length > 0 ||
      fs.commsContactLeadUserIds.length > 0 ||
      fs.eventPlannerLeadIds.length > 0 ||
      fs.translationRequiredStatusIds.length > 0 ||
      fs.translationLanguageIds.length > 0 ||
      (searchKeyword ?? '').trim().length > 0
    );
  }, [filterState, searchKeyword]);

  const handleApplySavedFilter = useCallback(
    (sf: SavedFilterResponse) => {
      if (!onApplySavedFilter) return;
      const {
        filterState: sanitized,
        searchKeyword: kw,
        hadInvalidValues,
      } = sanitizeSavedFilterPayload(sf as unknown as SavedFilterPayload);
      onApplySavedFilter(sanitized, kw);
      if (hadInvalidValues) {
        toast.warning(
          'Some filter values are no longer available and were skipped.'
        );
      }
    },
    [onApplySavedFilter]
  );

  const handleCreateSavedFilter = useCallback(async () => {
    if (!savedFilters || !contextKey || !filterState) return;
    const name = createName.trim();
    if (!name) return;
    try {
      await savedFilters.createFilter({
        contextKey,
        name,
        filterState: filterState as unknown as Record<string, unknown>,
        searchKeyword: searchKeyword ?? '',
      });
      setCreateDialogOpen(false);
      setCreateName('');
    } catch {
      // Error toast handled by mutation
    }
  }, [savedFilters, contextKey, filterState, searchKeyword, createName]);

  const handleUpdateSavedFilter = useCallback(async () => {
    if (!savedFilters || !filterState || !updateDialogFilter) return;
    try {
      await savedFilters.updateFilter({
        id: updateDialogFilter.id,
        body: {
          filterState: filterState as unknown as Record<string, unknown>,
          searchKeyword: searchKeyword ?? '',
        },
      });
      setUpdateDialogFilter(null);
    } catch {
      // Error toast handled by mutation
    }
  }, [savedFilters, filterState, searchKeyword, updateDialogFilter]);

  const handleRenameSavedFilter = useCallback(async () => {
    if (!savedFilters || !renameDialogFilter) return;
    const name = renameName.trim();
    if (!name) return;
    try {
      await savedFilters.updateFilter({
        id: renameDialogFilter.id,
        body: { name },
      });
      setRenameDialogFilter(null);
      setRenameName('');
    } catch {
      // Error toast handled by mutation
    }
  }, [savedFilters, renameDialogFilter, renameName]);

  const handleDeleteSavedFilter = useCallback(async () => {
    if (!savedFilters || !deleteDialogFilter) return;
    try {
      await savedFilters.deleteFilter(deleteDialogFilter.id);
      setDeleteDialogFilter(null);
    } catch {
      // Error toast handled by mutation
    }
  }, [savedFilters, deleteDialogFilter]);

  const handleDuplicateSavedFilter = useCallback(
    async (sf: SavedFilterResponse) => {
      if (!savedFilters) return;
      try {
        await savedFilters.duplicateFilter({ id: sf.id });
      } catch {
        // Error toast handled by mutation
      }
    },
    [savedFilters]
  );

  const handleToggleDefault = useCallback(
    async (sf: SavedFilterResponse) => {
      if (!savedFilters) return;
      try {
        await savedFilters.updateFilter({
          id: sf.id,
          body: { isDefault: !sf.isDefault },
        });
      } catch {
        // Error toast handled by mutation
      }
    },
    [savedFilters]
  );

  const count = slots.length;

  useEffect(() => {
    if (containerWidth > 0) setVisibleCount(null);
  }, [containerWidth]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node || count === 0) {
      setVisibleCount(count);
      return;
    }
    if (containerWidth === 0) {
      setVisibleCount(0);
      return;
    }
    if (visibleCount !== null) return;

    const measureRow = node.querySelector<HTMLElement>(
      '[data-responsive-filter-row-measure="true"]'
    );
    if (!measureRow) {
      setVisibleCount(0);
      return;
    }

    const slotWrappers = measureRow.querySelectorAll<HTMLElement>(
      '[data-responsive-filter-slot="true"]'
    );
    const trailingReserve = reservedWidthForTrailing ?? 0;
    const availableWidth =
      containerWidth -
      TRAILING_GROUP_OFFSET_PX -
      OVERFLOW_BUTTON_RESERVE_PX -
      trailingReserve;

    let used = 0;
    let fitCount = 0;
    for (let i = 0; i < slotWrappers.length; i++) {
      const w = slotWrappers[i].offsetWidth;
      const need = used + (i > 0 ? SLOT_GAP_PX : 0) + w;
      if (need > availableWidth) break;
      used = need;
      fitCount = i + 1;
    }

    // Only treat fitCount 0 as invalid when layout is likely not ready (first slot has no width yet)
    const firstSlotWidth = slotWrappers[0]?.offsetWidth ?? -1;
    if (
      fitCount === 0 &&
      count > 0 &&
      slotWrappers.length > 0 &&
      firstSlotWidth === 0
    ) {
      fitCount = count;
    }

    // UX: show 0 inline when only 1–2 would fit; use single "Filters" button instead
    const displayCount = fitCount >= 3 ? fitCount : 0;

    setVisibleCount(displayCount);
  }, [visibleCount, containerWidth, count, reservedWidthForTrailing]);

  const finalVisible =
    visibleCount == null ? count : Math.min(Math.max(0, visibleCount), count);
  const visibleSlotEntries = slots.slice(0, finalVisible);
  const overflowSlotEntries = slots.slice(finalVisible);
  const hasOverflow = overflowSlotEntries.length > 0;

  const triggerLabel =
    finalVisible === 0 ? overflowTriggerLabelWhenAlone : overflowTriggerLabel;

  const overflowActiveCount = overflowSlotEntries.reduce(
    (sum, entry) =>
      sum + (entry.triggerProps.active ? entry.triggerProps.count : 0),
    0
  );
  const overflowTriggerActive = overflowActiveCount > 0;
  const triggerLabelWithCount = overflowTriggerActive
    ? `${triggerLabel} (${overflowActiveCount})`
    : triggerLabel;

  const showClearInTrigger =
    finalVisible === 0 && overflowTriggerActive && onClearAll != null;
  const handleClearAllClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onClearAll?.();
    },
    [onClearAll]
  );
  const handleClearAllPointerDown = useCallback(
    (e: PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  if (count === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('flex min-w-0 flex-1 items-center', className)}
      />
    );
  }

  const minWidthWhenMeasuring =
    visibleCount === null
      ? TRAILING_GROUP_OFFSET_PX +
        OVERFLOW_BUTTON_RESERVE_PX +
        (reservedWidthForTrailing ?? 0)
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-start',
        visibleCount === null && 'min-h-10',
        className
      )}
      style={
        minWidthWhenMeasuring != null
          ? { minWidth: minWidthWhenMeasuring }
          : undefined
      }
    >
      {visibleCount === null ? (
        <div
          data-responsive-filter-row-measure="true"
          className={cn(
            'flex flex-nowrap items-center gap-2 overflow-hidden',
            containerClassName
          )}
          style={{ visibility: 'hidden', position: 'absolute' }}
        >
          {slots.map((slot) => (
            <div
              key={slot.key}
              data-responsive-filter-slot="true"
              className="shrink-0"
            >
              <InlineFilterSlot slot={slot} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-10 shrink-0 items-center">
          <div
            className={cn(
              'flex flex-nowrap items-center gap-2',
              finalVisible > 0 && 'pr-8',
              containerClassName
            )}
          >
            {visibleSlotEntries.map((entry) => (
              <div key={entry.key} className="shrink-0">
                <InlineFilterSlot slot={entry} />
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    filterTriggerStyles.base,
                    'shrink-0 gap-1.5',
                    showClearInTrigger ? 'justify-between' : 'justify-start',
                    overflowTriggerActive
                      ? filterTriggerStyles.active
                      : filterTriggerStyles.inactive,
                    overflowTriggerClassName
                  )}
                  aria-label={
                    hasOverflow
                      ? finalVisible === 0
                        ? `${triggerLabel}; ${overflowSlotEntries.length} filters`
                        : `${triggerLabel}; ${overflowSlotEntries.length} more filters`
                      : `${triggerLabel}; saved filters and save current filter`
                  }
                >
                  <span className="flex min-w-0 shrink items-center gap-1.5">
                    <SlidersHorizontal
                      className={cn(
                        'h-4 w-4 shrink-0',
                        overflowTriggerActive ? 'opacity-100' : 'opacity-70'
                      )}
                    />
                    <span className="truncate">{triggerLabelWithCount}</span>
                  </span>
                  {showClearInTrigger && (
                    <span
                      role="button"
                      tabIndex={0}
                      onPointerDown={handleClearAllPointerDown}
                      onClick={handleClearAllClick}
                      className={filterTriggerStyles.clearIcon}
                      aria-label="Clear all filters"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className={cn(
                  FILTER_PANEL_MIN_WIDTH,
                  'flex max-h-[min(80vh,400px)] w-auto flex-col overflow-hidden p-0'
                )}
              >
                {hasOverflow && (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <button
                      type="button"
                      className="hover:bg-accent hover:text-accent-foreground flex w-full cursor-default items-center gap-2 px-4 py-2 text-sm font-medium outline-none"
                      onClick={() => setFiltersAccordionOpen((prev) => !prev)}
                      aria-expanded={filtersAccordionOpen}
                    >
                      Filters
                      <ChevronDownIcon
                        className={cn(
                          'ml-auto size-4 transition-transform duration-200',
                          filtersAccordionOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {filtersAccordionOpen && (
                      <div>
                        {overflowSlotEntries.map((entry) => (
                          <OverflowFilterPopover
                            key={entry.key}
                            entry={entry}
                            isOpen={openFilterKey === entry.key}
                            onOpenChange={(open) =>
                              setOpenFilterKey(open ? entry.key : null)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {hasOverflow && <div className="border-t" />}
                {hasSavedFilters && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent flex w-full items-center justify-between px-4 py-2 text-sm outline-none"
                      >
                        My saved filters
                        <ChevronRight className="text-muted-foreground ml-auto h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="max-h-60 w-64 overflow-x-hidden overflow-y-auto p-0"
                      sideOffset={2}
                    >
                      {savedFiltersList.length === 0 ? (
                        <div className="text-muted-foreground px-4 py-3 text-center text-sm">
                          No saved filters yet
                        </div>
                      ) : (
                        <div className="grid grid-cols-[1fr_auto]">
                          {savedFiltersList.map((sf) => (
                            <Fragment key={sf.id}>
                              <button
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground flex min-w-0 items-center gap-2 py-2 pr-2 pl-4 text-left text-sm outline-none"
                                aria-label={`Apply ${sf.name}`}
                                onClick={() => handleApplySavedFilter(sf)}
                              >
                                <span className="min-w-0 truncate">
                                  {sf.name}
                                </span>
                                {sf.isDefault && (
                                  <span className="bg-foreground text-background shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
                                    Default
                                  </span>
                                )}
                              </button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent flex w-8 shrink-0 items-center justify-center py-2 outline-none"
                                    aria-label={`Actions for ${sf.name}`}
                                  >
                                    <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="right"
                                  align="start"
                                  className="min-w-48 p-1"
                                  sideOffset={2}
                                >
                                  <button
                                    type="button"
                                    className="hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-0 rounded-sm py-2 pr-2 pl-2 text-sm outline-none disabled:pointer-events-none disabled:opacity-50"
                                    disabled={!hasActiveFilters()}
                                    onClick={() => setUpdateDialogFilter(sf)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Save className="size-4 shrink-0" />
                                      Update
                                    </span>
                                    <span className="text-muted-foreground pl-6 text-xs">
                                      To currently applied filters
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-0 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                                    onClick={() => {
                                      void handleToggleDefault(sf);
                                    }}
                                  >
                                    <span className="flex items-center gap-2">
                                      {sf.isDefault ? (
                                        <StarOff className="size-4 shrink-0" />
                                      ) : (
                                        <Star className="size-4 shrink-0" />
                                      )}
                                      {sf.isDefault
                                        ? 'Remove as default'
                                        : 'Make default'}
                                    </span>
                                    <span className="text-muted-foreground pl-6 text-xs">
                                      Applied on login
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                                    onClick={() => {
                                      void handleDuplicateSavedFilter(sf);
                                    }}
                                  >
                                    <Copy className="size-4" />
                                    Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                                    onClick={() => {
                                      setRenameDialogFilter(sf);
                                      setRenameName(sf.name);
                                    }}
                                  >
                                    <Pencil className="size-4" />
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                                    onClick={() => setDeleteDialogFilter(sf)}
                                  >
                                    <Trash2 className="size-4" />
                                    Delete saved filter
                                  </button>
                                </PopoverContent>
                              </Popover>
                            </Fragment>
                          ))}
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                {hasSavedFilters && (
                  <button
                    type="button"
                    className="hover:bg-accent hover:text-accent-foreground w-full px-4 py-2 text-left text-sm outline-none disabled:pointer-events-none disabled:opacity-50"
                    disabled={!hasActiveFilters()}
                    onClick={() => {
                      setCreateName('');
                      setCreateDialogOpen(true);
                    }}
                  >
                    Save current filter
                  </button>
                )}
              </PopoverContent>
            </Popover>
            {reservedWidthForTrailing != null ? (
              finalVisible > 0 ? (
                (trailingContent ?? (
                  <span
                    className="shrink-0"
                    style={{ width: reservedWidthForTrailing }}
                    aria-hidden
                  />
                ))
              ) : (
                <span
                  className="shrink-0"
                  style={{ width: reservedWidthForTrailing }}
                  aria-hidden
                />
              )
            ) : finalVisible > 0 ? (
              trailingContent
            ) : null}
          </div>
        </div>
      )}

      {/* Create saved filter dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save current filter</DialogTitle>
            <DialogDescription>
              Save your currently applied filters for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Filter name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreateSavedFilter();
              }}
              maxLength={80}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateSavedFilter()}
              disabled={!createName.trim() || savedFilters?.isCreating === true}
            >
              {savedFilters?.isCreating ? 'Saving...' : 'Save filter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update saved filter dialog */}
      <Dialog
        open={updateDialogFilter != null}
        onOpenChange={(open) => {
          if (!open) setUpdateDialogFilter(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update saved filter</DialogTitle>
            <DialogDescription>
              Replace the filters in &ldquo;{updateDialogFilter?.name}&rdquo;
              with your currently applied filters?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogFilter(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpdateSavedFilter()}
              disabled={savedFilters?.isUpdating === true}
            >
              {savedFilters?.isUpdating ? 'Updating...' : 'Update filter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename saved filter dialog */}
      <Dialog
        open={renameDialogFilter != null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameDialogFilter(null);
            setRenameName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename saved filter</DialogTitle>
            <DialogDescription>
              Enter a new name for this saved filter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Filter name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleRenameSavedFilter();
              }}
              maxLength={80}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogFilter(null);
                setRenameName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleRenameSavedFilter()}
              disabled={!renameName.trim() || savedFilters?.isUpdating === true}
            >
              {savedFilters?.isUpdating ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete saved filter dialog */}
      <Dialog
        open={deleteDialogFilter != null}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogFilter(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete saved filter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;
              {deleteDialogFilter?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogFilter(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteSavedFilter()}
              disabled={savedFilters?.isDeleting === true}
            >
              {savedFilters?.isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
