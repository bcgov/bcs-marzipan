import { Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export interface FilterSearchableListOption {
  value: string;
  label: string;
}

export interface FilterSearchableListProps {
  options: FilterSearchableListOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  emptyMessage?: string;
  showClearButton?: boolean;
  onClear?: () => void;
  maxHeight?: string;
  /** When provided with onSearchChange, search is controlled (parent can reset on close). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

/**
 * Searchable multi-select list for use only inside DropdownMenuContent or
 * DropdownMenuSubContent. Uses Radix menu items so arrow-key navigation works.
 */
export function FilterSearchableList({
  options,
  selectedIds,
  onToggle,
  searchPlaceholder = 'Search...',
  searchAriaLabel = 'Search',
  emptyMessage = 'No results',
  showClearButton = false,
  onClear,
  maxHeight = '250px',
  searchValue: controlledSearchValue,
  onSearchChange: controlledOnSearchChange,
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
      const id = parseInt(value, 10);
      if (!Number.isFinite(id)) return;
      onToggle(id);
    },
    [onToggle]
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const handleFirstItemKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      searchInputRef.current?.focus();
    }
  }, []);

  const hasSelection = selectedIds.length > 0;

  return (
    <>
      <DropdownMenuItem
        asChild
        className="block cursor-text rounded-none p-0 focus:bg-transparent"
        onSelect={(e) => e.preventDefault()}
      >
        <div
          className="border-b p-2"
          onFocus={(e) => {
            if (e.target === e.currentTarget) {
              e.currentTarget.querySelector('input')?.focus();
            }
          }}
        >
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
                const allowPropagation = [
                  'ArrowDown',
                  'ArrowUp',
                  'ArrowLeft', // Let Radix close submenu and return to parent
                  'ArrowRight',
                ].includes(e.key);
                if (!allowPropagation) {
                  e.stopPropagation();
                }
              }}
              aria-label={searchAriaLabel}
            />
          </div>
        </div>
      </DropdownMenuItem>
      <div
        className="overflow-y-auto py-1"
        style={{ maxHeight }}
        tabIndex={0}
        onFocus={(e) => {
          if (e.target === e.currentTarget && filteredOptions.length > 0) {
            requestAnimationFrame(() => firstItemRef.current?.focus());
          }
        }}
      >
        {filteredOptions.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-center text-sm">
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            const id = parseInt(opt.value, 10);
            const checked = Number.isFinite(id) && selectedIds.includes(id);
            const isFirst = index === 0;
            return (
              <DropdownMenuCheckboxItem
                key={opt.value}
                ref={isFirst ? firstItemRef : undefined}
                checked={checked}
                onCheckedChange={() =>
                  Number.isFinite(id) && handleToggle(opt.value)
                }
                onSelect={(e) => e.preventDefault()}
                onKeyDown={isFirst ? handleFirstItemKeyDown : undefined}
              >
                <span className="truncate">{opt.label}</span>
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </div>
      {showClearButton && hasSelection && onClear && (
        <>
          <div className="border-t" />
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <button
              type="button"
              className="text-muted-foreground flex w-full items-center gap-2 px-3 py-2 text-sm"
              onClick={onClear}
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
