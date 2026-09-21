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

const subtleVariantClasses =
  'inline h-auto min-h-0 justify-start gap-0 p-0 font-inherit text-inherit hover:bg-transparent hover:text-(--fluent-primary) active:bg-transparent';

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
   * - subtle: plain text with hover colour, no icon; tooltip describes copy on hover.
   */
  variant?: 'default' | 'minimal' | 'subtle';
  /** Content shown in the tooltip after copying. Defaults to "Copied". */
  copiedTooltipContent?: ReactNode;
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
  copiedTooltipContent = 'Copied',
}: CopyableTextProps) {
  const [showCopied, setShowCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), COPIED_FEEDBACK_DURATION_MS);
  }, [text]);

  const isMinimal = variant === 'minimal';
  const isSubtle = variant === 'subtle';

  return (
    <TooltipProvider delayDuration={isSubtle ? 400 : 0}>
      <Tooltip
        open={showCopied ? true : undefined}
        onOpenChange={(open) => {
          if (!open) setShowCopied(false);
        }}
      >
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void copy();
            }}
            className={cn(
              'group/copyable cursor-pointer font-normal',
              isSubtle
                ? subtleVariantClasses
                : isMinimal
                  ? minimalVariantClasses
                  : 'h-auto gap-1.5',
              className
            )}
            title={isSubtle ? undefined : copyLabel}
            aria-label={copyLabel}
          >
            {children ?? text}
            {!isSubtle && (
              <Copy
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-opacity',
                  showIconAlways
                    ? 'opacity-100'
                    : 'opacity-0 group-hover/copyable:opacity-100'
                )}
                aria-hidden
              />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={6}>
          {showCopied ? copiedTooltipContent : copyLabel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
