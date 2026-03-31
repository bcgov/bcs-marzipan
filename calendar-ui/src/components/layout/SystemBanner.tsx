import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

import type { BannerSettings } from '@corpcal/shared/api/types';
import { sanitizeBannerHtml } from '@/lib/banner-html';
import { cn } from '@/lib/utils';

interface SystemBannerProps {
  banner: BannerSettings;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export function SystemBanner({
  banner,
  onDismiss,
  className,
  compact = false,
}: SystemBannerProps) {
  const showDismiss = banner.isDismissible && typeof onDismiss === 'function';
  const Icon =
    banner.variant === 'warning'
      ? AlertTriangle
      : banner.variant === 'success'
        ? CheckCircle
        : Info;
  const sanitizedContent = sanitizeBannerHtml(banner.content);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('w-full', className)}
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor,
      }}
    >
      <div
        className={cn(
          'flex items-center gap-3 py-3',
          compact ? 'px-4' : 'px-4 md:px-20'
        )}
      >
        <div aria-hidden className="shrink-0 rounded-full bg-black/10 p-1">
          <Icon className="h-4 w-4" />
        </div>

        <div
          className="min-w-0 flex-1 text-sm leading-6 whitespace-pre-wrap [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:not(:first-child)]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {showDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="shrink-0 rounded-sm p-1 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ outlineColor: banner.textColor, color: banner.textColor }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
