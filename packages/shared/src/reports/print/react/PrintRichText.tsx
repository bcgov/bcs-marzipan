import { activityStoredValueToSanitizedHtmlForPrint } from '../activityRichTextPrintHtml';

/**
 * Renders a rich text field (stored as TipTap JSON or legacy markdown) as
 * sanitised HTML suitable for both in-app preview and Puppeteer PDF export.
 *
 * Returns `null` when the value is empty after sanitisation so callers can
 * collapse surrounding layout.
 */
export function PrintRichText({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  if (value == null || value === '') return null;
  const html = activityStoredValueToSanitizedHtmlForPrint(value);
  if (!html) return null;
  return (
    <div
      className={className ?? 'corpcal-print-rich'}
      // Content has already been sanitised by `sanitize-html` with an
      // allow-list; re-rendering it is safe here.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
