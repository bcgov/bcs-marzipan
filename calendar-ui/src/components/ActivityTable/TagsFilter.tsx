import { useCallback, useState } from 'react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/Table/tableConstants';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { cn } from '@/lib/utils';

import { FilterSearchableList } from './FilterSearchableList';

export interface TagFilterOption {
  value: string;
  label: string;
}

export interface TagsFilterPanelProps {
  tagOptions: TagFilterOption[];
  selectedTagIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
}

export type TagsFilterProps = TagsFilterPanelProps;

/**
 * Panel content only (no trigger). For use in ResponsiveFilterRow inline and overflow.
 */
export function TagsFilterPanel({
  tagOptions,
  selectedTagIds,
  onTagIdsChange,
}: TagsFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleClear = useCallback(() => {
    onTagIdsChange([]);
  }, [onTagIdsChange]);

  return (
    <FilterSearchableList
      options={tagOptions}
      selectedIds={selectedTagIds}
      onToggle={handleToggle}
      searchPlaceholder="Search tags..."
      searchAriaLabel="Search tags"
      emptyMessage="No results"
      showClearButton
      onClear={handleClear}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    />
  );
}

export function TagsFilter({
  tagOptions,
  selectedTagIds,
  onTagIdsChange,
}: TagsFilterProps) {
  const [open, setOpen] = useState(false);

  const hasSelection = selectedTagIds.length > 0;
  const handleClearTrigger = useCallback(() => {
    onTagIdsChange([]);
  }, [onTagIdsChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Tags"
          active={hasSelection}
          count={selectedTagIds.length}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Tags filter"
        />
      </PopoverTrigger>
      <PopoverContent
        className={cn(FILTER_PANEL_MIN_WIDTH, 'w-64 p-0')}
        align="start"
      >
        <TagsFilterPanel
          tagOptions={tagOptions}
          selectedTagIds={selectedTagIds}
          onTagIdsChange={onTagIdsChange}
        />
      </PopoverContent>
    </Popover>
  );
}
