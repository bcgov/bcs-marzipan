import { useCallback, useMemo, useState } from 'react';

import { FilterSearchableList } from './FilterSearchableList';

export interface CategoryFilterOption {
  value: string;
  label: string;
}

export interface CategoriesFilterPanelProps {
  categoryOptions: CategoryFilterOption[];
  selectedCategoryNames: string[];
  onCategoryNamesChange: (names: string[]) => void;
}

export type CategoriesFilterProps = CategoriesFilterPanelProps;

/**
 * Panel content only (no trigger). Category filter state stores display names;
 * options use numeric ids for FilterSearchableList compatibility.
 */
export function CategoriesFilterPanel({
  categoryOptions,
  selectedCategoryNames,
  onCategoryNamesChange,
}: CategoriesFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const labelById = useMemo(
    () =>
      new Map(
        categoryOptions.map(
          (option) => [Number(option.value), option.label] as const
        )
      ),
    [categoryOptions]
  );

  const selectedIds = useMemo(
    () =>
      selectedCategoryNames
        .map((name) => {
          const option = categoryOptions.find((o) => o.label === name);
          return option ? Number(option.value) : NaN;
        })
        .filter((id) => Number.isFinite(id)),
    [categoryOptions, selectedCategoryNames]
  );

  const handleToggle = useCallback(
    (id: number) => {
      const label = labelById.get(id);
      if (!label) return;
      if (selectedCategoryNames.includes(label)) {
        onCategoryNamesChange(
          selectedCategoryNames.filter((name) => name !== label)
        );
      } else {
        onCategoryNamesChange([...selectedCategoryNames, label]);
      }
    },
    [labelById, selectedCategoryNames, onCategoryNamesChange]
  );

  const handleClear = useCallback(() => {
    onCategoryNamesChange([]);
  }, [onCategoryNamesChange]);

  return (
    <FilterSearchableList
      options={categoryOptions}
      selectedIds={selectedIds}
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
