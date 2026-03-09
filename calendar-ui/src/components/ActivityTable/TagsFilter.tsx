import { Check, Search, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';

export interface TagFilterOption {
  value: string;
  label: string;
}

export interface TagsFilterProps {
  tagOptions: TagFilterOption[];
  selectedTagIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
}

export function TagsFilter({
  tagOptions,
  selectedTagIds,
  onTagIdsChange,
}: TagsFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const hasSelection = selectedTagIds.length > 0;

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term === '') return tagOptions;
    return tagOptions.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [tagOptions, searchTerm]);

  const handleToggle = useCallback(
    (value: string) => {
      const id = parseInt(value, 10);
      if (!Number.isFinite(id)) return;
      if (selectedTagIds.includes(id)) {
        onTagIdsChange(selectedTagIds.filter((tid) => tid !== id));
      } else {
        onTagIdsChange([...selectedTagIds, id]);
      }
    },
    [selectedTagIds, onTagIdsChange]
  );

  const handleClearFilters = useCallback(() => {
    onTagIdsChange([]);
    setOpen(false);
  }, [onTagIdsChange]);

  const handleClearTrigger = useCallback(() => {
    onTagIdsChange([]);
  }, [onTagIdsChange]);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearchTerm('');
      }}
    >
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Tags"
          active={hasSelection}
          count={selectedTagIds.length}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Tags filter"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              type="text"
              className="h-8 pr-3 pl-8 text-sm"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Search tags"
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="text-muted-foreground px-3 py-2 text-center text-sm">
              No results
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const checked = selectedTagIds.includes(parseInt(opt.value, 10));
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="focus:bg-accent focus:text-accent-foreground hover:bg-accent relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-left text-sm outline-none select-none"
                  onClick={() => handleToggle(opt.value)}
                >
                  <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                    {checked ? <Check className="size-4" /> : null}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })
          )}
          {hasSelection && (
            <>
              <div className="my-1 border-t" />
              <button
                type="button"
                className="hover:bg-accent text-muted-foreground flex w-full items-center gap-2 px-3 py-2 text-sm"
                onClick={handleClearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
