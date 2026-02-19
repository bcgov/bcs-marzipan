import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import {
  SortDropdown,
  type SortColumnConfig,
} from '@/components/Table/SortDropdown';
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
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterCheckboxDropdown } from '@/components/users/FilterCheckboxDropdown';
import { cn } from '@/lib/utils';

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
 * Uses Shad/cn components only.
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

  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);
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
  const handleTeamClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onTeamIdsChange([]);
    },
    [onTeamIdsChange]
  );
  const handleTeamSelectAndClose = useCallback(
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

  return (
    <div
      className={className}
      role="search"
      aria-label="Filter users by team, job, role, and keyword"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={teamPopoverOpen} onOpenChange={setTeamPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={hasTeamSelection ? 'default' : 'outline'}
                size="sm"
                className="min-w-[100px] justify-between gap-1 font-normal"
              >
                <span className="truncate">
                  {hasTeamSelection ? `Team (${teamIds.length})` : 'Team'}
                </span>
                {hasTeamSelection ? (
                  <button
                    type="button"
                    onClick={handleTeamClear}
                    className="ml-1 rounded p-0.5 hover:bg-white/20"
                    aria-label="Clear Team filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
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
                          onSelect={() => handleTeamSelectAndClose(opt.value)}
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
            </PopoverContent>
          </Popover>
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
              type="search"
              placeholder="Search by name, email, username..."
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              className="pl-8"
              aria-label="Keyword search"
            />
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
