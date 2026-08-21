import { useCallback, useState } from 'react';

import { FilterSearchableList } from './FilterSearchableList';

export interface IdSearchableFilterOption {
  value: string;
  label: string;
}

export interface IdSearchableFilterPanelProps {
  options: IdSearchableFilterOption[];
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
}

/**
 * Searchable multi-select filter panel for numeric ID lists.
 * Used for simple "select many" filters.
 */
export function IdSearchableFilterPanel({
  options,
  selectedIds,
  onSelectedIdsChange,
  searchPlaceholder,
  searchAriaLabel,
}: IdSearchableFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = useCallback(
    (id: number) => {
      if (selectedIds.includes(id)) {
        onSelectedIdsChange(selectedIds.filter((x) => x !== id));
      } else {
        onSelectedIdsChange([...selectedIds, id]);
      }
    },
    [selectedIds, onSelectedIdsChange]
  );

  const handleClear = useCallback(() => {
    onSelectedIdsChange([]);
  }, [onSelectedIdsChange]);

  return (
    <FilterSearchableList
      options={options}
      selectedIds={selectedIds}
      onToggle={handleToggle}
      searchPlaceholder={searchPlaceholder}
      searchAriaLabel={searchAriaLabel}
      emptyMessage="No results"
      showClearButton
      onClear={handleClear}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    />
  );
}
