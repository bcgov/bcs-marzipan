import { X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/Table/tableConstants';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { cn } from '@/lib/utils';

import { FilterSearchableList } from './FilterSearchableList';

export interface TranslationFilterOption {
  value: string;
  label: string;
}

export interface TranslationStatusFilterOption {
  value: string;
  label: string;
}

export interface TranslationsFilterOverflowPanelProps {
  translationStatusOptions: TranslationStatusFilterOption[];
  translationOptions: TranslationFilterOption[];
  selectedStatusIds: number[];
  selectedLanguageIds: number[];
  onStatusIdsChange: (ids: number[]) => void;
  onLanguageIdsChange: (ids: number[]) => void;
}

export type TranslationsFilterProps = TranslationsFilterOverflowPanelProps;

function isTranslationsFilterActive(
  statusCount: number,
  languageCount: number
): boolean {
  return statusCount > 0 || languageCount > 0;
}

/**
 * Flattened panel for overflow only (status + languages in one view). No scroll/border wrapper.
 */
export function TranslationsFilterOverflowPanel({
  translationStatusOptions,
  translationOptions,
  selectedStatusIds,
  selectedLanguageIds,
  onStatusIdsChange,
  onLanguageIdsChange,
}: TranslationsFilterOverflowPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
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

  return (
    <div className="min-w-48 space-y-2 py-1">
      <PanelSectionLabel
        onClearAll={statusCount > 0 ? handleClearStatus : undefined}
      >
        Translations status
      </PanelSectionLabel>
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
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm',
                    'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      Number.isFinite(id) && handleStatusToggle(id)
                    }
                  />
                  <span className="truncate">{opt.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
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
      <PanelSectionLabel
        onClearAll={languageCount > 0 ? handleClearLanguages : undefined}
      >
        Translations
      </PanelSectionLabel>
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
    </div>
  );
}

function PanelSectionLabel({
  onClearAll,
  children,
}: {
  onClearAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2 px-2 py-1.5">
      <span className="text-muted-foreground text-xs font-normal uppercase">
        {children}
      </span>
      {onClearAll ? (
        <DropdownMenuItem
          asChild
          className="h-auto shrink-0 cursor-pointer gap-0 rounded-none p-0 text-xs font-normal focus:bg-transparent focus:text-inherit"
          onSelect={(e) => {
            e.preventDefault();
            onClearAll();
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearAll();
            }}
            className="text-primary focus-visible:ring-ring text-xs font-normal hover:underline focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Clear all filters in this section"
          >
            Clear all
          </button>
        </DropdownMenuItem>
      ) : null}
    </div>
  );
}

/**
 * SubTrigger-based dropdown content for use in ResponsiveFilterRow (inline or overflow).
 * Renders "Translations status" and "Translations" as submenus.
 */
export function TranslationsFilterDropdownContent({
  translationStatusOptions,
  translationOptions,
  selectedStatusIds,
  selectedLanguageIds,
  onStatusIdsChange,
  onLanguageIdsChange,
}: TranslationsFilterOverflowPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
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

  return (
    <>
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
    </>
  );
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

  const statusCount = selectedStatusIds.length;
  const languageCount = selectedLanguageIds.length;
  const active = isTranslationsFilterActive(statusCount, languageCount);
  const totalCount = statusCount + languageCount;

  const handleClearTrigger = useCallback(() => {
    onStatusIdsChange([]);
    onLanguageIdsChange([]);
  }, [onStatusIdsChange, onLanguageIdsChange]);

  const handleOpenChange = useCallback((_nextOpen: boolean) => {
    setOpen(_nextOpen);
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
        className={cn(FILTER_PANEL_MIN_WIDTH, 'min-w-48')}
        align="start"
        aria-label="Filter by translations (status, languages)"
      >
        <TranslationsFilterDropdownContent
          translationStatusOptions={translationStatusOptions}
          translationOptions={translationOptions}
          selectedStatusIds={selectedStatusIds}
          selectedLanguageIds={selectedLanguageIds}
          onStatusIdsChange={onStatusIdsChange}
          onLanguageIdsChange={onLanguageIdsChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
