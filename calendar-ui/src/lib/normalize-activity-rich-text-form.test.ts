import { describe, expect, it } from 'vitest';

import { EMPTY_RICH_TEXT_DOC, tryParseTipTapDoc } from '@corpcal/shared/utils';

import {
  coalesceRichTextFormStorageValue,
  normalizeActivityRichTextFormFields,
  normalizeActivityRichTextFormValue,
} from './normalize-activity-rich-text-form';

describe('normalizeActivityRichTextFormValue', () => {
  it('returns undefined for empty / effectively empty', () => {
    expect(normalizeActivityRichTextFormValue(undefined)).toBeUndefined();
    expect(normalizeActivityRichTextFormValue('')).toBeUndefined();
    expect(
      normalizeActivityRichTextFormValue(EMPTY_RICH_TEXT_DOC)
    ).toBeUndefined();
  });

  it('round-trips valid TipTap JSON to a stable string', () => {
    const raw =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}';
    const out = normalizeActivityRichTextFormValue(raw);
    expect(out).toBeDefined();
    expect(tryParseTipTapDoc(out!)).not.toBeNull();
    expect(JSON.parse(out!)).toEqual(JSON.parse(raw));
  });

  it('converts legacy plain text to JSON doc string', () => {
    const plain = 'Joint announcement: plain text from API.';
    const out = normalizeActivityRichTextFormValue(plain);
    expect(out).toBeDefined();
    expect(out!.startsWith('{"type":"doc"')).toBe(true);
    expect(tryParseTipTapDoc(out!)).not.toBeNull();
  });
});

describe('normalizeActivityRichTextFormFields', () => {
  it('sets summary to EMPTY_RICH_TEXT_DOC when summary normalizes to empty', () => {
    const data = normalizeActivityRichTextFormFields({
      title: 't',
      summary: '',
      significance: undefined,
      executiveSummary: undefined,
    } as never);
    expect(data.summary).toBe(EMPTY_RICH_TEXT_DOC);
    expect(data.significance).toBe(EMPTY_RICH_TEXT_DOC);
    expect(data.executiveSummary).toBe(EMPTY_RICH_TEXT_DOC);
  });
});

describe('coalesceRichTextFormStorageValue', () => {
  it('maps equivalent empty variants to EMPTY_RICH_TEXT_DOC', () => {
    expect(coalesceRichTextFormStorageValue('{"type":"doc"}')).toBe(
      EMPTY_RICH_TEXT_DOC
    );
    expect(coalesceRichTextFormStorageValue(EMPTY_RICH_TEXT_DOC)).toBe(
      EMPTY_RICH_TEXT_DOC
    );
    expect(coalesceRichTextFormStorageValue('')).toBe(EMPTY_RICH_TEXT_DOC);
  });
});
