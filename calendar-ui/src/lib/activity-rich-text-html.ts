import type { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import sanitizeHtml from 'sanitize-html';

import { tryParseTipTapDoc } from '@corpcal/shared/utils';

import {
  getActivityRichTextHtmlExtensions,
  markdownManagerForRichText,
} from './activity-rich-text-extensions';

function docFromStoredValue(value: string): JSONContent {
  const parsed = tryParseTipTapDoc(value);
  if (parsed) {
    return parsed as JSONContent;
  }
  return markdownManagerForRichText().parse(value);
}

/** HTML safe for `dangerouslySetInnerHTML` (bold, italic, links only). */
export function activityStoredValueToSanitizedHtml(
  value: string | null | undefined
): string {
  if (value == null || value === '') return '';
  const doc = docFromStoredValue(value);
  const raw = generateHTML(doc, getActivityRichTextHtmlExtensions());
  return sanitizeHtml(raw, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'span'],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href;
        if (
          href &&
          (href.toLowerCase().startsWith('javascript:') ||
            href.toLowerCase().startsWith('data:'))
        ) {
          return { tagName: 'span', attribs: { class: attribs.class } };
        }
        return { tagName, attribs };
      },
    },
  });
}
