import { ChevronDown, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FilterCheckboxOption {
  value: string;
  label: string;
}

interface FilterCheckboxDropdownProps {
  label: string;
  options: FilterCheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Multi-select filter dropdown with checkboxes.
 * States: unselected (gray button + chevron), open (dropdown with checkboxes), active (primary button + count + clear X).
 */
export function FilterCheckboxDropdown({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
  className,
}: FilterCheckboxDropdownProps) {
  const [open, setOpen] = useState(false);
  const hasSelection = selectedValues.length > 0;

  const handleToggle = useCallback(
    (value: string) => {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    },
    [onChange, selectedValues]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasSelection ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          className={cn(
            'min-w-[100px] justify-between gap-1 font-normal',
            className
          )}
        >
          <span className="truncate">
            {hasSelection ? `${label} (${selectedValues.length})` : label}
          </span>
          {hasSelection ? (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 rounded p-0.5 hover:bg-white/20"
              aria-label={`Clear ${label} filter`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="max-h-64 overflow-auto p-2">
          {options.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center text-sm">
              No options
            </p>
          ) : (
            <div className="space-y-1">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={selectedValues.includes(opt.value)}
                    onCheckedChange={() => handleToggle(opt.value)}
                  />
                  <span className="flex-1 truncate">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
