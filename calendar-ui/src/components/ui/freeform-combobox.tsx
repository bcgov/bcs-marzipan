import { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, PenLine } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command';
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

export interface FreeformComboboxProps {
  options: FreeformComboboxOption[];
  /** The current selection - either an option value, freeform text, or null */
  value: FreeformComboboxValue;
  /** Called when selection changes */
  onChange: (value: FreeformComboboxValue) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Label shown for the freeform/other option (defaults to "Other") */
  freeformLabel?: string;
  /** Description shown for the freeform option */
  freeformDescription?: string;
  className?: string;
  disabled?: boolean;
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
}: FreeformComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === search.toLowerCase()
  );

  const getDisplayValue = useCallback(() => {
    if (!value) return placeholder;
    if (value.type === 'option') {
      const option = options.find((opt) => opt.value === value.value);
      return option?.label ?? placeholder;
    }
    return value.value;
  }, [value, options, placeholder]);

  const handleSelectOption = (optionValue: string) => {
    onChange({ type: 'option', value: optionValue });
    setSearch('');
    setOpen(false);
  };

  const handleSelectFreeform = () => {
    if (search.trim()) {
      onChange({ type: 'freeform', value: search.trim() });
      setSearch('');
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSearch('');
  };

  const isOptionSelected = value?.type === 'option';
  const isFreeformSelected = value?.type === 'freeform';

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <span className="truncate">{getDisplayValue()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filteredOptions.length === 0 && !search.trim() && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}

              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const isSelected =
                      isOptionSelected && value.value === option.value;
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelectOption(option.value)}
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
              )}

              {/* Show freeform option when user has typed something and there's no exact match */}
              {search.trim() && !hasExactMatch && (
                <>
                  {filteredOptions.length > 0 && <CommandSeparator />}
                  <CommandGroup heading={freeformDescription}>
                    <CommandItem
                      value={`freeform-${search}`}
                      onSelect={handleSelectFreeform}
                      className="flex items-center"
                    >
                      <PenLine className="text-muted-foreground mr-2 h-4 w-4" />
                      <span>
                        {freeformLabel}:{' '}
                        <span className="font-medium">
                          &quot;{search}&quot;
                        </span>
                      </span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {/* Show clear option when something is selected */}
              {value && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="__clear__"
                      onSelect={handleClear}
                      className="text-muted-foreground"
                    >
                      Clear selection
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Show indicator when using freeform value */}
      {isFreeformSelected && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          Custom value: &quot;{value.value}&quot;
        </p>
      )}
    </div>
  );
}
