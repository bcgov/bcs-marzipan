import { Search, X } from 'lucide-react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { Input } from '@/components/ui/input';
import { filterPopoverMenuItemClass } from '@/components/users/filterPopoverMenuItemClasses';
import { cn } from '@/lib/utils';

import { FilterCheckboxItem } from './FilterCheckboxItem';

export interface FilterSearchableListOption {
  value: string;
  label: string;
}

export interface FilterSearchableListRenderOptionMeta {
  index: number;
  isFirst: boolean;
}

export interface FilterSearchableListProps {
  options: FilterSearchableListOption[];
  /** Required for checkbox rows; ignored when `renderOption` is set. */
  selectedIds?: number[];
  /** Required for checkbox rows; ignored when `renderOption` is set. */
  onToggle?: (id: number) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  emptyMessage?: string;
  showClearButton?: boolean;
  onClear?: () => void;
  maxHeight?: string;
  /** When provided with onSearchChange, search is controlled (parent can reset on close). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /**
   * Custom row content (search + scroll still handled here). Use instead of checkbox rows
   * when items need a different control (e.g. apply + actions per row).
   */
  renderOption?: (
    opt: FilterSearchableListOption,
    meta: FilterSearchableListRenderOptionMeta
  ) => ReactNode;
}

/**
 * Searchable multi-select list using plain markup (no Radix menu primitives).
 * Works inside Popover, DropdownMenuContent, or DropdownMenuSubContent.
 */
export function FilterSearchableList({
  options,
  selectedIds = [],
  onToggle,
  searchPlaceholder = 'Search...',
  searchAriaLabel = 'Search',
  emptyMessage = 'No results',
  showClearButton = false,
  onClear,
  maxHeight = '250px',
  searchValue: controlledSearchValue,
  onSearchChange: controlledOnSearchChange,
  renderOption,
}: FilterSearchableListProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const isControlled =
    controlledSearchValue !== undefined &&
    controlledOnSearchChange !== undefined;
  const searchTerm = isControlled ? controlledSearchValue : internalSearch;
  const setSearchTerm = isControlled
    ? controlledOnSearchChange
    : setInternalSearch;

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term === '') return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm]);

  const handleToggle = useCallback(
    (value: string) => {
      if (!onToggle) return;
      const id = parseInt(value, 10);
      if (!Number.isFinite(id)) return;
      onToggle(id);
    },
    [onToggle]
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstItemRef = useRef<HTMLLabelElement>(null);
  const firstCustomRowRef = useRef<HTMLDivElement>(null);

  const handleFirstItemKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      searchInputRef.current?.focus();
    }
  }, []);

  const hasSelection = !renderOption && selectedIds.length > 0;

  return (
    <>
      <div className="border-b p-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            type="text"
            className="h-8 pr-3 pl-8 text-sm"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            aria-label={searchAriaLabel}
          />
        </div>
      </div>
      <div
        className="overflow-y-auto py-1"
        style={{ maxHeight }}
        tabIndex={0}
        onFocus={(e) => {
          if (e.target !== e.currentTarget || filteredOptions.length === 0) {
            return;
          }
          if (renderOption) {
            const firstFocusable =
              firstCustomRowRef.current?.querySelector<HTMLElement>(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
            requestAnimationFrame(() => firstFocusable?.focus());
            return;
          }
          const firstCheckbox =
            firstItemRef.current?.querySelector<HTMLButtonElement>(
              'button[role="checkbox"]'
            );
          requestAnimationFrame(
            () => firstCheckbox?.focus() ?? firstItemRef.current?.focus()
          );
        }}
      >
        {filteredOptions.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-center text-sm">
            {emptyMessage}
          </div>
        ) : renderOption ? (
          filteredOptions.map((opt, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={opt.value}
                ref={isFirst ? firstCustomRowRef : undefined}
                className="grid grid-cols-[1fr_auto]"
              >
                {renderOption(opt, { index, isFirst })}
              </div>
            );
          })
        ) : (
          filteredOptions.map((opt, index) => {
            const id = parseInt(opt.value, 10);
            const checked = Number.isFinite(id) && selectedIds.includes(id);
            const isFirst = index === 0;
            return (
              <FilterCheckboxItem
                key={opt.value}
                ref={isFirst ? firstItemRef : undefined}
                checked={checked}
                onCheckedChange={() =>
                  Number.isFinite(id) && handleToggle(opt.value)
                }
                onKeyDown={isFirst ? handleFirstItemKeyDown : undefined}
              >
                {opt.label}
              </FilterCheckboxItem>
            );
          })
        )}
      </div>
      {showClearButton && hasSelection && onClear && (
        <>
          <div className="border-t" />
          <button
            type="button"
            className={cn(
              'text-muted-foreground flex w-full items-center gap-2 px-3 py-2 text-sm',
              filterPopoverMenuItemClass
            )}
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        </>
      )}
    </>
  );
}
