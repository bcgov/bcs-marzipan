import { Check, ChevronDown, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

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

type ListEntry =
  | { kind: 'option'; value: string; label: string }
  | { kind: 'freeform'; value: string; label: string }
  | { kind: 'clear' };

export interface FreeformComboboxProps {
  options: FreeformComboboxOption[];
  /** The current selection - single value or array when multiple */
  value: FreeformComboboxValue | FreeformComboboxValue[];
  /** Called when selection changes */
  onChange: (
    value: FreeformComboboxValue | FreeformComboboxValue[] | null
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
  /** Allow multiple selections. When true, value/onChange use arrays. */
  multiple?: boolean;
  /** When multiple, show selected values as chips (default true when multiple) */
  useChips?: boolean;
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
  multiple = false,
  useChips = true,
}: FreeformComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const values = multiple
    ? ((value as FreeformComboboxValue[]) ?? [])
    : [value as FreeformComboboxValue];
  const selectedList = values.filter(
    (v): v is NonNullable<FreeformComboboxValue> => v != null
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
    if (!open) return;
    setHighlightedIndex(0);
    setInputValue('');
    inputRef.current?.focus();
  }, [open]);

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
      if (entry.kind === 'clear') {
        onChange(
          multiple ? (null as unknown as FreeformComboboxValue[]) : null
        );
        setInputValue('');
        if (!multiple) setOpen(false);
        return;
      }
      if (entry.kind === 'freeform') {
        const newItem: FreeformComboboxValue = {
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
      const newItem: FreeformComboboxValue = {
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
    [multiple, onChange, selectedList]
  );

  const removeItem = useCallback(
    (index: number) => {
      const next = selectedList.filter((_, i) => i !== index);
      onChange(
        next.length
          ? next
          : multiple
            ? (null as unknown as FreeformComboboxValue[])
            : null
      );
    },
    [selectedList, multiple, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
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
    [open, listEntries, highlightedIndex, selectEntry, scrollHighlightIntoView]
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
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:bg-input/30 flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] has-[data-slot=chip]:px-1.5',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={() => !disabled && setOpen(true)}
    >
      {selectedList.map((v, i) => (
        <span
          key={v.type === 'option' ? v.value : `freeform-${v.value}`}
          data-slot="chip"
          className="bg-muted text-foreground flex h-5.5 w-fit items-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap"
        >
          {getDisplayLabel(v)}
          <button
            type="button"
            className="-mr-1 rounded p-0.5 opacity-50 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              removeItem(i);
            }}
            aria-label="Remove"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="placeholder:text-muted-foreground min-w-16 flex-1 bg-transparent outline-none"
        placeholder={
          selectedList.length === 0 ? placeholder : searchPlaceholder
        }
        value={open ? inputValue : ''}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
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
    <InputGroup className="w-full">
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
          setInputValue(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        readOnly={!open && selectedList.length > 0}
        className={cn(!open && selectedList.length > 0 && 'cursor-pointer')}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close' : 'Open'}
        >
          <ChevronDown className="text-muted-foreground size-4" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div ref={triggerRef} className="w-full cursor-text">
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
              'bg-popover text-popover-foreground ring-foreground/10 max-h-96 overflow-hidden rounded-md shadow-md ring-1'
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
                className="max-h-96 scroll-py-1 overflow-y-auto p-1"
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
