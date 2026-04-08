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
        // Match RichTextField: outside list markers + padding (list-inside breaks li > p layout).
        // Vertical margin only on top-level lists — nested ul/ol under li would otherwise gap more than siblings.
        'activity-rich-text-content [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_li]:my-0 [&_li>ol]:my-0 [&_li>p]:mb-0 [&_li>ul]:my-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&>ol]:my-1 [&>ul]:my-1',
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
