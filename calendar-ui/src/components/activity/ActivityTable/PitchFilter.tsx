import { useCallback, type MouseEvent } from 'react';

import {
  DEFAULT_PITCH_DATE_RANGE,
  type ActivityFilterState,
  type PitchDateFilter,
} from './activityFilterState';
import { FilterCheckboxItem } from './FilterCheckboxItem';
import { FilterSectionLabel } from './FilterSectionLabel';
import {
  isDateRangeActive,
  ScheduledDateRangeFields,
} from './ScheduledDateRangeFields';

export interface PitchFilterPanelProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
  pitchRequiredStatusOptions: { value: string; label: string }[];
}

export type PitchFilterProps = PitchFilterPanelProps;

function _isPitchFilterActive(
  pitchRequiredStatusNames: string[],
  pitchDateFilter: PitchDateFilter
): boolean {
  if (pitchRequiredStatusNames.length > 0) return true;
  if (pitchDateFilter.kind !== 'any') return true;
  return false;
}

export function PitchFilterPanel({
  filterState,
  onFilterStateChange,
  pitchRequiredStatusOptions,
}: PitchFilterPanelProps) {
  const { pitchRequiredStatusNames, pitchDateFilter } = filterState;

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

  const handleClearDatesClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handlePitchDateRangeChange({ ...DEFAULT_PITCH_DATE_RANGE });
    },
    [handlePitchDateRangeChange]
  );

  return (
    <>
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
          <FilterCheckboxItem
            key={opt.value}
            checked={pitchRequiredStatusNames.includes(opt.value)}
            onCheckedChange={() => handlePitchStatusToggle(opt.value)}
          >
            {opt.label}
          </FilterCheckboxItem>
        ))
      )}
      <div className="border-t" role="separator" />
      <FilterSectionLabel
        onClearAll={
          pitchDateFilter.kind !== 'any' ? handleClearPitchDate : undefined
        }
      >
        Pitch date
      </FilterSectionLabel>
      <FilterCheckboxItem
        checked={pitchDateFilter.kind === 'not_scheduled'}
        onCheckedChange={handlePitchDateNotScheduledChange}
      >
        Not scheduled for panel
      </FilterCheckboxItem>
      <FilterCheckboxItem
        checked={pitchDateFilter.kind === 'scheduled'}
        onCheckedChange={(checked) => handlePitchDateScheduledChange(checked)}
      >
        Scheduled for panel
      </FilterCheckboxItem>

      {pitchDateFilter.kind === 'scheduled' && (
        <div className="border-t px-2 pt-2 pb-2">
          <div className="mb-2 flex w-full items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-normal uppercase">
              Panel date
            </span>
            {isDateRangeActive(pitchDateFilter.dateRange) ? (
              <button
                type="button"
                onClick={handleClearDatesClick}
                className="text-primary focus-visible:ring-ring shrink-0 text-xs font-normal hover:underline focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Clear panel date range"
              >
                Clear dates
              </button>
            ) : null}
          </div>
          <ScheduledDateRangeFields
            value={pitchDateFilter.dateRange}
            onChange={handlePitchDateRangeChange}
            endNoDateLabel="No end date (all upcoming pitches)"
            showClearButton={false}
          />
        </div>
      )}
    </>
  );
}

// export function PitchFilter({
//   filterState,
//   onFilterStateChange,
//   pitchRequiredStatusOptions,
// }: PitchFilterProps) {
//   const { pitchRequiredStatusNames, pitchDateFilter } = filterState;
//   const active = useMemo(
//     () => isPitchFilterActive(pitchRequiredStatusNames, pitchDateFilter),
//     [pitchRequiredStatusNames, pitchDateFilter]
//   );
//   const pitchCount = useMemo(
//     () =>
//       pitchRequiredStatusNames.length +
//       (pitchDateFilter.kind !== 'any' ? 1 : 0),
//     [pitchRequiredStatusNames.length, pitchDateFilter.kind]
//   );
//   const handleClearTrigger = useCallback(() => {
//     onFilterStateChange({
//       ...filterState,
//       pitchRequiredStatusNames: [],
//       pitchDateFilter: { kind: 'any' },
//     });
//   }, [filterState, onFilterStateChange]);

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <FilterTrigger
//           label="Pitch"
//           active={active}
//           count={pitchCount}
//           onClear={handleClearTrigger}
//           clearAriaLabel="Clear Pitch filter"
//         />
//       </DropdownMenuTrigger>
//       <DropdownMenuContent
//         className={cn(
//           FILTER_PANEL_MIN_WIDTH,
//           'max-h-[min(70vh,400px)] min-w-[280px] overflow-y-auto'
//         )}
//         align="start"
//       >
//         <PitchFilterPanel
//           filterState={filterState}
//           onFilterStateChange={onFilterStateChange}
//           pitchRequiredStatusOptions={pitchRequiredStatusOptions}
//         />
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
