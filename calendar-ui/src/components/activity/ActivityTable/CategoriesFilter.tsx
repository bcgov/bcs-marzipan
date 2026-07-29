import { useCallback, useState } from 'react';

import type { CategoryFilterOption } from './categoryFilterUtils';
import { FilterSearchableList } from './FilterSearchableList';

export type { CategoryFilterOption };

export interface CategoriesFilterPanelProps {
  categoryOptions: CategoryFilterOption[];
  selectedCategoryIds: number[];
  onCategoryIdsChange: (ids: number[]) => void;
}

export type CategoriesFilterProps = CategoriesFilterPanelProps;

/**
 * Panel content only (no trigger). Category filter state is stored as numeric ids.
 */
export function CategoriesFilterPanel({
  categoryOptions,
  selectedCategoryIds,
  onCategoryIdsChange,
}: CategoriesFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = useCallback(
    (id: number) => {
      if (selectedCategoryIds.includes(id)) {
        onCategoryIdsChange(
          selectedCategoryIds.filter((value) => value !== id)
        );
      } else {
        onCategoryIdsChange([...selectedCategoryIds, id]);
      }
    },
    [onCategoryIdsChange, selectedCategoryIds]
  );

  const handleClear = useCallback(() => {
    onCategoryIdsChange([]);
  }, [onCategoryIdsChange]);

  return (
    <FilterSearchableList
      options={categoryOptions}
      selectedIds={selectedCategoryIds}
      onToggle={handleToggle}
      searchPlaceholder="Search categories..."
      searchAriaLabel="Search categories"
      emptyMessage="No results"
      showClearButton
      onClear={handleClear}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    />
  );
}
