import { Check, ChevronDown } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          role="button"
          tabIndex={0}
          className="hover:bg-muted rounded p-0.5"
          aria-label={ariaLabel}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search ministries..." />
          <CommandList>
            <CommandEmpty>No ministries found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = selectedIds.includes(option.id);
                return (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => toggle(option.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
