import { formatActivityDisplayIdForUi } from '@corpcal/shared';
import { CopyableText } from '@/components/ui/copyable-text';
import { cn } from '@/lib/utils';

/** Fits `PREFIX-NNNNNN` with up to six prefix characters (tabular digits). */
export const ACTIVITY_DISPLAY_ID_UI_WIDTH_CLASS =
  'inline-block w-[13ch] shrink-0 text-left tabular-nums';

export interface ActivityDisplayIdCopyProps {
  displayId: string;
  variant?: 'default' | 'minimal' | 'subtle';
  className?: string;
  copyLabel?: string;
}

/**
 * Copyable activity ID with a compact UI label (last six digits of the numeric segment).
 */
export function ActivityDisplayIdCopy({
  displayId,
  variant = 'subtle',
  className,
  copyLabel = 'Copy activity ID',
}: ActivityDisplayIdCopyProps) {
  const uiLabel = formatActivityDisplayIdForUi(displayId);

  return (
    <span title={displayId} className={ACTIVITY_DISPLAY_ID_UI_WIDTH_CLASS}>
      <CopyableText
        text={displayId}
        copyLabel={copyLabel}
        variant={variant}
        copiedTooltipContent="Activity ID copied"
        className={cn('block w-full text-left', className)}
      >
        {uiLabel}
      </CopyableText>
    </span>
  );
}
