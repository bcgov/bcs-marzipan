import {
  mergeAttributes,
  type Extensions,
  type JSONContent,
  type MarkViewProps,
} from '@tiptap/core';
import { Link } from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown, MarkdownManager } from '@tiptap/markdown';
import { MarkViewContent, ReactMarkViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link as RouterLink } from 'react-router-dom';
import type { ComponentPropsWithoutRef } from 'react';

import { EMPTY_RICH_TEXT_DOC, tryParseTipTapDoc } from '@corpcal/shared/utils';

const NEW_TAB = { target: '_blank' as const, rel: 'noopener noreferrer' };

/**
 * Target/rel for serializeHTML / generateHTML and plain `<a>` output.
 * `mailto:`, `tel:`, hash-only, and dangerous schemes stay without target.
 */
export function linkTargetRelForHref(href: string | undefined): {
  target?: string;
  rel?: string;
} {
  const h = href?.trim() ?? '';
  if (!h || h.toLowerCase().startsWith('javascript:')) {
    return {};
  }
  if (h.toLowerCase().startsWith('data:')) {
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

function isAppInternalHref(href: string): boolean {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return true;
  }
  try {
    const win = globalThis as { location?: { origin?: string } };
    const origin = win.location?.origin;
    if (!origin) {
      return false;
    }
    const u = new URL(href, origin);
    return u.origin === origin;
  } catch {
    return false;
  }
}

function toRouterPath(href: string): string {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }
  const win = globalThis as { location?: { origin?: string } };
  const origin = win.location?.origin ?? 'http://localhost';
  const u = new URL(href, origin);
  return `${u.pathname}${u.search}${u.hash}`;
}

function ActivityLinkMarkView(props: MarkViewProps) {
  const rawAttrs = props.HTMLAttributes as Record<string, unknown>;
  const hrefRaw = rawAttrs.href;
  const hrefStr =
    typeof hrefRaw === 'string'
      ? hrefRaw
      : typeof hrefRaw === 'number'
        ? String(hrefRaw)
        : '';
  const className =
    typeof rawAttrs.class === 'string'
      ? rawAttrs.class
      : 'text-primary underline underline-offset-2';

  const { href: _h, class: _c, target: _t, rel: _r, ...rest } = rawAttrs;
  const passthrough = rest as Omit<
    ComponentPropsWithoutRef<'a'>,
    'href' | 'children'
  >;

  if (
    !hrefStr ||
    hrefStr.toLowerCase().startsWith('javascript:') ||
    hrefStr.toLowerCase().startsWith('data:')
  ) {
    return (
      <span className={className} {...passthrough}>
        <MarkViewContent />
      </span>
    );
  }

  if (
    hrefStr.startsWith('mailto:') ||
    hrefStr.startsWith('tel:') ||
    hrefStr.startsWith('#')
  ) {
    return (
      <a href={hrefStr} className={className} {...passthrough}>
        <MarkViewContent />
      </a>
    );
  }

  if (isAppInternalHref(hrefStr)) {
    return (
      <RouterLink
        to={toRouterPath(hrefStr)}
        className={className}
        {...NEW_TAB}
        {...passthrough}
      >
        <MarkViewContent />
      </RouterLink>
    );
  }

  return (
    <a href={hrefStr} className={className} {...NEW_TAB} {...passthrough}>
      <MarkViewContent />
    </a>
  );
}

const ActivityLink = Link.extend({
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

  addMarkView() {
    return ReactMarkViewRenderer(ActivityLinkMarkView);
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

function linkMark() {
  return ActivityLink.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      class: 'text-primary underline underline-offset-2',
    },
  });
}

const markdownExtension = Markdown.configure({});

/** Extensions for generateHTML / MarkdownManager (no placeholder). */
export function getActivityRichTextHtmlExtensions(): Extensions {
  return [starterKitCompact, linkMark(), markdownExtension];
}

/** Full editor extensions including placeholder. */
export function getActivityRichTextEditorExtensions(options: {
  placeholder: string;
}): Extensions {
  return [
    starterKitCompact,
    linkMark(),
    markdownExtension,
    Placeholder.configure({ placeholder: options.placeholder }),
  ];
}

export type SetContentArgs = {
  content: string | JSONContent;
  contentType: 'json' | 'markdown';
};

export function getSetContentArgs(
  value: string | undefined | null
): SetContentArgs {
  const v = value ?? '';
  if (v === '' || v === EMPTY_RICH_TEXT_DOC) {
    return {
      content: { type: 'doc', content: [] },
      contentType: 'json',
    };
  }
  const doc = tryParseTipTapDoc(v);
  if (doc) {
    return { content: doc as JSONContent, contentType: 'json' };
  }
  return { content: v, contentType: 'markdown' };
}

export function markdownManagerForRichText(): MarkdownManager {
  return new MarkdownManager({
    extensions: getActivityRichTextHtmlExtensions(),
  });
}
