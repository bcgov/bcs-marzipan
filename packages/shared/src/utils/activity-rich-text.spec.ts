import { describe, expect, it } from 'vitest';

import {
  EMPTY_RICH_TEXT_DOC,
  isActivityRichTextEffectivelyEmpty,
  isActivityRichTextStorageRefine,
  markdownLikeToPlainTextFallback,
  plainTextFromActivityRichField,
  tipTapDocJsonFromPlainText,
  tipTapDocToPlainText,
  tryParseTipTapDoc,
} from './activity-rich-text';

describe('tryParseTipTapDoc', () => {
  it('parses valid doc JSON', () => {
    const doc = tryParseTipTapDoc(
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hi"}]}]}'
    );
    expect(doc?.type).toBe('doc');
    expect(tipTapDocToPlainText(doc!)).toBe('Hi');
  });

  it('rejects non-doc JSON', () => {
    expect(tryParseTipTapDoc('{"type":"paragraph"}')).toBeNull();
    expect(tryParseTipTapDoc('not json')).toBeNull();
  });
});

describe('plainTextFromActivityRichField', () => {
  it('extracts text from Tip Tap JSON', () => {
    const json = tipTapDocJsonFromPlainText('Hello world');
    expect(plainTextFromActivityRichField(json)).toBe('Hello world');
  });

  it('falls back for markdown-like strings', () => {
    expect(plainTextFromActivityRichField('**Bold** and *italic*')).toBe(
      'Bold and italic'
    );
  });

  it('treats empty doc as empty', () => {
    expect(plainTextFromActivityRichField(EMPTY_RICH_TEXT_DOC)).toBe('');
    expect(isActivityRichTextEffectivelyEmpty(EMPTY_RICH_TEXT_DOC)).toBe(true);
  });
});

describe('isActivityRichTextStorageRefine', () => {
  it('allows empty, markdown-like, or doc JSON', () => {
    expect(isActivityRichTextStorageRefine('')).toBe(true);
    expect(isActivityRichTextStorageRefine('**x**')).toBe(true);
    expect(isActivityRichTextStorageRefine(EMPTY_RICH_TEXT_DOC)).toBe(true);
    expect(isActivityRichTextStorageRefine('{"type":"bad"}')).toBe(false);
  });
});

describe('markdownLikeToPlainTextFallback', () => {
  it('strips link syntax', () => {
    expect(markdownLikeToPlainTextFallback('[a](https://x.com)')).toBe('a');
  });
});
