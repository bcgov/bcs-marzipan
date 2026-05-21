import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

import {
  EMPTY_RICH_TEXT_DOC,
  tipTapDocJsonFromPlainText,
} from '@corpcal/shared/utils';

import {
  RichTextField,
  shouldIgnoreStaleEmptyRichTextUpdate,
} from './rich-text-field';

function renderRichTextField(
  props: Partial<ComponentProps<typeof RichTextField>> & {
    value: string;
  }
) {
  const onChange = props.onChange ?? vi.fn();
  const onBlur = props.onBlur ?? vi.fn();

  const result = render(
    <MemoryRouter>
      <RichTextField
        name="summary"
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
    </MemoryRouter>
  );

  return { ...result, onChange, onBlur };
}

async function waitForRichTextEditor() {
  await waitFor(() => {
    expect(document.querySelector('.ProseMirror')).toBeInTheDocument();
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

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

describe('RichTextField', () => {
  it('suppresses onChange when TipTap emits a semantically equivalent empty doc', async () => {
    const { onChange } = renderRichTextField({ value: '{"type":"doc"}' });

    await waitForRichTextEditor();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('suppresses onChange when the controlled value is already canonical empty', async () => {
    const { onChange } = renderRichTextField({ value: EMPTY_RICH_TEXT_DOC });

    await waitForRichTextEditor();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('suppresses unfocused empty TipTap updates when the controlled value has content', async () => {
    const savedValue = tipTapDocJsonFromPlainText('Saved summary');
    const { onChange } = renderRichTextField({ value: savedValue });

    await waitForRichTextEditor();

    expect(onChange).not.toHaveBeenCalled();
  });
});
