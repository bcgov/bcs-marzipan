import { useCallback, useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';

import {
  DEFAULT_PITCH_DATE_RANGE,
  type ActivityFilterState,
  type PitchDateFilter,
} from './activityFilterState';
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
  if (
    pitchDateFilter.kind === 'scheduled' &&
    (pitchDateFilter.dateRange.startDate !== '' ||
      pitchDateFilter.dateRange.endDate !== '' ||
      pitchDateFilter.dateRange.noStartDate ||
      pitchDateFilter.dateRange.noEndDate)
  ) {
    return true;
  }
  return false;
}

const PITCH_DATE_ANY = '';
const PITCH_DATE_NOT_SCHEDULED = 'not_scheduled';
const PITCH_DATE_SCHEDULED = 'scheduled';

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

  const pitchDateRadioValue =
    pitchDateFilter.kind === 'any' ? PITCH_DATE_ANY : pitchDateFilter.kind;

  const handleClearTrigger = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      pitchRequiredStatusNames: [],
      pitchDateFilter: { kind: 'any' },
    });
  }, [filterState, onFilterStateChange]);

  const handleSetPitchDateAny = useCallback(() => {
    onFilterStateChange({
      ...filterState,
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

  const handlePitchDateRadioChange = useCallback(
    (value: string) => {
      const currentKind = pitchDateFilter.kind;

      if (value === currentKind) {
        onFilterStateChange({
          ...filterState,
          pitchDateFilter: { kind: 'any' },
        });
        return;
      }

      if (value === PITCH_DATE_NOT_SCHEDULED) {
        onFilterStateChange({
          ...filterState,
          pitchDateFilter: { kind: 'not_scheduled' },
        });
        return;
      }

      if (value === PITCH_DATE_SCHEDULED) {
        onFilterStateChange({
          ...filterState,
          pitchDateFilter: {
            kind: 'scheduled',
            dateRange: { ...DEFAULT_PITCH_DATE_RANGE },
          },
        });
        return;
      }
    },
    [filterState, onFilterStateChange, pitchDateFilter.kind]
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label="Pitch"
          active={active}
          count={1}
          onClear={handleClearTrigger}
          clearAriaLabel="Clear Pitch filter"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-[min(70vh,400px)] min-w-[280px] overflow-y-auto"
        align="start"
      >
        <DropdownMenuLabel className="text-foreground font-normal">
          Pitch status
        </DropdownMenuLabel>
        {pitchRequiredStatusOptions.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-center text-sm">
            No options
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
        <DropdownMenuLabel className="text-foreground font-normal">
          Pitch date
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={pitchDateRadioValue}
          onValueChange={handlePitchDateRadioChange}
        >
          <DropdownMenuRadioItem
            value={PITCH_DATE_NOT_SCHEDULED}
            onSelect={(e) => {
              if (pitchDateFilter.kind === 'not_scheduled') {
                e.preventDefault();
                handleSetPitchDateAny();
              }
            }}
          >
            Not scheduled for panel
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value={PITCH_DATE_SCHEDULED}
            onSelect={(e) => {
              if (pitchDateFilter.kind === 'scheduled') {
                e.preventDefault();
                handleSetPitchDateAny();
              }
            }}
          >
            Scheduled for panel
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

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
