import { Checkbox } from '@/components/ui/checkbox';

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
  );
}
