import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Badge } from './badge';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  selectedValues,
  onSelect,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selectedValues.includes(option.value));
  }, [options, selectedValues]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearch('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedOptions.length > 0
              ? `${selectedOptions.length} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
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
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="default"
              className="cursor-pointer px-3 py-1 text-sm"
              onClick={() => onSelect(option.value)}
            >
              {option.label}
              <X className="ml-2 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
