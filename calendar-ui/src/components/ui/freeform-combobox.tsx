import { Check, ChevronDown, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
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
  | { kind: 'clear' };

export interface FreeformComboboxProps {
  options: FreeformComboboxOption[];
  /** The current selection - single value or array when multiple */
  value: FreeformComboboxValueWithLead | FreeformComboboxItemWithLead[];
  /** Called when selection changes */
  onChange: (
    value: FreeformComboboxValueWithLead | FreeformComboboxItemWithLead[] | null
  ) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Label shown for the freeform/other option (defaults to "Other") */
  freeformLabel?: string;
  /** Description shown for the freeform option */
  freeformDescription?: string;
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
  /** When multiple, show selected values as chips (default true when multiple) */
  useChips?: boolean;
  /**
   * When set, chips support a "lead" state: one item can be marked as lead.
   * Value items may include isLead; chips show a Lead badge and "Set as lead" for non-lead items.
   * Called with the index of the item to set as lead (parent should update value so only that item has isLead: true).
   */
  onSetLead?: (index: number) => void;
}

export function FreeformCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  freeformLabel = 'Other',
  freeformDescription = 'Use custom value',
  className,
  disabled = false,
  readOnly = false,
  multiple = false,
  useChips = true,
  onSetLead,
}: FreeformComboboxProps) {
  const isLocked = disabled || readOnly;
  const isMuted = disabled;
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const values = multiple
    ? (value as FreeformComboboxItemWithLead[])
    : [value as FreeformComboboxValueWithLead];
  const selectedList = values.filter(
    (v): v is FreeformComboboxItemWithLead => v != null
  );
  const hasSelection = selectedList.length > 0;

  const getDisplayLabel = useCallback(
    (v: FreeformComboboxValue): string => {
      if (!v) return '';
      if (v.type === 'option') {
        const opt = options.find((o) => o.value === v.value);
        return opt?.label ?? v.value;
      }
      return v.value;
    },
    [options]
  );

  const filteredOptions = useMemo(
    () =>
      options.filter((o) =>
        o.label.toLowerCase().includes(inputValue.trim().toLowerCase())
      ),
    [options, inputValue]
  );

  const hasExactMatch = options.some(
    (o) => o.label.toLowerCase() === inputValue.trim().toLowerCase()
  );
  const showFreeform = inputValue.trim().length > 0 && !hasExactMatch;

  const listEntries: ListEntry[] = useMemo(() => {
    const entries: ListEntry[] = filteredOptions.map((o) => ({
      kind: 'option' as const,
      value: o.value,
      label: o.label,
    }));
    if (showFreeform) {
      entries.push({
        kind: 'freeform',
        value: inputValue.trim(),
        label: `${freeformLabel}: "${inputValue.trim()}"`,
      });
    }
    if (hasSelection) {
      entries.push({ kind: 'clear' });
    }
    return entries;
  }, [filteredOptions, showFreeform, inputValue, freeformLabel, hasSelection]);

  const isSelected = useCallback(
    (entry: ListEntry): boolean => {
      if (entry.kind === 'clear') return false;
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

  useEffect(() => {
    if (isLocked) {
      setOpen(false);
    }
  }, [isLocked]);

  useEffect(() => {
    if (!open || isLocked) return;
    setHighlightedIndex(0);
    setInputValue('');
    inputRef.current?.focus();
  }, [open, isLocked]);

  useEffect(() => {
    setHighlightedIndex((i) =>
      listEntries.length === 0 ? 0 : Math.min(i, listEntries.length - 1)
    );
  }, [listEntries.length]);

  const scrollHighlightIntoView = useCallback(() => {
    const list = listRef.current;
    const item = list?.querySelector('[data-highlighted="true"]');
    item?.scrollIntoView({ block: 'nearest' });
  }, []);

  const selectEntry = useCallback(
    (entry: ListEntry) => {
      if (isLocked) return;
      if (entry.kind === 'clear') {
        onChange(null);
        setInputValue('');
        if (!multiple) setOpen(false);
        return;
      }
      if (entry.kind === 'freeform') {
        const newItem: FreeformComboboxItemWithLead = {
          type: 'freeform',
          value: entry.value,
        };
        if (multiple) {
          const next = [...selectedList, newItem];
          onChange(next);
        } else {
          onChange(newItem);
          setOpen(false);
        }
        setInputValue('');
        return;
      }
      const newItem: FreeformComboboxItemWithLead = {
        type: 'option',
        value: entry.value,
      };
      if (multiple) {
        const next = [...selectedList, newItem];
        onChange(next);
      } else {
        onChange(newItem);
        setOpen(false);
      }
      setInputValue('');
    },
    [multiple, onChange, selectedList, isLocked]
  );

  const removeItem = useCallback(
    (index: number) => {
      if (isLocked) return;
      const next = selectedList.filter((_, i) => i !== index);
      onChange(next.length ? next : null);
    },
    [selectedList, multiple, onChange, isLocked]
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
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) =>
          listEntries.length === 0 ? 0 : (i + 1) % listEntries.length
        );
        setTimeout(scrollHighlightIntoView, 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) =>
          listEntries.length === 0
            ? 0
            : (i - 1 + listEntries.length) % listEntries.length
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
            className="bg-muted text-foreground flex h-5.5 w-fit max-w-full items-center gap-1 rounded-sm px-1.5 text-sm font-medium whitespace-nowrap"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{getDisplayLabel(v)}</span>
              {onSetLead && (
                <>
                  {isLead && (
                    <span className="bg-primary/15 text-primary shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
                      Lead
                    </span>
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
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        readOnly={readOnly}
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
          setInputValue(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
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
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            tabIndex={isLocked && !disabled ? -1 : undefined}
            aria-disabled={isLocked}
            className={cn(isLocked && !disabled && 'pointer-events-none')}
            onClick={() => {
              if (isLocked) return;
              setOpen((o) => !o);
            }}
            aria-label={open ? 'Close' : 'Open'}
          >
            <ChevronDown className="text-muted-foreground size-4" />
          </InputGroupButton>
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  );

  return (
    <div className={cn('space-y-2', className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (isLocked) {
            setOpen(false);
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
          >
            {triggerContent}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (triggerRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <div
            className={cn(
              'bg-popover text-popover-foreground ring-foreground/10 max-h-[var(--popover-list-max-height)] overflow-hidden rounded-md shadow-md ring-1'
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
                className="popover-list-scroll max-h-[var(--popover-list-max-height)] scroll-py-1 overflow-y-auto p-1"
                aria-multiselectable={multiple}
              >
                {listEntries.map((entry, index) => {
                  const highlighted = index === highlightedIndex;
                  const selected = isSelected(entry);
                  const isClear = entry.kind === 'clear';
                  return (
                    <li
                      key={
                        entry.kind === 'option'
                          ? entry.value
                          : entry.kind === 'freeform'
                            ? `freeform-${entry.value}`
                            : 'clear'
                      }
                      id={`freeform-combobox-option-${index}`}
                      role="option"
                      aria-selected={selected}
                      data-highlighted={highlighted}
                      className={cn(
                        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none',
                        highlighted && 'bg-accent text-accent-foreground',
                        isClear && 'text-muted-foreground'
                      )}
                      onPointerMove={() => setHighlightedIndex(index)}
                      onClick={() => selectEntry(entry)}
                    >
                      {isClear ? (
                        <span>Clear selection</span>
                      ) : (
                        <>
                          <Check
                            className={cn(
                              'size-4 shrink-0',
                              selected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span>{entry.label}</span>
                          {entry.kind === 'freeform' && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              {freeformDescription}
                            </span>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
