import { useMemo, type ReactElement } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import {
  ActivityFlagIcon,
  ActivityFlagOverflowIcon,
  type ActivityFlagIconSize,
} from '@/components/activity/activities/ActivityFlagIcon';
import { cn } from '@/lib/utils';

export const ACTIVITY_FLAG_STACK_MAX_VISIBLE = 2;

/** Overlap between stacked avatars; compact uses the same ratio as default (-ml-0.5 on 24px). */
const STACK_OVERLAP_CLASS: Record<ActivityFlagIconSize, string | undefined> = {
  default: '-ml-0.5',
  compact: '-ml-[1.5px]',
};

function stackItemZIndex(
  index: number,
  visibleCount: number,
  kind: 'avatar' | 'overflow'
): number {
  if (kind === 'overflow') {
    return visibleCount + 1;
  }
  return visibleCount - index;
}

export type ActivityFlagStackItem = Pick<
  ActivityFlagResponse,
  'teamId' | 'assigneeId' | 'assigneeName' | 'assigneeFlagColour'
>;

/** One row per assignee (first team wins when duplicated). */
export function uniqueActivityFlagsByAssignee(
  flags: ReadonlyArray<ActivityFlagStackItem>
): ActivityFlagStackItem[] {
  const uniqueFlags = new Map<number, ActivityFlagStackItem>();
  flags.forEach((flag) => {
    if (!uniqueFlags.has(flag.assigneeId)) {
      uniqueFlags.set(flag.assigneeId, flag);
    }
  });
  return Array.from(uniqueFlags.values());
}

export type ActivityFlagAssigneeStackProps = {
  flags: ReadonlyArray<ActivityFlagStackItem>;
  maxVisible?: number;
  size?: ActivityFlagIconSize;
  /** When true, later flags in `flags` render leftmost (activity page header). */
  reverseStackOrder?: boolean;
  className?: string;
};

/**
 * Stacked assignee avatars for activity flags (max visible + overflow badge).
 */
export function ActivityFlagAssigneeStack({
  flags,
  maxVisible = ACTIVITY_FLAG_STACK_MAX_VISIBLE,
  size = 'default',
  reverseStackOrder = false,
  className,
}: ActivityFlagAssigneeStackProps): ReactElement | null {
  const assignedFlags = useMemo(
    () => uniqueActivityFlagsByAssignee(flags),
    [flags]
  );

  if (assignedFlags.length === 0) {
    return null;
  }

  const orderedFlags = reverseStackOrder
    ? [...assignedFlags].reverse()
    : assignedFlags;
  const visibleFlags = orderedFlags.slice(0, maxVisible);
  const overflowCount = Math.max(assignedFlags.length - maxVisible, 0);

  return (
    <div className={cn('flex items-center', className)}>
      {visibleFlags.map((flag, index) => (
        <span
          key={`${flag.teamId}:${flag.assigneeId}`}
          className={index > 0 ? STACK_OVERLAP_CLASS[size] : undefined}
          style={{
            zIndex: stackItemZIndex(index, visibleFlags.length, 'avatar'),
          }}
        >
          <ActivityFlagIcon
            assigneeName={flag.assigneeName}
            assigneeFlagColour={flag.assigneeFlagColour}
            size={size}
          />
        </span>
      ))}
      {overflowCount > 0 ? (
        <span
          className={
            visibleFlags.length > 0 ? STACK_OVERLAP_CLASS[size] : undefined
          }
          style={{
            zIndex: stackItemZIndex(0, visibleFlags.length, 'overflow'),
          }}
        >
          <ActivityFlagOverflowIcon extraCount={overflowCount} size={size} />
        </span>
      ) : null}
    </div>
  );
}

/** Comma-separated assignee names for tooltips. */
export function activityFlagAssigneeTooltip(
  flags: ReadonlyArray<ActivityFlagStackItem>
): string {
  return uniqueActivityFlagsByAssignee(flags)
    .map((flag) => flag.assigneeName)
    .join(', ');
}
