import { Check, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  SortDropdown,
  type SortColumnConfig,
} from '@/components/table/SortDropdown';
import { FILTER_PANEL_MIN_WIDTH } from '@/components/table/tableConstants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { FilterCheckboxDropdown } from '@/components/users/FilterCheckboxDropdown';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { cn } from '@/lib/utils';

const KEYWORD_DEBOUNCE_MS = 400;

const USER_SORT_COLUMNS: SortColumnConfig[] = [
  { id: 'name', label: 'Name', defaultDirection: 'asc' },
  { id: 'role', label: 'Role', defaultDirection: 'asc' },
  { id: 'lastUpdated', label: 'Last updated', defaultDirection: 'desc' },
];

export interface FilterOption {
  value: string;
  label: string;
}

export interface UserManagementFiltersState {
  keyword: string;
  teamIds: number[];
  roleIds: number[];
}

interface UserManagementFiltersProps {
  keyword: string;
  teamIds: number[];
  roleIds: number[];
  onKeywordChange: (value: string) => void;
  onTeamIdsChange: (value: number[]) => void;
  onRoleIdsChange: (value: number[]) => void;
  teamOptions: FilterOption[];
  roleOptions: FilterOption[];
  /** Placeholder for Job filter (disabled until AD integration). */
  jobOptions?: FilterOption[];
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
  defaultSortKey: string;
  defaultSortDirection: 'asc' | 'desc';
  className?: string;
}

/**
 * Filter bar for the Users table: Team (combobox), Role (checkbox dropdown), Job (disabled), and keyword search.
 */
export function UserManagementFilters({
  keyword,
  teamIds,
  roleIds,
  onKeywordChange,
  onTeamIdsChange,
  onRoleIdsChange,
  teamOptions,
  roleOptions,
  jobOptions = [],
  sortKey,
  sortDirection,
  onSortChange,
  defaultSortKey,
  defaultSortDirection,
  className,
}: UserManagementFiltersProps) {
  const teamSelectedValues = teamIds.map(String);
  const handleTeamSelect = useCallback(
    (value: string) => {
      const id = parseInt(value, 10);
      if (Number.isNaN(id)) return;
      if (teamIds.includes(id)) {
        onTeamIdsChange(teamIds.filter((t) => t !== id));
      } else {
        onTeamIdsChange([...teamIds, id].sort((a, b) => a - b));
      }
    },
    [teamIds, onTeamIdsChange]
  );

  const [teamSearch, setTeamSearch] = useState('');
  const filteredTeamOptions = useMemo(() => {
    if (!teamSearch.trim()) return teamOptions;
    const q = teamSearch.toLowerCase();
    return teamOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [teamOptions, teamSearch]);
  const selectedTeamOptions = useMemo(
    () => teamOptions.filter((opt) => teamSelectedValues.includes(opt.value)),
    [teamOptions, teamSelectedValues]
  );
  const hasTeamSelection = teamIds.length > 0;
  const handleTeamSelectItem = useCallback(
    (value: string) => {
      handleTeamSelect(value);
      setTeamSearch('');
    },
    [handleTeamSelect]
  );

  const roleSelectedValues = roleIds.map(String);
  const handleRoleIdsChange = useCallback(
    (values: string[]) => {
      onRoleIdsChange(
        values.map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n))
      );
    },
    [onRoleIdsChange]
  );

  const hasDropdownFiltersActive = teamIds.length > 0 || roleIds.length > 0;
  const handleClearDropdownFilters = useCallback(() => {
    onTeamIdsChange([]);
    onRoleIdsChange([]);
  }, [onTeamIdsChange, onRoleIdsChange]);

  const [searchInput, setSearchInput] = useState(keyword);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        onKeywordChange(value);
      }, KEYWORD_DEBOUNCE_MS);
    },
    [onKeywordChange]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    onKeywordChange('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [onKeywordChange]);
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={className}
      role="search"
      aria-label="Filter users by team, job, role, and keyword"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FilterTrigger
                label="Team"
                active={hasTeamSelection}
                count={teamIds.length}
                onClear={() => onTeamIdsChange([])}
                clearAriaLabel="Clear Team filter"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn(FILTER_PANEL_MIN_WIDTH, 'w-72 p-0')}
              align="start"
            >
              <Command className="rounded-md border-0" shouldFilter={false}>
                <CommandInput
                  placeholder="Search teams..."
                  value={teamSearch}
                  onValueChange={setTeamSearch}
                />
                {selectedTeamOptions.length > 0 && (
                  <div className="border-b px-2 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeamOptions.map((opt) => (
                        <Badge
                          key={opt.value}
                          variant="secondary"
                          className="cursor-pointer gap-1 pr-1 text-xs"
                          onClick={() => handleTeamSelect(opt.value)}
                        >
                          {opt.label}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <CommandList>
                  <CommandEmpty>No teams found.</CommandEmpty>
                  <CommandGroup>
                    {filteredTeamOptions.map((opt) => {
                      const isSelected = teamSelectedValues.includes(opt.value);
                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.value}
                          onSelect={() => handleTeamSelectItem(opt.value)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {opt.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DropdownMenuContent>
          </DropdownMenu>
          <FilterCheckboxDropdown
            label="Job"
            options={jobOptions}
            selectedValues={[]}
            onChange={() => {}}
            disabled
          />
          <FilterCheckboxDropdown
            label="Role"
            options={roleOptions}
            selectedValues={roleSelectedValues}
            onChange={handleRoleIdsChange}
          />
          {hasDropdownFiltersActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="animate-in fade-in ml-4 duration-200"
              onClick={handleClearDropdownFilters}
              aria-label="Clear all filters"
            >
              Clear all filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-md min-w-[240px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by name, email, username..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-8 pl-8"
              aria-label="Keyword search"
            />
            {searchInput && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <SortDropdown
            columns={USER_SORT_COLUMNS}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            defaultSortKey={defaultSortKey}
            defaultSortDirection={defaultSortDirection}
            ariaLabel="Sort by"
          />
        </div>
      </div>
    </div>
  );
}
