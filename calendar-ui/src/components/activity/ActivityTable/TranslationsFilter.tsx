import { ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { filterPopoverSubmenuTriggerClass } from '@/components/users/filterPopoverMenuItemClasses';
import { useSubPopoverHover } from '@/hooks/useSubPopoverHover';
import { cn } from '@/lib/utils';

import { FilterCheckboxItem } from './FilterCheckboxItem';
import { FilterSearchableList } from './FilterSearchableList';
import { FilterSectionLabel } from './FilterSectionLabel';

export interface TranslationFilterOption {
  value: string;
  label: string;
}

export interface TranslationStatusFilterOption {
  value: string;
  label: string;
}

export interface TranslationsFilterPanelProps {
  translationStatusOptions: TranslationStatusFilterOption[];
  translationOptions: TranslationFilterOption[];
  selectedStatusIds: number[];
  selectedLanguageIds: number[];
  onStatusIdsChange: (ids: number[]) => void;
  onLanguageIdsChange: (ids: number[]) => void;
}

export type TranslationsFilterProps = TranslationsFilterPanelProps;

/**
 * Translations filter panel with status checkboxes inline and languages in a sub Popover.
 * Works inside Popover or PopoverContent for both inline and overflow filter paths.
 */
export function TranslationsFilterPanel({
  translationStatusOptions,
  translationOptions,
  selectedStatusIds,
  selectedLanguageIds,
  onStatusIdsChange,
  onLanguageIdsChange,
}: TranslationsFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const statusCount = selectedStatusIds.length;
  const languageCount = selectedLanguageIds.length;

  const handleStatusToggle = useCallback(
    (id: number) => {
      if (selectedStatusIds.includes(id)) {
        onStatusIdsChange(selectedStatusIds.filter((x) => x !== id));
      } else {
        onStatusIdsChange([...selectedStatusIds, id]);
      }
    },
    [selectedStatusIds, onStatusIdsChange]
  );

  const handleLanguageToggle = useCallback(
    (id: number) => {
      if (selectedLanguageIds.includes(id)) {
        onLanguageIdsChange(selectedLanguageIds.filter((lid) => lid !== id));
      } else {
        onLanguageIdsChange([...selectedLanguageIds, id]);
      }
    },
    [selectedLanguageIds, onLanguageIdsChange]
  );

  const handleClearStatus = useCallback(() => {
    onStatusIdsChange([]);
  }, [onStatusIdsChange]);

  const handleClearLanguages = useCallback(() => {
    onLanguageIdsChange([]);
  }, [onLanguageIdsChange]);

  const handleLanguagesOpenChange = useCallback((open: boolean) => {
    setLanguagesOpen(open);
    if (!open) setSearchTerm('');
  }, []);

  const subPopoverHover = useSubPopoverHover(
    languagesOpen,
    handleLanguagesOpenChange
  );

  return (
    <div className="min-w-48 space-y-2 py-1">
      <FilterSectionLabel
        onClearAll={statusCount > 0 ? handleClearStatus : undefined}
      >
        Translations status
      </FilterSectionLabel>
      {translationStatusOptions.length === 0 ? (
        <p className="text-muted-foreground py-2 text-center text-sm">
          No results
        </p>
      ) : (
        <ul className="flex flex-col gap-0" role="list">
          {translationStatusOptions.map((opt) => {
            const id = parseInt(opt.value, 10);
            const checked =
              Number.isFinite(id) && selectedStatusIds.includes(id);
            return (
              <li key={opt.value}>
                <FilterCheckboxItem
                  checked={checked}
                  onCheckedChange={() =>
                    Number.isFinite(id) && handleStatusToggle(id)
                  }
                >
                  {opt.label}
                </FilterCheckboxItem>
              </li>
            );
          })}
        </ul>
      )}
      <div className="my-3 border-t" role="separator" />
      <Popover open={languagesOpen} onOpenChange={subPopoverHover.onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between gap-2 px-2 py-1.5 text-sm',
              filterPopoverSubmenuTriggerClass
            )}
            aria-expanded={languagesOpen}
            aria-label={`Translations languages${languageCount > 0 ? ` (${languageCount} selected)` : ''}`}
            {...subPopoverHover.triggerPointerHandlers}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-normal">Translations</span>
              {languageCount > 0 && (
                <span className="text-sm">({languageCount})</span>
              )}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="w-auto min-w-48 p-0"
          sideOffset={2}
          {...subPopoverHover.contentPointerHandlers}
        >
          <FilterSearchableList
            options={translationOptions}
            selectedIds={selectedLanguageIds}
            onToggle={handleLanguageToggle}
            searchPlaceholder="Search languages..."
            searchAriaLabel="Search languages"
            emptyMessage="No results"
            showClearButton
            onClear={handleClearLanguages}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
