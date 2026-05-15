import type { Extensions, JSONContent } from '@tiptap/core';

/**
 * The shared print module imports `@tiptap/html/server` for Node PDF generation. Vite
 * must not bundle the real server entry (it pulls in happy-dom and can crash the
 * browser). The dev/prod alias points here instead.
 *
 * `activityRichTextPrintHtml` only calls this when `typeof window === 'undefined'`.
 * In the browser that is never true, so this export should not run in the app.
 */
export function generateHTML(
  _doc: JSONContent,
  _extensions: Extensions
): string {
  throw new Error(
    '@tiptap/html/server was resolved in the client bundle. Check vite resolve.alias for @tiptap/html/server.'
  );
}
