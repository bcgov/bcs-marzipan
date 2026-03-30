import { Check, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import {
  activityFilterStateIsDefault,
  type ActivityFilterState,
} from '@corpcal/shared';
import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import {
  SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE,
  savedFilterPayloadIsEmpty,
} from '@corpcal/shared/utils';
import {
  FilterSearchableList,
  type FilterSearchableListOption,
} from '@/components/activity/ActivityTable/FilterSearchableList';
import { SavedFilterChipBox } from '@/components/shared/SavedFilterChipBox';
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
import { MenuDivider } from '@/components/ui/menu-divider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  filterPopoverMenuItemClass,
  filterPopoverMenuItemDestructiveClass,
  filterPopoverSplitClearIconClass,
  filterPopoverSubmenuTriggerClass,
} from '@/components/users/filterPopoverMenuItemClasses';
import {
  FilterTrigger,
  filterTriggerStyles,
} from '@/components/users/FilterTrigger';
import { useElementWidth } from '@/hooks/useElementWidth';
import type { UseSavedFiltersReturn } from '@/hooks/useSavedFilters';
import { useSubPopoverHover } from '@/hooks/useSubPopoverHover';
import {
  buildActivityFilterChipRows,
  clearSavedFilterChip,
  type ActivityFilterSummaryContext,
} from '@/lib/activity-filter-summary';
import { applySavedFilterSelection } from '@/lib/savedFilterApply';
import { cn } from '@/lib/utils';

/** Draft filter + keyword for save/update/edit dialogs (chip editing). */
type SavedFilterDraft = {
  filterState: ActivityFilterState;
  searchKeyword: string;
};

const SLOT_GAP_PX = 8;
const OVERFLOW_BUTTON_RESERVE_PX = 110;
/** Reserve for the "My filters" trigger when saved filters are enabled (matches filter trigger min width + gap). */
const MY_FILTERS_TRIGGER_RESERVE_PX = 108;
/** `ml-6` before "My filters" so it stays visually separated from "More". */
const MY_FILTERS_LEAD_IN_PX = 24;
/** Show search + scroll list when saved filter count exceeds this (i.e. length > 6). */
const SAVED_FILTERS_SEARCH_THRESHOLD = 6;
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
        'flex w-full items-center justify-between gap-2 py-2 pr-4 pl-6 text-sm',
        filterPopoverSubmenuTriggerClass,
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
            className={filterPopoverSplitClearIconClass}
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

/** Per-row actions popover for a saved filter (hover or click to open). */
function SavedFilterRowActionsPopover({
  savedFilter,
  hasActiveFilters,
  onUpdate,
  onToggleDefault,
  onDuplicate,
  onEdit,
  onDelete,
}: {
  savedFilter: SavedFilterResponse;
  hasActiveFilters: () => boolean;
  onUpdate: () => void;
  onToggleDefault: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const subPopoverHover = useSubPopoverHover(open, setOpen);
  const sf = savedFilter;

  return (
    <Popover open={open} onOpenChange={subPopoverHover.onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-8 shrink-0 items-center justify-center py-2',
            filterPopoverSubmenuTriggerClass
          )}
          aria-label={`Actions for ${sf.name}`}
          aria-expanded={open}
          {...subPopoverHover.triggerPointerHandlers}
        >
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="min-w-48 p-1"
        sideOffset={2}
        {...subPopoverHover.contentPointerHandlers}
      >
        <button
          type="button"
          className={cn(
            'flex w-full flex-col items-start gap-0 py-2 pr-2 pl-2 text-sm disabled:pointer-events-none disabled:opacity-50',
            filterPopoverMenuItemClass
          )}
          disabled={!hasActiveFilters()}
          onClick={onUpdate}
        >
          <span>Update</span>
          <span className="text-muted-foreground text-xs">
            To currently applied filters
          </span>
        </button>
        <button
          type="button"
          className={cn(
            'flex w-full flex-col items-start gap-0 py-2 pr-2 pl-2 text-sm',
            filterPopoverMenuItemClass
          )}
          onClick={onEdit}
        >
          <span>Edit</span>
        </button>
        <button
          type="button"
          className={cn(
            'flex w-full flex-col items-start gap-0 py-2 pr-2 pl-2 text-sm',
            filterPopoverMenuItemClass
          )}
          onClick={onToggleDefault}
        >
          <span>{sf.isDefault ? 'Remove as default' : 'Make default'}</span>
        </button>
        <button
          type="button"
          className={cn(
            'flex w-full items-center py-2 pr-2 pl-2 text-sm',
            filterPopoverMenuItemClass
          )}
          onClick={onDuplicate}
        >
          Duplicate
        </button>
        <MenuDivider />
        <button
          type="button"
          className={cn(
            'flex w-full items-center py-2 pr-2 pl-2 text-sm',
            filterPopoverMenuItemDestructiveClass
          )}
          onClick={onDelete}
        >
          Delete saved filter
        </button>
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
  /** Label when no filters are visible inline (single overflow button). Default "Filters". */
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
    searchKeyword: string,
    appliedFrom: { id: number; name: string }
  ) => void;
  /** Highlights the saved-filter row that matches the last-applied selection (from this context). */
  activeSavedFilterId?: number | null;
  /** Option lists for filter chip labels (activity table). */
  filterSummaryContext?: ActivityFilterSummaryContext;
  /** Parse API saved filter into draft state for the Edit dialog. */
  parseSavedFilterForDraft?: (savedFilter: SavedFilterResponse) => {
    filterState: ActivityFilterState;
    searchKeyword: string;
  };
}

/**
 * Renders as many slot contents as fit in one row; the rest are moved into a
 * "More" / "Filters" when alone (defaults; overridable) popover with overflow filter rows; My filters holds new-filter entry,
 * plus a separate "My filters" popover when saved filters are enabled. Uses ResizeObserver and layout measurement to compute how many slots fit.
 */
export function ResponsiveFilterRow({
  slots,
  overflowTriggerLabel = 'More',
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
  activeSavedFilterId = null,
  filterSummaryContext,
  parseSavedFilterForDraft,
}: ResponsiveFilterRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useElementWidth(containerRef, {
    minChange: WIDTH_CHANGE_THRESHOLD_PX,
    debounceMs: RESIZE_DEBOUNCE_MS,
  });
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [myFiltersOpen, setMyFiltersOpen] = useState(false);
  const [savedFiltersSearch, setSavedFiltersSearch] = useState('');
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);

  // Saved filter dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [updateDialogFilter, setUpdateDialogFilter] =
    useState<SavedFilterResponse | null>(null);
  const [editDialogFilter, setEditDialogFilter] =
    useState<SavedFilterResponse | null>(null);
  const [editFilterName, setEditFilterName] = useState('');
  const [createDraft, setCreateDraft] = useState<SavedFilterDraft | null>(null);
  const [updateDraft, setUpdateDraft] = useState<SavedFilterDraft | null>(null);
  const [editDraft, setEditDraft] = useState<SavedFilterDraft | null>(null);
  const [deleteDialogFilter, setDeleteDialogFilter] =
    useState<SavedFilterResponse | null>(null);
  const [createPayloadError, setCreatePayloadError] = useState<string | null>(
    null
  );
  const [updatePayloadError, setUpdatePayloadError] = useState<string | null>(
    null
  );
  const [editPayloadError, setEditPayloadError] = useState<string | null>(null);
  const editBaselineRef = useRef<{
    filterState: ActivityFilterState;
    searchKeyword: string;
    name: string;
  } | null>(null);

  const hasSavedFilters = savedFilters != null && contextKey != null;
  const savedFiltersList = useMemo(
    () => savedFilters?.savedFilters ?? [],
    [savedFilters?.savedFilters]
  );
  const savedFilterById = useMemo(() => {
    const m = new Map<number, SavedFilterResponse>();
    for (const sf of savedFiltersList) {
      m.set(sf.id, sf);
    }
    return m;
  }, [savedFiltersList]);
  const savedFiltersSearchOptions = useMemo(
    (): FilterSearchableListOption[] =>
      savedFiltersList.map((sf) => ({
        value: String(sf.id),
        label: sf.name,
      })),
    [savedFiltersList]
  );

  const createChipRows = useMemo(() => {
    if (!createDraft || !filterSummaryContext) return [];
    return buildActivityFilterChipRows(
      createDraft.filterState,
      createDraft.searchKeyword,
      filterSummaryContext
    );
  }, [createDraft, filterSummaryContext]);

  const updateChipRows = useMemo(() => {
    if (!updateDraft || !filterSummaryContext) return [];
    return buildActivityFilterChipRows(
      updateDraft.filterState,
      updateDraft.searchKeyword,
      filterSummaryContext
    );
  }, [updateDraft, filterSummaryContext]);

  const editChipRows = useMemo(() => {
    if (!editDraft || !filterSummaryContext) return [];
    return buildActivityFilterChipRows(
      editDraft.filterState,
      editDraft.searchKeyword,
      filterSummaryContext
    );
  }, [editDraft, filterSummaryContext]);

  const hasActiveFilters = useCallback(() => {
    if (!filterState) return false;
    return (
      !activityFilterStateIsDefault(filterState) ||
      (searchKeyword ?? '').trim().length > 0
    );
  }, [filterState, searchKeyword]);

  const handleApplySavedFilter = useCallback(
    (sf: SavedFilterResponse) => {
      applySavedFilterSelection(sf, onApplySavedFilter, () => {
        setMyFiltersOpen(false);
        setOverflowMenuOpen(false);
      });
    },
    [onApplySavedFilter]
  );

  const handleRemoveCreateChip = useCallback((chipKey: string) => {
    setCreatePayloadError(null);
    setCreateDraft((prev) => {
      if (!prev) return prev;
      return clearSavedFilterChip(
        chipKey,
        prev.filterState,
        prev.searchKeyword
      );
    });
  }, []);

  const handleRemoveUpdateChip = useCallback((chipKey: string) => {
    setUpdatePayloadError(null);
    setUpdateDraft((prev) => {
      if (!prev) return prev;
      return clearSavedFilterChip(
        chipKey,
        prev.filterState,
        prev.searchKeyword
      );
    });
  }, []);

  const handleRemoveEditChip = useCallback((chipKey: string) => {
    setEditPayloadError(null);
    setEditDraft((prev) => {
      if (!prev) return prev;
      return clearSavedFilterChip(
        chipKey,
        prev.filterState,
        prev.searchKeyword
      );
    });
  }, []);

  const handleCreateSavedFilter = useCallback(async () => {
    if (!savedFilters || !contextKey || !createDraft) return;
    const name = createName.trim();
    if (!name) return;
    if (
      savedFilterPayloadIsEmpty(
        createDraft.filterState as unknown as Record<string, unknown>,
        createDraft.searchKeyword
      )
    ) {
      setCreatePayloadError(SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE);
      toast.error('Cannot save filter', {
        description: SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE,
      });
      return;
    }
    setCreatePayloadError(null);
    try {
      await savedFilters.createFilter({
        contextKey,
        name,
        filterState: createDraft.filterState as unknown as Record<
          string,
          unknown
        >,
        searchKeyword: createDraft.searchKeyword,
      });
      setCreateDialogOpen(false);
      setCreateName('');
      setCreateDraft(null);
    } catch {
      // Error toast handled by mutation
    }
  }, [savedFilters, contextKey, createDraft, createName]);

  const handleUpdateSavedFilter = useCallback(async () => {
    if (
      !savedFilters ||
      !updateDraft ||
      !updateDialogFilter ||
      !parseSavedFilterForDraft
    )
      return;
    if (
      savedFilterPayloadIsEmpty(
        updateDraft.filterState as unknown as Record<string, unknown>,
        updateDraft.searchKeyword
      )
    ) {
      setUpdatePayloadError(SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE);
      const parsed = parseSavedFilterForDraft(updateDialogFilter);
      setUpdateDraft({
        filterState: parsed.filterState,
        searchKeyword: parsed.searchKeyword,
      });
      toast.error('Cannot update filter', {
        description: SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE,
      });
      return;
    }
    setUpdatePayloadError(null);
    try {
      await savedFilters.updateFilter({
        id: updateDialogFilter.id,
        body: {
          filterState: updateDraft.filterState as unknown as Record<
            string,
            unknown
          >,
          searchKeyword: updateDraft.searchKeyword,
        },
      });
      setUpdateDialogFilter(null);
      setUpdateDraft(null);
    } catch {
      const parsed = parseSavedFilterForDraft(updateDialogFilter);
      setUpdateDraft({
        filterState: parsed.filterState,
        searchKeyword: parsed.searchKeyword,
      });
    }
  }, [savedFilters, updateDraft, updateDialogFilter, parseSavedFilterForDraft]);

  const restoreEditDraftFromBaseline = useCallback(() => {
    const baseline = editBaselineRef.current;
    if (!baseline) return;
    setEditDraft({
      filterState: structuredClone(baseline.filterState),
      searchKeyword: baseline.searchKeyword,
    });
    setEditFilterName(baseline.name);
  }, []);

  const handleEditSavedFilter = useCallback(async () => {
    if (!savedFilters || !editDialogFilter || !editDraft) return;
    const name = editFilterName.trim();
    if (!name) return;
    if (
      savedFilterPayloadIsEmpty(
        editDraft.filterState as unknown as Record<string, unknown>,
        editDraft.searchKeyword
      )
    ) {
      setEditPayloadError(SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE);
      restoreEditDraftFromBaseline();
      toast.error('Cannot save filter', {
        description: SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE,
      });
      return;
    }
    setEditPayloadError(null);
    try {
      await savedFilters.updateFilter({
        id: editDialogFilter.id,
        body: {
          name,
          filterState: editDraft.filterState as unknown as Record<
            string,
            unknown
          >,
          searchKeyword: editDraft.searchKeyword,
        },
      });
      editBaselineRef.current = null;
      setEditDialogFilter(null);
      setEditFilterName('');
      setEditDraft(null);
    } catch {
      restoreEditDraftFromBaseline();
    }
  }, [
    savedFilters,
    editDialogFilter,
    editDraft,
    editFilterName,
    restoreEditDraftFromBaseline,
  ]);

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

  const openCreateSavedFilterDialog = useCallback(() => {
    if (!filterState) return;
    setCreatePayloadError(null);
    setCreateDraft({
      filterState: structuredClone(filterState),
      searchKeyword: searchKeyword ?? '',
    });
    setCreateName('');
    setCreateDialogOpen(true);
  }, [filterState, searchKeyword]);

  const openEditSavedFilterDialog = useCallback(
    (sf: SavedFilterResponse) => {
      if (!parseSavedFilterForDraft) return;
      const parsed = parseSavedFilterForDraft(sf);
      editBaselineRef.current = {
        filterState: structuredClone(parsed.filterState),
        searchKeyword: parsed.searchKeyword,
        name: sf.name,
      };
      setEditPayloadError(null);
      setEditDraft({
        filterState: parsed.filterState,
        searchKeyword: parsed.searchKeyword,
      });
      setEditDialogFilter(sf);
      setEditFilterName(sf.name);
    },
    [parseSavedFilterForDraft]
  );

  const renderSavedFilterSearchRow = useCallback(
    (opt: FilterSearchableListOption) => {
      const id = parseInt(opt.value, 10);
      const sf = savedFilterById.get(id);
      if (!sf) return null;
      return (
        <>
          <button
            type="button"
            className={cn(
              'relative flex min-w-0 items-center gap-2 py-2 pr-2 pl-8 text-left text-sm',
              filterPopoverMenuItemClass
            )}
            aria-label={`Apply ${sf.name}`}
            aria-current={activeSavedFilterId === sf.id ? 'true' : undefined}
            onClick={() => handleApplySavedFilter(sf)}
          >
            <span
              className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
              aria-hidden
            >
              {activeSavedFilterId === sf.id ? (
                <Check className="h-4 w-4" />
              ) : null}
            </span>
            <span className="min-w-0 truncate">{sf.name}</span>
            {sf.isDefault && (
              <span className="border-border text-muted-foreground shrink-0 rounded-full border bg-transparent px-1.5 py-1 text-[12px] leading-none font-medium">
                Default
              </span>
            )}
          </button>
          <SavedFilterRowActionsPopover
            savedFilter={sf}
            hasActiveFilters={hasActiveFilters}
            onUpdate={() => {
              if (!filterState) return;
              setUpdatePayloadError(null);
              setUpdateDraft({
                filterState: structuredClone(filterState),
                searchKeyword: searchKeyword ?? '',
              });
              setUpdateDialogFilter(sf);
            }}
            onToggleDefault={() => {
              void handleToggleDefault(sf);
            }}
            onDuplicate={() => {
              void handleDuplicateSavedFilter(sf);
            }}
            onEdit={() => {
              openEditSavedFilterDialog(sf);
            }}
            onDelete={() => setDeleteDialogFilter(sf)}
          />
        </>
      );
    },
    [
      savedFilterById,
      activeSavedFilterId,
      handleApplySavedFilter,
      hasActiveFilters,
      filterState,
      searchKeyword,
      handleToggleDefault,
      handleDuplicateSavedFilter,
      openEditSavedFilterDialog,
    ]
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
    const overflowControlsReserve =
      OVERFLOW_BUTTON_RESERVE_PX +
      (savedFilters != null && contextKey != null
        ? SLOT_GAP_PX + MY_FILTERS_LEAD_IN_PX + MY_FILTERS_TRIGGER_RESERVE_PX
        : 0);
    const availableWidth =
      containerWidth -
      TRAILING_GROUP_OFFSET_PX -
      overflowControlsReserve -
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
  }, [
    visibleCount,
    containerWidth,
    count,
    reservedWidthForTrailing,
    savedFilters,
    contextKey,
  ]);

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

  const overflowControlsReserveWhenMeasuring =
    OVERFLOW_BUTTON_RESERVE_PX +
    (hasSavedFilters
      ? SLOT_GAP_PX + MY_FILTERS_LEAD_IN_PX + MY_FILTERS_TRIGGER_RESERVE_PX
      : 0);
  const minWidthWhenMeasuring =
    visibleCount === null
      ? TRAILING_GROUP_OFFSET_PX +
        overflowControlsReserveWhenMeasuring +
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
            {hasOverflow && (
              <div className="shrink-0">
                <Popover
                  open={overflowMenuOpen}
                  onOpenChange={setOverflowMenuOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        filterTriggerStyles.base,
                        'shrink-0',
                        overflowTriggerActive
                          ? filterTriggerStyles.active
                          : filterTriggerStyles.inactive,
                        overflowTriggerClassName
                      )}
                      aria-label={
                        finalVisible === 0
                          ? `${triggerLabel}; ${overflowSlotEntries.length} filters`
                          : `${triggerLabel}; ${overflowSlotEntries.length} more filters`
                      }
                    >
                      <span className="truncate">{triggerLabelWithCount}</span>
                      {showClearInTrigger ? (
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
                      ) : (
                        <ChevronDown className={filterTriggerStyles.chevron} />
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
                    <div
                      className="min-h-0 flex-1 overflow-y-auto"
                      role="region"
                      aria-label="More filters"
                    >
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
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {hasSavedFilters && (
              <div className="ml-6 shrink-0">
                <Popover
                  open={myFiltersOpen}
                  onOpenChange={(open) => {
                    setMyFiltersOpen(open);
                    if (!open) setSavedFiltersSearch('');
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        filterTriggerStyles.base,
                        filterTriggerStyles.inactive,
                        'shrink-0 justify-start gap-1.5',
                        overflowTriggerClassName
                      )}
                      aria-label="My filters"
                    >
                      <span className="truncate">My filters</span>
                      <ChevronDown className={filterTriggerStyles.chevron} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      FILTER_PANEL_MIN_WIDTH,
                      'flex max-h-[min(80vh,400px)] w-64 flex-col overflow-hidden p-0'
                    )}
                  >
                    {savedFiltersList.length === 0 ? (
                      <div className="text-muted-foreground px-4 py-3 text-center text-sm">
                        No saved filters yet
                      </div>
                    ) : savedFiltersList.length >
                      SAVED_FILTERS_SEARCH_THRESHOLD ? (
                      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <FilterSearchableList
                          options={savedFiltersSearchOptions}
                          renderOption={renderSavedFilterSearchRow}
                          searchPlaceholder="Search saved filters..."
                          searchAriaLabel="Search saved filters"
                          emptyMessage="No matching filters"
                          searchValue={savedFiltersSearch}
                          onSearchChange={setSavedFiltersSearch}
                          maxHeight="min(240px, 40vh)"
                        />
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-[1fr_auto]">
                          {savedFiltersList.map((sf) => (
                            <Fragment key={sf.id}>
                              <button
                                type="button"
                                className={cn(
                                  'relative flex min-w-0 items-center gap-2 py-2 pr-2 pl-8 text-left text-sm',
                                  filterPopoverMenuItemClass
                                )}
                                aria-label={`Apply ${sf.name}`}
                                aria-current={
                                  activeSavedFilterId === sf.id
                                    ? 'true'
                                    : undefined
                                }
                                onClick={() => handleApplySavedFilter(sf)}
                              >
                                <span
                                  className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
                                  aria-hidden
                                >
                                  {activeSavedFilterId === sf.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : null}
                                </span>
                                <span className="min-w-0 truncate">
                                  {sf.name}
                                </span>
                                {sf.isDefault && (
                                  <span className="border-border text-muted-foreground shrink-0 rounded-full border bg-transparent px-1.5 py-1 text-[12px] leading-none font-medium">
                                    Default
                                  </span>
                                )}
                              </button>
                              <SavedFilterRowActionsPopover
                                savedFilter={sf}
                                hasActiveFilters={hasActiveFilters}
                                onUpdate={() => {
                                  if (!filterState) return;
                                  setUpdatePayloadError(null);
                                  setUpdateDraft({
                                    filterState: structuredClone(filterState),
                                    searchKeyword: searchKeyword ?? '',
                                  });
                                  setUpdateDialogFilter(sf);
                                }}
                                onToggleDefault={() => {
                                  void handleToggleDefault(sf);
                                }}
                                onDuplicate={() => {
                                  void handleDuplicateSavedFilter(sf);
                                }}
                                onEdit={() => {
                                  openEditSavedFilterDialog(sf);
                                }}
                                onDelete={() => setDeleteDialogFilter(sf)}
                              />
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t" />
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left text-sm disabled:pointer-events-none disabled:opacity-50',
                        filterPopoverMenuItemClass
                      )}
                      disabled={!hasActiveFilters()}
                      onClick={openCreateSavedFilterDialog}
                    >
                      <Save
                        className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="flex min-w-0 flex-col items-start gap-0.5">
                        <span className="font-medium">New saved filter</span>
                        <span className="text-muted-foreground text-xs leading-snug font-normal">
                          From currently applied filters
                        </span>
                      </span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreateDraft(null);
            setCreateName('');
            setCreatePayloadError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Save current filter</DialogTitle>
            <DialogDescription>
              Save your currently applied filters for quick access later. Remove
              chips to exclude criteria before saving.
            </DialogDescription>
          </DialogHeader>
          <SavedFilterChipBox
            rows={createChipRows}
            onRemove={handleRemoveCreateChip}
            disabled={savedFilters?.isCreating === true}
          />
          {createPayloadError ? (
            <p className="text-destructive text-sm font-medium" role="alert">
              {createPayloadError}
            </p>
          ) : null}
          <div className="space-y-3">
            <Input
              placeholder="Filter name"
              value={createName}
              onChange={(e) => {
                setCreatePayloadError(null);
                setCreateName(e.target.value);
              }}
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
          if (!open) {
            setUpdateDialogFilter(null);
            setUpdateDraft(null);
            setUpdatePayloadError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update saved filter</DialogTitle>
            <DialogDescription>
              Replace the filters in &ldquo;{updateDialogFilter?.name}&rdquo;
              with the criteria below. Remove chips to exclude them from the
              saved filter.
            </DialogDescription>
          </DialogHeader>
          <SavedFilterChipBox
            rows={updateChipRows}
            onRemove={handleRemoveUpdateChip}
            disabled={savedFilters?.isUpdating === true}
          />
          {updatePayloadError ? (
            <p className="text-destructive text-sm font-medium" role="alert">
              {updatePayloadError}
            </p>
          ) : null}
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

      {/* Edit saved filter (name + stored snapshot) */}
      <Dialog
        open={editDialogFilter != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogFilter(null);
            setEditFilterName('');
            setEditDraft(null);
            setEditPayloadError(null);
            editBaselineRef.current = null;
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit saved filter</DialogTitle>
            <DialogDescription>
              Adjust stored filter criteria and the name. Remove chips to clear
              those filters from the saved definition.
            </DialogDescription>
          </DialogHeader>
          <SavedFilterChipBox
            rows={editChipRows}
            onRemove={handleRemoveEditChip}
            disabled={savedFilters?.isUpdating === true}
          />
          {editPayloadError ? (
            <p className="text-destructive text-sm font-medium" role="alert">
              {editPayloadError}
            </p>
          ) : null}
          <div className="space-y-3">
            <Input
              placeholder="Filter name"
              value={editFilterName}
              onChange={(e) => {
                setEditPayloadError(null);
                setEditFilterName(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleEditSavedFilter();
              }}
              maxLength={80}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogFilter(null);
                setEditFilterName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleEditSavedFilter()}
              disabled={
                !editFilterName.trim() || savedFilters?.isUpdating === true
              }
            >
              {savedFilters?.isUpdating ? 'Saving...' : 'Save'}
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
