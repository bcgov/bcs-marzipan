import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface MinistryTabOption {
  id: number;
  label: string;
}

interface MinistryTabSelectProps {
  options: MinistryTabOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  ariaLabel: string;
}

/** Chevron inside a tab trigger that opens a multiselect of ministries (at least one stays selected). */
export function MinistryTabSelect({
  options,
  selectedIds,
  onChange,
  ariaLabel,
}: MinistryTabSelectProps) {
  const [search, setSearch] = useState('');
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) setSearch('');
      }}
    >
      <PopoverTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.click();
            }
          }}
          className="hover:bg-muted rounded p-0.5"
          aria-label={ariaLabel}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center border-b px-3">
          <Search
            aria-hidden="true"
            className="mr-2 h-4 w-4 shrink-0 opacity-50"
          />
          <input
            aria-label="Search ministries"
            className="placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ministries..."
            type="text"
            value={search}
          />
        </div>
        <div
          aria-label="Ministries"
          className="max-h-[var(--popover-list-max-height)] overflow-y-auto p-1"
          role="group"
        >
          {filteredOptions.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No ministries found.
            </p>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="hover:bg-accent flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <Checkbox
                  aria-label={option.label}
                  checked={selectedIds.includes(option.id)}
                  onCheckedChange={() => toggle(option.id)}
                />
                <span>{option.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
