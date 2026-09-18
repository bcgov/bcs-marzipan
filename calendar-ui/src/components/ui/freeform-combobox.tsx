import { Check, ChevronDown, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  READ_ONLY_STATIC_COMBOBOX_CHIPS,
  READ_ONLY_STATIC_PLACEHOLDER,
  READ_ONLY_STATIC_TRIGGER,
} from '../../lib/read-only-static-field';
import { cn } from '../../lib/utils';
import {
  CHIP_LABEL_CLASSES,
  CHIP_VISUAL_CLASSES,
} from './combobox-chip-styles';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface FreeformComboboxOption {
  value: string;
  label: string;
}

/** Grouped options with visual separators between non-empty sections (dropdown only). */
export interface FreeformComboboxSection {
  id: string;
  options: FreeformComboboxOption[];
}

/** Represents either a selected option or a custom freeform value */
export type FreeformComboboxValue =
  | { type: 'option'; value: string }
  | { type: 'freeform'; value: string }
  | null;

/** Single item with optional isLead for leadable multi-select (e.g. event planners) */
export type FreeformComboboxItemWithLead =
  | { type: 'option'; value: string; isLead?: boolean }
  | { type: 'freeform'; value: string; isLead?: boolean };

/** Single-mode value (empty or one item); includes optional isLead on items */
export type FreeformComboboxValueWithLead = FreeformComboboxItemWithLead | null;

type ListEntry =
  | { kind: 'option'; value: string; label: string }
  | { kind: 'freeform'; value: string; label: string }
  | { kind: 'separator' };

const FREEFORM_BADGE_CLASSES =
  'bg-primary/15 text-primary shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium';

export interface FreeformComboboxProps {
  /** Flat options (default). Ignored for listing when `sections` is set. */
  options?: FreeformComboboxOption[];
  /**
   * When set, options are shown in order with a divider between consecutive
   * sections that each have at least one visible (filtered) row.
   */
  sections?: FreeformComboboxSection[];
  /** The current selection - single value or array when multiple */
  value: FreeformComboboxValueWithLead | FreeformComboboxItemWithLead[];
  /** Called when selection changes */
  onChange: (
    value: FreeformComboboxValueWithLead | FreeformComboboxItemWithLead[] | null
  ) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Badge text shown after the typed value in the freeform dropdown row */
  freeformBadgeLabel?: string;
  /**
   * Sticky hint at the bottom of the dropdown when the list is idle (no custom
   * row yet). Hidden once the user types a non-matching value.
   */
  listFooterHint?: string;
  className?: string;
  disabled?: boolean;
  /**
   * When true, the control is non-interactive (no dropdown, no chip remove, no typing)
   * but keeps normal (non-muted) styling. Prefer this over `disabled` for view-only
   * forms where the field should look like an active input.
   */
  readOnly?: boolean;
  /** Allow multiple selections. When true, value/onChange use arrays. */
  multiple?: boolean;
  /** Max characters allowed in the search/freeform input. */
  maxInputLength?: number;
  /** When multiple, show selected values as chips (default true when multiple) */
  useChips?: boolean;
  /**
   * When set, chips support a "lead" state: one item can be marked as lead.
   * Value items may include isLead; chips show a Lead badge and "Set as lead" for non-lead items.
   * Called with the index of the item to set as lead (parent should update value so only that item has isLead: true).
   */
  onSetLead?: (index: number) => void;
}

function nextSelectableIndex(
  current: number,
  direction: 1 | -1,
  entries: ListEntry[]
): number {
  if (entries.length === 0) return 0;
  let idx = current;
  for (let step = 0; step < entries.length; step++) {
    idx = (idx + direction + entries.length) % entries.length;
    if (entries[idx].kind !== 'separator') return idx;
  }
  return current;
}

function findExactMatchOption(
  flatOptions: FreeformComboboxOption[],
  trimmed: string
): FreeformComboboxOption | undefined {
  return flatOptions.find(
    (o) => o.label.toLowerCase() === trimmed.toLowerCase()
  );
}

export function FreeformCombobox({
  options: optionsProp,
  sections,
  value,
  onChange,
  placeholder = '',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  freeformBadgeLabel = 'Add custom value',
  listFooterHint,
  className,
  disabled = false,
  readOnly = false,
  multiple = false,
  maxInputLength,
  useChips = true,
  onSetLead,
}: FreeformComboboxProps) {
  const flatOptions = useMemo(() => {
    if (sections && sections.length > 0) {
      return sections.flatMap((s) => s.options);
    }
    return optionsProp ?? [];
  }, [sections, optionsProp]);

  const isLocked = disabled || readOnly;
  const isMuted = disabled;
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const draftEditedRef = useRef(false);
  const skipCommitRef = useRef(false);
  const freeformAnnouncedRef = useRef(false);
  const prevShowFreeformRef = useRef(false);
  const wasOpenRef = useRef(false);

  const values = multiple
    ? (value as FreeformComboboxItemWithLead[])
    : [value as FreeformComboboxValueWithLead];
  const selectedList = values.filter(
    (v): v is FreeformComboboxItemWithLead => v != null
  );
  const hasSelection = selectedList.length > 0;
  const showTriggerClear = hasSelection && !readOnly && !disabled && !multiple;

  const getDisplayLabel = useCallback(
    (v: FreeformComboboxValue): string => {
      if (!v) return '';
      if (v.type === 'option') {
        const opt = flatOptions.find((o) => o.value === v.value);
        return opt?.label ?? v.value;
      }
      return v.value;
    },
    [flatOptions]
  );

  const trimmedInput = inputValue.trim();
  const filteredOptions = useMemo(
    () =>
      flatOptions.filter((o) =>
        o.label.toLowerCase().includes(trimmedInput.toLowerCase())
      ),
    [flatOptions, trimmedInput]
  );

  const filteredSections = useMemo(() => {
    if (!sections?.length) return null;
    const q = trimmedInput.toLowerCase();
    return sections.map((s) => ({
      id: s.id,
      options: s.options.filter((o) => o.label.toLowerCase().includes(q)),
    }));
  }, [sections, trimmedInput]);

  const exactMatchOption = useMemo(
    () =>
      trimmedInput.length > 0
        ? findExactMatchOption(flatOptions, trimmedInput)
        : undefined,
    [flatOptions, trimmedInput]
  );
  const showFreeform = trimmedInput.length > 0 && !exactMatchOption;
  const showListFooter = Boolean(listFooterHint) && !showFreeform;

  const listEntries: ListEntry[] = useMemo(() => {
    const entries: ListEntry[] = [];
    if (filteredSections) {
      for (const sec of filteredSections) {
        if (sec.options.length === 0) continue;
        if (entries.length > 0) {
          entries.push({ kind: 'separator' });
        }
        for (const o of sec.options) {
          entries.push({
            kind: 'option',
            value: o.value,
            label: o.label,
          });
        }
      }
    } else {
      entries.push(
        ...filteredOptions.map((o) => ({
          kind: 'option' as const,
          value: o.value,
          label: o.label,
        }))
      );
    }
    if (showFreeform) {
      entries.push({
        kind: 'freeform',
        value: trimmedInput,
        label: trimmedInput,
      });
    }
    return entries;
  }, [filteredSections, filteredOptions, showFreeform, trimmedInput]);

  const isSelected = useCallback(
    (entry: ListEntry): boolean => {
      if (entry.kind === 'separator') return false;
      if (entry.kind === 'option') {
        return selectedList.some(
          (v) => v.type === 'option' && v.value === entry.value
        );
      }
      return selectedList.some(
        (v) => v.type === 'freeform' && v.value === entry.value
      );
    },
    [selectedList]
  );

  const resetDraft = useCallback(() => {
    draftEditedRef.current = false;
    setInputValue('');
    freeformAnnouncedRef.current = false;
  }, []);

  const commitItem = useCallback(
    (newItem: FreeformComboboxItemWithLead, closeOnSingle = true) => {
      if (multiple) {
        const alreadySelected = selectedList.some(
          (item) => item.type === newItem.type && item.value === newItem.value
        );
        if (alreadySelected) {
          resetDraft();
          return;
        }
        onChange([...selectedList, newItem]);
      } else {
        onChange(newItem);
        if (closeOnSingle) setOpen(false);
      }
      resetDraft();
    },
    [multiple, onChange, selectedList, resetDraft]
  );

  const commitDraft = useCallback(() => {
    if (!draftEditedRef.current) return;
    if (trimmedInput.length === 0) return;

    const exact = findExactMatchOption(flatOptions, trimmedInput);
    if (exact) {
      commitItem({ type: 'option', value: exact.value }, true);
      return;
    }
    commitItem({ type: 'freeform', value: trimmedInput }, true);
  }, [trimmedInput, flatOptions, commitItem]);

  const handleClose = useCallback(() => {
    if (skipCommitRef.current) {
      resetDraft();
      return;
    }
    commitDraft();
    resetDraft();
  }, [commitDraft, resetDraft]);

  const closePopover = useCallback(() => {
    handleClose();
    setOpen(false);
  }, [handleClose]);

  const clearSelection = useCallback(() => {
    onChange(null);
    resetDraft();
    setOpen(false);
  }, [onChange, resetDraft]);

  useEffect(() => {
    if (isLocked) {
      setOpen(false);
    }
  }, [isLocked]);

  useLayoutEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened || isLocked) return;
    draftEditedRef.current = false;
    freeformAnnouncedRef.current = false;
    setHighlightedIndex(0);
  }, [open, isLocked]);

  useEffect(() => {
    if (!open || isLocked) return;
    inputRef.current?.focus();
  }, [open, isLocked]);

  useEffect(() => {
    if (!open) return;

    let targetIndex = 0;
    if (showFreeform) {
      const freeformIdx = listEntries.findIndex((e) => e.kind === 'freeform');
      if (freeformIdx >= 0) targetIndex = freeformIdx;
    } else if (exactMatchOption) {
      const matchIdx = listEntries.findIndex(
        (e) => e.kind === 'option' && e.value === exactMatchOption.value
      );
      if (matchIdx >= 0) targetIndex = matchIdx;
    } else {
      const first = listEntries.findIndex((e) => e.kind !== 'separator');
      targetIndex = first >= 0 ? first : 0;
    }

    setHighlightedIndex(targetIndex);
  }, [listEntries, showFreeform, exactMatchOption, open]);

  useEffect(() => {
    if (
      showFreeform &&
      !prevShowFreeformRef.current &&
      !freeformAnnouncedRef.current
    ) {
      setLiveMessage('Allows custom values');
      freeformAnnouncedRef.current = true;
    }
    prevShowFreeformRef.current = showFreeform;
  }, [showFreeform]);

  const scrollHighlightIntoView = useCallback(() => {
    const list = listRef.current;
    const item = list?.querySelector('[data-highlighted="true"]');
    item?.scrollIntoView({ block: 'nearest' });
  }, []);

  const selectEntry = useCallback(
    (entry: ListEntry) => {
      if (isLocked) return;
      if (entry.kind === 'separator') return;
      if (entry.kind === 'freeform') {
        commitItem({ type: 'freeform', value: entry.value });
        return;
      }
      commitItem({ type: 'option', value: entry.value });
    },
    [commitItem, isLocked]
  );

  const removeItem = useCallback(
    (index: number) => {
      if (isLocked) return;
      const next = selectedList.filter((_, i) => i !== index);
      onChange(next.length ? next : null);
    },
    [selectedList, onChange, isLocked]
  );

  const handleInputChange = useCallback(
    (nextValue: string) => {
      draftEditedRef.current = true;
      setInputValue(nextValue);
      if (!open) setOpen(true);
    },
    [open]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (isLocked) return;
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        skipCommitRef.current = true;
        resetDraft();
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) =>
          listEntries.length === 0 ? 0 : nextSelectableIndex(i, 1, listEntries)
        );
        setTimeout(scrollHighlightIntoView, 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) =>
          listEntries.length === 0 ? 0 : nextSelectableIndex(i, -1, listEntries)
        );
        setTimeout(scrollHighlightIntoView, 0);
        return;
      }
      if (e.key === 'Enter' && listEntries.length > 0) {
        e.preventDefault();
        selectEntry(listEntries[highlightedIndex]);
      }
    },
    [
      open,
      listEntries,
      highlightedIndex,
      selectEntry,
      scrollHighlightIntoView,
      isLocked,
      resetDraft,
    ]
  );

  const showChips = multiple && useChips;

  const singleDisplayValue =
    !multiple && selectedList.length > 0
      ? getDisplayLabel(selectedList[0])
      : '';

  const inputDisplayValue = open
    ? inputValue
    : showChips
      ? ''
      : singleDisplayValue;

  const triggerContent = showChips ? (
    <div
      data-slot="freeform-combobox-chips"
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:bg-input/30 flex min-h-(--input-height) w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] has-[data-slot=chip]:px-1.5',
        isMuted && 'cursor-not-allowed opacity-50',
        readOnly && !disabled && READ_ONLY_STATIC_COMBOBOX_CHIPS,
        readOnly && !disabled && READ_ONLY_STATIC_TRIGGER
      )}
      onClick={() => !isLocked && setOpen(true)}
    >
      {selectedList.map((v, i) => {
        const isLead = 'isLead' in v && v.isLead === true;
        return (
          <span
            key={v.type === 'option' ? v.value : `freeform-${v.value}`}
            data-slot="chip"
            className={CHIP_VISUAL_CLASSES}
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className={CHIP_LABEL_CLASSES}>{getDisplayLabel(v)}</span>
              {onSetLead && (
                <>
                  {isLead && (
                    <span className={FREEFORM_BADGE_CLASSES}>Lead</span>
                  )}
                  {!isLocked && !isLead && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground focus:ring-ring shrink-0 text-[10px] underline focus:ring-1 focus:outline-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSetLead(i);
                      }}
                    >
                      Set as lead
                    </button>
                  )}
                </>
              )}
            </span>
            {!isLocked ? (
              <button
                type="button"
                className="-mr-1 shrink-0 rounded p-0.5 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(i);
                }}
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        className={cn(
          'placeholder:text-muted-foreground min-w-16 flex-1 bg-transparent text-sm outline-none',
          readOnly && READ_ONLY_STATIC_PLACEHOLDER
        )}
        placeholder={
          selectedList.length === 0 ? placeholder : searchPlaceholder
        }
        value={open ? inputValue : ''}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => {
          if (!open) return;
          if (skipCommitRef.current) {
            skipCommitRef.current = false;
            setOpen(false);
            return;
          }
          closePopover();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxInputLength}
        autoComplete="off"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="freeform-combobox-list"
        aria-activedescendant={
          listEntries[highlightedIndex]
            ? `freeform-combobox-option-${highlightedIndex}`
            : undefined
        }
      />
    </div>
  ) : (
    <InputGroup
      className={cn(
        'w-full',
        readOnly && !disabled && READ_ONLY_STATIC_TRIGGER
      )}
    >
      <InputGroupInput
        ref={inputRef}
        data-slot="input-group-control"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="freeform-combobox-list"
        aria-autocomplete="list"
        aria-activedescendant={
          listEntries[highlightedIndex]
            ? `freeform-combobox-option-${highlightedIndex}`
            : undefined
        }
        placeholder={placeholder}
        value={inputDisplayValue}
        onChange={(e) => {
          if (readOnly) return;
          handleInputChange(e.target.value);
        }}
        onBlur={() => {
          if (!open) return;
          if (skipCommitRef.current) {
            skipCommitRef.current = false;
            setOpen(false);
            return;
          }
          closePopover();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={maxInputLength}
        autoComplete="off"
        readOnly={readOnly || (!open && selectedList.length > 0)}
        className={cn(
          'text-sm',
          readOnly && READ_ONLY_STATIC_PLACEHOLDER,
          !open && selectedList.length > 0 && !readOnly && 'cursor-pointer'
        )}
      />
      <InputGroupAddon align="inline-end">
        {!readOnly ? (
          <>
            {showTriggerClear ? (
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-xs"
                data-slot="combobox-clear"
                disabled={disabled}
                aria-label="Clear"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                <X className="pointer-events-none size-4" />
              </InputGroupButton>
            ) : null}
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
              tabIndex={isLocked && !disabled ? -1 : undefined}
              aria-disabled={isLocked}
              className={cn(
                'group-has-data-[slot=combobox-clear]/input-group:hidden',
                isLocked && !disabled && 'pointer-events-none'
              )}
              onClick={() => {
                if (isLocked) return;
                setOpen((o) => !o);
              }}
              aria-label={open ? 'Close' : 'Open'}
            >
              <ChevronDown className="text-muted-foreground size-4" />
            </InputGroupButton>
          </>
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  );

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (isLocked) {
            setOpen(false);
            return;
          }
          if (!next && open) {
            closePopover();
            return;
          }
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <div
            ref={triggerRef}
            className={cn(
              'w-full',
              readOnly && !disabled && READ_ONLY_STATIC_TRIGGER,
              !isLocked && 'cursor-text'
            )}
            onPointerDown={(e) => {
              if (isLocked) return;
              // Radix toggles the popover closed when the trigger is clicked while open.
              if (open) e.preventDefault();
            }}
          >
            {triggerContent}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => {
            skipCommitRef.current = true;
            resetDraft();
          }}
          onInteractOutside={(e) => {
            if (triggerRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <div
            className={cn(
              'bg-popover text-popover-foreground ring-foreground/10 flex max-h-[var(--popover-list-max-height)] flex-col overflow-hidden rounded-md shadow-md ring-1'
            )}
          >
            {listEntries.length === 0 ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                {emptyMessage}
              </div>
            ) : (
              <ul
                ref={listRef}
                id="freeform-combobox-list"
                role="listbox"
                className="popover-list-scroll min-h-0 flex-1 scroll-py-1 overflow-y-auto p-1"
                aria-multiselectable={multiple}
              >
                {listEntries.map((entry, index) => {
                  const highlighted = index === highlightedIndex;
                  const selected = isSelected(entry);
                  if (entry.kind === 'separator') {
                    return (
                      <li
                        key={`sep-${index}`}
                        role="separator"
                        aria-hidden
                        className="pointer-events-none my-1 px-2"
                      >
                        <div className="bg-border h-px w-full" />
                      </li>
                    );
                  }
                  const isFreeform = entry.kind === 'freeform';
                  return (
                    <li
                      key={
                        entry.kind === 'option'
                          ? entry.value
                          : `freeform-${entry.value}`
                      }
                      id={`freeform-combobox-option-${index}`}
                      role="option"
                      aria-selected={selected}
                      aria-label={
                        isFreeform
                          ? `${entry.label}. ${freeformBadgeLabel}`
                          : undefined
                      }
                      data-highlighted={highlighted}
                      className={cn(
                        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none',
                        highlighted && 'bg-accent text-accent-foreground'
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerMove={() => setHighlightedIndex(index)}
                      onClick={() => selectEntry(entry)}
                    >
                      <Check
                        className={cn(
                          'size-4 shrink-0',
                          selected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="min-w-0 truncate">{entry.label}</span>
                      {isFreeform ? (
                        <span className={FREEFORM_BADGE_CLASSES}>
                          {freeformBadgeLabel}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            {showListFooter ? (
              <div
                role="note"
                className="text-muted-foreground border-border shrink-0 cursor-text border-t px-3 py-2 text-xs"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.focus()}
              >
                {listFooterHint}
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
