import { X } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import { FilterSearchableList } from './FilterSearchableList';

export interface TranslationFilterOption {
  value: string;
  label: string;
}

export interface TranslationStatusFilterOption {
  value: string;
  label: string;
}

export interface TranslationsFilterProps {
  translationStatusOptions: TranslationStatusFilterOption[];
  translationOptions: TranslationFilterOption[];
  selectedStatusIds: number[];
  selectedLanguageIds: number[];
  onStatusIdsChange: (ids: number[]) => void;
  onLanguageIdsChange: (ids: number[]) => void;
}

function isTranslationsFilterActive(
  statusCount: number,
  languageCount: number
): boolean {
  return statusCount > 0 || languageCount > 0;
}

export function TranslationsFilter({
  translationStatusOptions,
  translationOptions,
  selectedStatusIds,
  selectedLanguageIds,
  onStatusIdsChange,
  onLanguageIdsChange,
}: TranslationsFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const statusCount = selectedStatusIds.length;
  const languageCount = selectedLanguageIds.length;
  const active = isTranslationsFilterActive(statusCount, languageCount);
  const totalCount = statusCount + languageCount;

  const handleClearTrigger = useCallback(() => {
    onStatusIdsChange([]);
    onLanguageIdsChange([]);
  }, [onStatusIdsChange, onLanguageIdsChange]);

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
    setOpen(false);
  }, [onLanguageIdsChange]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearchTerm('');
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label="Translations"
          active={active}
          count={totalCount}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Translations filter"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-48"
        align="start"
        aria-label="Filter by translations (status, languages)"
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {statusCount > 0
              ? `Translations status (${statusCount})`
              : 'Translations status'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-48">
            {translationStatusOptions.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-sm">
                No results
              </p>
            ) : (
              translationStatusOptions.map((opt) => {
                const id = parseInt(opt.value, 10);
                const checked =
                  Number.isFinite(id) && selectedStatusIds.includes(id);
                return (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={checked}
                    onCheckedChange={() =>
                      Number.isFinite(id) && handleStatusToggle(id)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="truncate">{opt.label}</span>
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
            {statusCount > 0 && (
              <button
                type="button"
                className="hover:bg-accent text-muted-foreground flex w-full items-center gap-2 border-t px-3 py-2 text-sm"
                onClick={handleClearStatus}
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {languageCount > 0
              ? `Translations (${languageCount})`
              : 'Translations'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-0">
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
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
