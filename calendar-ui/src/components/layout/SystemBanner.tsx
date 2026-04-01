import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

import type { BannerSettings } from '@corpcal/shared/api/types';
import { sanitizeBannerHtml } from '@/lib/banner-html';
import { cn } from '@/lib/utils';

interface SystemBannerProps {
  banner: BannerSettings;
  onDismiss?: () => void;
  className?: string;
}

export function SystemBanner({
  banner,
  onDismiss,
  className,
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
      <div className={cn('px-4 py-2 md:px-20')}>
        <div className={cn('mx-auto flex w-full items-center gap-3')}>
          <div aria-hidden className="shrink-0 rounded-full bg-black/10 p-1">
            <Icon className="h-4 w-4" />
          </div>

          <div
            className={
              'min-w-0 flex-1 text-sm leading-6 whitespace-pre-wrap ' +
              '[_&strong]:font-semibold ' +
              '[_&p]:m-0 [&_p]:inline ' +
              // default anchor styling (but don't override elements that already have a bg- utility)
              '[_&a]:opacity-90 [&_a]:transition-opacity [&_a:hover]:opacity-100 ' +
              '[&_a:not([class*="bg-"])]:bg-[#ffffff] [&_a:not([class*="bg-"])]:text-current ' +
              '[_&code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 ' +
              '[_&ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 ' +
              // default button styling when no explicit bg utility provided
              '[_&button]:inline-block [&_button]:ml-2 [&_button]:rounded [&_button]:border [&_button]:border-current [&_button]:bg-transparent [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs [&_button]:font-medium [&_button]:transition-all [&_button:hover]:bg-current [&_button:hover]:text-white ' +
              '[&_button:not([class*="bg-"])]:bg-[#ffffff]'
            }
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {showDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss banner"
              className="shrink-0 rounded-sm p-1 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                outlineColor: banner.textColor,
                color: banner.textColor,
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
