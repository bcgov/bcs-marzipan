import { mergeAttributes, type JSONContent } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import { generateHTML as generateHTMLInBrowser } from '@tiptap/html';
import { generateHTML as generateHTMLOnServer } from '@tiptap/html/server';
import { Markdown, MarkdownManager } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import sanitizeHtml from 'sanitize-html';

import { tryParseTipTapDoc } from '../../utils/activity-rich-text';

const NEW_TAB = { target: '_blank' as const, rel: 'noopener noreferrer' };

const DANGEROUS_HREF_SCHEME_PREFIXES = [
  'javascript:',
  'vbscript:',
  'data:',
] as const;

export function hasDangerousHrefScheme(href: string): boolean {
  const h = href.trim().toLowerCase();
  return DANGEROUS_HREF_SCHEME_PREFIXES.some((prefix) => h.startsWith(prefix));
}

export function linkTargetRelForHref(href: string | undefined): {
  target?: string;
  rel?: string;
} {
  const h = href?.trim() ?? '';
  if (!h || hasDangerousHrefScheme(h)) {
    return {};
  }
  if (h.startsWith('mailto:') || h.startsWith('tel:')) {
    return {};
  }
  if (h.startsWith('#')) {
    return {};
  }
  return { ...NEW_TAB };
}

/** Link extension for static HTML (no React mark views); matches calendar-ui rich-text output for print/PDF. */
const PrintLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const href = String(HTMLAttributes.href ?? '');
    const { target, rel } = linkTargetRelForHref(href);
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        ...(target ? { target } : {}),
        ...(rel ? { rel } : {}),
      }),
      0,
    ];
  },
});

const starterKitCompact = StarterKit.configure({
  blockquote: false,
  codeBlock: false,
  code: false,
  heading: false,
  horizontalRule: false,
  strike: false,
  underline: false,
  trailingNode: false,
  link: false,
});

const markdownExtension = Markdown.configure({});

function getActivityRichTextPrintExtensions() {
  return [
    starterKitCompact,
    PrintLink.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        class: 'text-primary underline underline-offset-2',
      },
    }),
    markdownExtension,
  ];
}

function markdownManagerForPrintRichText(): MarkdownManager {
  return new MarkdownManager({
    extensions: getActivityRichTextPrintExtensions(),
  });
}

function emptyParagraphsToLineBreak(html: string): string {
  return html.replace(/<p(\s[^>]*)?><\/p>/gi, '<p$1><br></p>');
}

function docFromStoredValue(value: string): JSONContent {
  const parsed = tryParseTipTapDoc(value);
  if (parsed) {
    return parsed;
  }
  return markdownManagerForPrintRichText().parse(value);
}

function jsonDocToPrintHtml(
  doc: JSONContent,
  extensions: ReturnType<typeof getActivityRichTextPrintExtensions>
): string {
  if (typeof window === 'undefined') {
    return generateHTMLOnServer(doc, extensions);
  }
  return generateHTMLInBrowser(doc, extensions);
}

/**
 * TipTap JSON / legacy markdown → sanitized HTML (bold, lists, links).
 * Same pipeline as calendar-ui `activityStoredValueToSanitizedHtml` without React-only extensions.
 */
export function activityStoredValueToSanitizedHtmlForPrint(
  value: string | null | undefined
): string {
  if (value == null || value === '') return '';
  const doc = docFromStoredValue(value);
  const raw = emptyParagraphsToLineBreak(
    jsonDocToPrintHtml(doc, getActivityRichTextPrintExtensions())
  );
  return sanitizeHtml(raw, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'a',
      'span',
      'ul',
      'ol',
      'li',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href;
        if (href && hasDangerousHrefScheme(href)) {
          return { tagName: 'span', attribs: { class: attribs.class } };
        }
        return { tagName, attribs };
      },
    },
  });
}
