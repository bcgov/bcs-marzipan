import {
  CHIP_LABEL_CLASSES,
  CHIP_LEAD_BADGE_CLASSES,
} from './combobox-chip-styles';
import {
  LeadableChipReadOnlyJointBadge,
  LeadableChipRoleBadge,
  type LeadableChipNonLeadPromoteBadge,
} from './leadable-chip-role-badge';

export type LeadableChipLabelRowProps = {
  displayLabel: string;
  isLead: boolean;
  readOnly: boolean;
  /** When set, enables lead badge and optional non-lead promote control. */
  onSetLead?: () => void;
  showJointBadge?: boolean;
  nonLeadPromoteBadge?: LeadableChipNonLeadPromoteBadge;
  setLeadMenuLabel?: string;
  roleMenuOpen?: boolean;
  onRoleMenuOpenChange?: (open: boolean) => void;
};

export function LeadableChipLabelRow({
  displayLabel,
  isLead,
  readOnly,
  onSetLead,
  showJointBadge = false,
  nonLeadPromoteBadge,
  setLeadMenuLabel = 'Set as lead',
  roleMenuOpen = false,
  onRoleMenuOpenChange,
}: LeadableChipLabelRowProps) {
  const showLeadableChrome = onSetLead != null || (readOnly && showJointBadge);

  if (!showLeadableChrome) {
    return (
      <span className={CHIP_LABEL_CLASSES} title={displayLabel}>
        {displayLabel}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className={CHIP_LABEL_CLASSES} title={displayLabel}>
        {displayLabel}
      </span>
      {isLead && onSetLead != null && (
        <span className={CHIP_LEAD_BADGE_CLASSES}>Lead</span>
      )}
      {!isLead && readOnly && showJointBadge && (
        <LeadableChipReadOnlyJointBadge displayName={displayLabel} />
      )}
      {!readOnly &&
        !isLead &&
        nonLeadPromoteBadge != null &&
        onSetLead != null &&
        onRoleMenuOpenChange != null && (
          <LeadableChipRoleBadge
            variant={nonLeadPromoteBadge}
            displayName={displayLabel}
            setLeadMenuLabel={setLeadMenuLabel}
            onSetLead={onSetLead}
            open={roleMenuOpen}
            onOpenChange={onRoleMenuOpenChange}
          />
        )}
    </span>
  );
}
