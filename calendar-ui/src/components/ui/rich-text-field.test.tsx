import { describe, expect, it } from 'vitest';

import {
  EMPTY_RICH_TEXT_DOC,
  tipTapDocJsonFromPlainText,
} from '@corpcal/shared/utils';

import { shouldIgnoreStaleEmptyRichTextUpdate } from './rich-text-field';

describe('shouldIgnoreStaleEmptyRichTextUpdate', () => {
  const savedValue = tipTapDocJsonFromPlainText('Saved summary');

  it('ignores unfocused empty TipTap updates when the controlled value has content', () => {
    expect(
      shouldIgnoreStaleEmptyRichTextUpdate({
        editorIsFocused: false,
        nextValue: '{"type":"doc"}',
        currentValue: savedValue,
      })
    ).toBe(true);
  });

  it('allows focused empty updates so users can intentionally clear the field', () => {
    expect(
      shouldIgnoreStaleEmptyRichTextUpdate({
        editorIsFocused: true,
        nextValue: EMPTY_RICH_TEXT_DOC,
        currentValue: savedValue,
      })
    ).toBe(false);
  });

  it('allows non-empty editor updates', () => {
    expect(
      shouldIgnoreStaleEmptyRichTextUpdate({
        editorIsFocused: false,
        nextValue: tipTapDocJsonFromPlainText('Edited summary'),
        currentValue: savedValue,
      })
    ).toBe(false);
  });
});
