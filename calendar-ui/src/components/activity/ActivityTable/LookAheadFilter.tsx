import { useCallback, useMemo } from 'react';

import type { ActivityFilterState } from '@corpcal/shared';
import { lookAheadStatusOptions } from '@/constants/form-options';
import {
  rowsToSectionOptions,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';

import { FilterCheckboxItem } from './FilterCheckboxItem';
import { FilterSectionLabel } from './FilterSectionLabel';

export interface LookAheadFilterPanelProps {
  filterState: ActivityFilterState;
  onFilterStateChange: (state: ActivityFilterState) => void;
}

export type LookAheadFilterProps = LookAheadFilterPanelProps;

function _isLookAheadFilterActive(
  lookAheadStatusValues: string[],
  lookAheadSectionValues: string[]
): boolean {
  return lookAheadStatusValues.length > 0 || lookAheadSectionValues.length > 0;
}

export function LookAheadFilterPanel({
  filterState,
  onFilterStateChange,
}: LookAheadFilterPanelProps) {
  const { lookAheadStatusValues, lookAheadSectionValues } = filterState;
  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const lookAheadSectionOptions = useMemo(
    () => rowsToSectionOptions(lookAheadSectionRows),
    [lookAheadSectionRows]
  );

  const handleStatusToggle = useCallback(
    (value: string) => {
      const next = lookAheadStatusValues.includes(value)
        ? lookAheadStatusValues.filter((v) => v !== value)
        : [...lookAheadStatusValues, value];
      onFilterStateChange({
        ...filterState,
        lookAheadStatusValues: next,
      });
    },
    [filterState, onFilterStateChange, lookAheadStatusValues]
  );

  const handleSectionToggle = useCallback(
    (value: string) => {
      const next = lookAheadSectionValues.includes(value)
        ? lookAheadSectionValues.filter((v) => v !== value)
        : [...lookAheadSectionValues, value];
      onFilterStateChange({
        ...filterState,
        lookAheadSectionValues: next,
      });
    },
    [filterState, onFilterStateChange, lookAheadSectionValues]
  );

  const handleClearLookAheadStatus = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      lookAheadStatusValues: [],
    });
  }, [filterState, onFilterStateChange]);

  const handleClearLookAheadSection = useCallback(() => {
    onFilterStateChange({
      ...filterState,
      lookAheadSectionValues: [],
    });
  }, [filterState, onFilterStateChange]);

  return (
    <>
      <FilterSectionLabel
        onClearAll={
          lookAheadStatusValues.length > 0
            ? handleClearLookAheadStatus
            : undefined
        }
      >
        LA status
      </FilterSectionLabel>
      {lookAheadStatusOptions.map((opt) => (
        <FilterCheckboxItem
          key={opt.value}
          checked={lookAheadStatusValues.includes(opt.value)}
          onCheckedChange={() => handleStatusToggle(opt.value)}
        >
          {opt.label}
        </FilterCheckboxItem>
      ))}
      <div className="my-3 border-t" role="separator" />
      <FilterSectionLabel
        onClearAll={
          lookAheadSectionValues.length > 0
            ? handleClearLookAheadSection
            : undefined
        }
      >
        LA section
      </FilterSectionLabel>
      {lookAheadSectionOptions.map((opt) => (
        <FilterCheckboxItem
          key={opt.value}
          checked={lookAheadSectionValues.includes(opt.value)}
          onCheckedChange={() => handleSectionToggle(opt.value)}
        >
          {opt.legendColor ? (
            <span
              aria-hidden="true"
              className="border-border mr-1 inline-block h-3.5 w-3.5 shrink-0 rounded-sm border"
              style={{ backgroundColor: opt.legendColor }}
            />
          ) : null}
          <span className="truncate">{opt.label}</span>
        </FilterCheckboxItem>
      ))}
    </>
  );
}

// export function LookAheadFilter({
//   filterState,
//   onFilterStateChange,
// }: LookAheadFilterProps) {
//   const { lookAheadStatusValues, lookAheadSectionValues } = filterState;
//   const active = useMemo(
//     () =>
//       isLookAheadFilterActive(lookAheadStatusValues, lookAheadSectionValues),
//     [lookAheadStatusValues, lookAheadSectionValues]
//   );
//   const lookAheadCount =
//     lookAheadStatusValues.length + lookAheadSectionValues.length;
//   const handleClearTrigger = useCallback(() => {
//     onFilterStateChange({
//       ...filterState,
//       lookAheadStatusValues: [],
//       lookAheadSectionValues: [],
//     });
//   }, [filterState, onFilterStateChange]);

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <FilterTrigger
//           label="Look Ahead"
//           active={active}
//           count={lookAheadCount}
//           onClear={handleClearTrigger}
//           clearAriaLabel="Clear Look Ahead filter"
//         />
//       </DropdownMenuTrigger>
//       <DropdownMenuContent
//         className={cn(
//           FILTER_PANEL_MIN_WIDTH,
//           'max-h-[min(70vh,400px)] min-w-[280px] overflow-y-auto'
//         )}
//         align="start"
//       >
//         <LookAheadFilterPanel
//           filterState={filterState}
//           onFilterStateChange={onFilterStateChange}
//         />
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
