import { Copy } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

const COPIED_FEEDBACK_DURATION_MS = 1500;

type CopyableTextProps = {
  /** Text to copy to the clipboard. */
  text: string;
  /** Optional label for the copy action (tooltip / accessibility). */
  copyLabel?: string;
  /** Content to show; defaults to `text`. Use to show different text or custom markup. */
  children?: ReactNode;
  /** Optional class name for the trigger button. */
  className?: string;
  /** Show copy icon always instead of only on hover. */
  showIconAlways?: boolean;
};

/**
 * Renders text with a copy icon; click copies `text` to the clipboard and shows a
 * temporary "Copied" tooltip. Reusable for any copy-to-clipboard text (e.g. IDs, codes).
 */
export function CopyableText({
  text,
  copyLabel = 'Copy',
  children,
  className,
  showIconAlways = false,
}: CopyableTextProps) {
  const [showCopied, setShowCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), COPIED_FEEDBACK_DURATION_MS);
  }, [text]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip
        open={showCopied}
        onOpenChange={(open) => {
          if (!open) setShowCopied(false);
        }}
      >
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void copy()}
            className={cn('group h-auto gap-1.5 font-normal', className)}
            title={copyLabel}
            aria-label={copyLabel}
          >
            {children ?? text}
            <Copy
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-opacity',
                showIconAlways
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              )}
              aria-hidden
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={6}>
          Copied
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
