import { useCallback, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import { FilterSearchableList } from './FilterSearchableList';

export interface TagFilterOption {
  value: string;
  label: string;
}

export interface TagsFilterProps {
  tagOptions: TagFilterOption[];
  selectedTagIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
}

export function TagsFilter({
  tagOptions,
  selectedTagIds,
  onTagIdsChange,
}: TagsFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const hasSelection = selectedTagIds.length > 0;

  const handleToggle = useCallback(
    (id: number) => {
      if (selectedTagIds.includes(id)) {
        onTagIdsChange(selectedTagIds.filter((tid) => tid !== id));
      } else {
        onTagIdsChange([...selectedTagIds, id]);
      }
    },
    [selectedTagIds, onTagIdsChange]
  );

  const handleClearFilters = useCallback(() => {
    onTagIdsChange([]);
    setOpen(false);
  }, [onTagIdsChange]);

  const handleClearTrigger = useCallback(() => {
    onTagIdsChange([]);
  }, [onTagIdsChange]);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearchTerm('');
      }}
    >
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Tags"
          active={hasSelection}
          count={selectedTagIds.length}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Tags filter"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <FilterSearchableList
          options={tagOptions}
          selectedIds={selectedTagIds}
          onToggle={handleToggle}
          searchPlaceholder="Search tags..."
          searchAriaLabel="Search tags"
          emptyMessage="No results"
          showClearButton
          onClear={handleClearFilters}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </PopoverContent>
    </Popover>
  );
}
