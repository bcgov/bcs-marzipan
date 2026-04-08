import { useMemo } from 'react';

import { activityStoredValueToSanitizedHtml } from '@/lib/activity-rich-text-html';
import { cn } from '@/lib/utils';

export function ActivityRichTextContent({
  value,
  className,
  stopLinkPropagation = false,
}: {
  value: string | null | undefined;
  className?: string;
  /** When true, link clicks do not bubble (e.g. inside clickable table rows). */
  stopLinkPropagation?: boolean;
}) {
  const html = useMemo(
    () => activityStoredValueToSanitizedHtml(value ?? ''),
    [value]
  );

  if (!html) return null;

  return (
    <div
      className={cn(
        'activity-rich-text-content [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_p]:mb-1 last:[&_p]:mb-0',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={
        stopLinkPropagation
          ? (e) => {
              if ((e.target as HTMLElement).closest('a')) {
                e.stopPropagation();
              }
            }
          : undefined
      }
    />
  );
}
