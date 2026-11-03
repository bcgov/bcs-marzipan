import { useCallback, type SyntheticEvent } from 'react';

import { cn } from '../../lib/utils';
import {
  CHIP_OUTLINE_ROLE_BADGE_CLASSES,
  CHIP_OUTLINE_ROLE_BADGE_INTERACTIVE_CLASSES,
} from './combobox-chip-styles';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type LeadableChipNonLeadPromoteBadge = 'joint' | 'set-lead';

function badgeLabel(variant: LeadableChipNonLeadPromoteBadge): string {
  return variant === 'joint' ? 'Joint' : 'Set lead';
}

type LeadableChipRoleBadgeProps = {
  variant: LeadableChipNonLeadPromoteBadge;
  displayName: string;
  setLeadMenuLabel: string;
  onSetLead: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeadableChipRoleBadge({
  variant,
  displayName,
  setLeadMenuLabel,
  onSetLead,
  open,
  onOpenChange,
}: LeadableChipRoleBadgeProps) {
  const label = badgeLabel(variant);

  const handleConfirm = useCallback(() => {
    onSetLead();
    onOpenChange(false);
  }, [onSetLead, onOpenChange]);

  const stopBubble = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={CHIP_OUTLINE_ROLE_BADGE_INTERACTIVE_CLASSES}
          aria-label={`${label} options for ${displayName}`}
          aria-haspopup="dialog"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={stopBubble}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-auto p-1"
        onPointerDown={stopBubble}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <button
          type="button"
          className={cn(
            'hover:bg-accent focus:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm focus:outline-none'
          )}
          onClick={(e) => {
            stopBubble(e);
            handleConfirm();
          }}
        >
          {setLeadMenuLabel}
        </button>
      </PopoverContent>
    </Popover>
  );
}

type LeadableChipReadOnlyJointBadgeProps = {
  displayName: string;
};

export function LeadableChipReadOnlyJointBadge({
  displayName,
}: LeadableChipReadOnlyJointBadgeProps) {
  return (
    <span
      className={CHIP_OUTLINE_ROLE_BADGE_CLASSES}
      aria-label={`Joint organization: ${displayName}`}
    >
      Joint
    </span>
  );
}
