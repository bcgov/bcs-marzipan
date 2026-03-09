import { useCallback, useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import {
  DEFAULT_PITCH_DATE_RANGE,
  type ActivityFilterState,
  type PitchDateFilter,
} from './activityFilterState';
import { FilterSectionLabel } from './FilterSectionLabel';
import { ScheduledDateRangeFields } from './ScheduledDateRangeFields';

export interface PitchFilterProps {
  /** Full filter state; only pitch-related fields are read/updated. */
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
  pitchRequiredStatusOptions: { value: string; label: string }[];
}

function isPitchFilterActive(
  pitchRequiredStatusNames: string[],
  pitchDateFilter: PitchDateFilter
): boolean {
  if (pitchRequiredStatusNames.length > 0) return true;
  if (pitchDateFilter.kind !== 'any') return true;
  return false;
}

export function PitchFilter({
  filterState,
  onFilterStateChange,
  pitchRequiredStatusOptions,
}: PitchFilterProps) {
  const { pitchRequiredStatusNames, pitchDateFilter } = filterState;

  const active = useMemo(
    () => isPitchFilterActive(pitchRequiredStatusNames, pitchDateFilter),
    [pitchRequiredStatusNames, pitchDateFilter]
  );

  const pitchCount = useMemo(
    () =>
      pitchRequiredStatusNames.length +
      (pitchDateFilter.kind !== 'any' ? 1 : 0),
    [pitchRequiredStatusNames.length, pitchDateFilter.kind]
  );

  const handleClearTrigger = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      pitchRequiredStatusNames: [],
      pitchDateFilter: { kind: 'any' },
    });
  }, [filterState, onFilterStateChange]);

  const handlePitchStatusToggle = useCallback(
    (value: string) => {
      const next = pitchRequiredStatusNames.includes(value)
        ? pitchRequiredStatusNames.filter((v) => v !== value)
        : [...pitchRequiredStatusNames, value];
      onFilterStateChange({
        ...filterState,
        pitchRequiredStatusNames: next,
      });
    },
    [filterState, onFilterStateChange, pitchRequiredStatusNames]
  );

  const handlePitchDateNotScheduledChange = useCallback(
    (checked: boolean) => {
      onFilterStateChange({
        ...filterState,
        pitchDateFilter: checked ? { kind: 'not_scheduled' } : { kind: 'any' },
      });
    },
    [filterState, onFilterStateChange]
  );

  const handlePitchDateScheduledChange = useCallback(
    (checked: boolean) => {
      onFilterStateChange({
        ...filterState,
        pitchDateFilter: checked
          ? { kind: 'scheduled', dateRange: { ...DEFAULT_PITCH_DATE_RANGE } }
          : { kind: 'any' },
      });
    },
    [filterState, onFilterStateChange]
  );

  const handlePitchDateRangeChange = useCallback(
    (dateRange: typeof DEFAULT_PITCH_DATE_RANGE) => {
      if (pitchDateFilter.kind !== 'scheduled') return;
      onFilterStateChange({
        ...filterState,
        pitchDateFilter: { kind: 'scheduled', dateRange },
      });
    },
    [filterState, onFilterStateChange, pitchDateFilter.kind]
  );

  const handleClearPitchStatus = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      pitchRequiredStatusNames: [],
    });
  }, [filterState, onFilterStateChange]);

  const handleClearPitchDate = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      pitchDateFilter: { kind: 'any' },
    });
  }, [filterState, onFilterStateChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label="Pitch"
          active={active}
          count={pitchCount}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Pitch filter"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-[min(70vh,400px)] min-w-[280px] overflow-y-auto"
        align="start"
      >
        <FilterSectionLabel
          onClearAll={
            pitchRequiredStatusNames.length > 0
              ? handleClearPitchStatus
              : undefined
          }
        >
          Pitch status
        </FilterSectionLabel>
        {pitchRequiredStatusOptions.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-center text-sm">
            No results
          </p>
        ) : (
          pitchRequiredStatusOptions.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={pitchRequiredStatusNames.includes(opt.value)}
              onCheckedChange={() => handlePitchStatusToggle(opt.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate">{opt.label}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
        <DropdownMenuSeparator />
        <FilterSectionLabel
          onClearAll={
            pitchDateFilter.kind !== 'any' ? handleClearPitchDate : undefined
          }
        >
          Pitch date
        </FilterSectionLabel>
        <DropdownMenuCheckboxItem
          checked={pitchDateFilter.kind === 'not_scheduled'}
          onCheckedChange={handlePitchDateNotScheduledChange}
          onSelect={(e) => e.preventDefault()}
        >
          Not scheduled for panel
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={pitchDateFilter.kind === 'scheduled'}
          onCheckedChange={(checked) =>
            handlePitchDateScheduledChange(checked === true)
          }
          onSelect={(e) => e.preventDefault()}
        >
          Scheduled for panel
        </DropdownMenuCheckboxItem>

        {pitchDateFilter.kind === 'scheduled' && (
          <div className="border-t px-2 pt-2 pb-2">
            <ScheduledDateRangeFields
              value={pitchDateFilter.dateRange}
              onChange={handlePitchDateRangeChange}
              endNoDateLabel="No end date (all upcoming pitches)"
              clearButtonLabel="Clear dates"
            />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
