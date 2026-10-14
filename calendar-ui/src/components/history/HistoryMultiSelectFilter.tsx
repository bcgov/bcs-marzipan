import { useMemo, useState, type ReactNode } from 'react';

import { FilterCheckboxItem } from '@/components/activity/ActivityTable/FilterCheckboxItem';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';

export type HistoryFilterOption = {
  value: string;
  label: string;
};

type HistoryMultiSelectFilterProps = {
  label: string;
  options: HistoryFilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchPlaceholder?: string;
  panel?: ReactNode;
  renderPanel?: boolean;
};

export function HistoryMultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  searchPlaceholder,
  panel,
  renderPanel = false,
}: HistoryMultiSelectFilterProps) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FilterTrigger
          label={label}
          active={selectedValues.length > 0}
          count={selectedValues.length}
          onClear={() => onChange([])}
          clearAriaLabel={`Clear ${label} filter`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-70 p-0" align="start">
        {renderPanel && panel ? (
          panel
        ) : (
          <div className="p-3">
            <div className="mb-3 text-xs font-medium tracking-wide text-slate-500 uppercase">
              {label}
            </div>
            {searchPlaceholder ? (
              <Input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="mb-3"
              />
            ) : null}
            <div className="max-h-64 space-y-1 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-2 text-center text-sm text-slate-500">
                  No results
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <FilterCheckboxItem
                    key={option.value}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => toggleValue(option.value)}
                  >
                    {option.label}
                  </FilterCheckboxItem>
                ))
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
