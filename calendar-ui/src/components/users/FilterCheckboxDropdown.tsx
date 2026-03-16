import { useCallback } from 'react';

import { FilterCheckboxItem } from '@/components/activity/ActivityTable/FilterCheckboxItem';
import { FILTER_PANEL_MIN_WIDTH } from '@/components/Table/tableConstants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { cn } from '@/lib/utils';

export interface FilterCheckboxOption {
  value: string;
  label: string;
}

export interface FilterCheckboxDropdownPanelProps {
  options: FilterCheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  /** Message when options list is empty. Default "No results". */
  emptyMessage?: string;
}

/**
 * Panel content using plain markup. Works inside Popover, DropdownMenuContent,
 * or DropdownMenuSubContent.
 */
export function FilterCheckboxDropdownPanel({
  options,
  selectedValues,
  onChange,
  emptyMessage = 'No results',
}: FilterCheckboxDropdownPanelProps) {
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

  if (options.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }
  return (
    <>
      {options.map((opt) => (
        <FilterCheckboxItem
          key={opt.value}
          checked={selectedValues.includes(opt.value)}
          onCheckedChange={() => handleToggle(opt.value)}
        >
          {opt.label}
        </FilterCheckboxItem>
      ))}
    </>
  );
}

interface FilterCheckboxDropdownProps extends FilterCheckboxDropdownPanelProps {
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Full filter: trigger + dropdown. For composition by ResponsiveFilterRow use
 * FilterCheckboxDropdownPanel with a separate trigger.
 */
export function FilterCheckboxDropdown({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
  className,
  emptyMessage = 'No results',
}: FilterCheckboxDropdownProps) {
  const hasSelection = selectedValues.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label={label}
          active={hasSelection}
          count={selectedValues.length}
          onClear={() => onChange([])}
          clearAriaLabel={`Clear ${label} filter`}
          disabled={disabled}
          className={className}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(FILTER_PANEL_MIN_WIDTH, 'max-h-64 overflow-auto')}
        align="start"
      >
        <FilterCheckboxDropdownPanel
          options={options}
          selectedValues={selectedValues}
          onChange={onChange}
          emptyMessage={emptyMessage}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
