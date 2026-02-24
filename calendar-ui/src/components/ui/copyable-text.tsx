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

const minimalVariantClasses =
  'justify-start text-left p-0 min-h-0 h-auto gap-1.5 hover:bg-transparent active:bg-transparent';

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
  /**
   * - default: standard button look with hover highlight and padding.
   * - minimal: left-aligned, no hover highlight, no extra padding (e.g. for inline use in tables).
   */
  variant?: 'default' | 'minimal';
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
  variant = 'default',
}: CopyableTextProps) {
  const [showCopied, setShowCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), COPIED_FEEDBACK_DURATION_MS);
  }, [text]);

  const isMinimal = variant === 'minimal';

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
            className={cn(
              'group cursor-pointer font-normal',
              isMinimal ? minimalVariantClasses : 'h-auto gap-1.5',
              className
            )}
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
