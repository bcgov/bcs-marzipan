import { Check, Search, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

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
 * Shared presentational component: search input, scrollable multi-select list
 * with checkmarks, optional empty state message, and optional "Clear filters" footer.
 * Used by TagsFilter and LeadsFilter (LeadSubList).
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

  const hasSelection = selectedIds.length > 0;

  return (
    <>
      <div className="border-b p-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            type="text"
            className="h-8 pr-3 pl-8 text-sm"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={searchAriaLabel}
          />
        </div>
      </div>
      <div className="overflow-y-auto py-1" style={{ maxHeight }}>
        {filteredOptions.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-center text-sm">
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const id = parseInt(opt.value, 10);
            const checked = Number.isFinite(id) && selectedIds.includes(id);
            return (
              <button
                key={opt.value}
                type="button"
                className="focus:bg-accent focus:text-accent-foreground hover:bg-accent relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-left text-sm outline-none select-none"
                onClick={() => Number.isFinite(id) && handleToggle(opt.value)}
              >
                <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                  {checked ? <Check className="size-4" /> : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })
        )}
      </div>
      {showClearButton && hasSelection && onClear && (
        <>
          <div className="border-t" />
          <button
            type="button"
            className="hover:bg-accent text-muted-foreground flex w-full items-center gap-2 px-3 py-2 text-sm"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </>
      )}
    </>
  );
}
