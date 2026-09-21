import { Checkbox } from '@/components/ui/checkbox';

import { GRID_A_SELECT_CHECKBOX_ROW_ALIGN_CLASS } from '../selectColumnLayout';

export interface SelectCheckboxCellProps {
  /** Shown in the accessible label so screen readers identify the row. */
  activityLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Dedicated bulk-selection checkbox column used by Grid A. */
export function SelectCheckboxCell({
  activityLabel,
  checked,
  onCheckedChange,
}: SelectCheckboxCellProps) {
  return (
    <div className={GRID_A_SELECT_CHECKBOX_ROW_ALIGN_CLASS}>
      <span
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
        className="inline-flex size-6 items-center justify-center"
      >
        <Checkbox
          aria-label={`Select activity ${activityLabel}`}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
      </span>
    </div>
  );
}
