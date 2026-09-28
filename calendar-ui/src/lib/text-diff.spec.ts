import { describe, expect, it } from 'vitest';

import {
  buildTextDiffAriaLabel,
  buildTextDiffSegments,
  isEmptyDisplayValue,
  segmentsForSide,
} from './text-diff';

describe('isEmptyDisplayValue', () => {
  it('treats blank and (empty) as empty', () => {
    expect(isEmptyDisplayValue('')).toBe(true);
    expect(isEmptyDisplayValue('   ')).toBe(true);
    expect(isEmptyDisplayValue('(empty)')).toBe(true);
  });

  it('treats non-empty strings as not empty', () => {
    expect(isEmptyDisplayValue('Hello')).toBe(false);
  });
});

describe('buildTextDiffSegments', () => {
  it('marks substituted words as delete and insert', () => {
    expect(buildTextDiffSegments('Old title', 'New title')).toEqual([
      { type: 'delete', value: 'Old' },
      { type: 'insert', value: 'New' },
      { type: 'equal', value: ' title' },
    ]);
  });

  it('preserves multiline content in segments', () => {
    const segments = buildTextDiffSegments(
      'Line one\nLine two',
      'Line one\nLine three'
    );
    expect(segments.some((segment) => segment.value.includes('\n'))).toBe(true);
  });

  it('treats (empty) old value as empty when diffing', () => {
    expect(buildTextDiffSegments('(empty)', 'Hello world')).toEqual([
      { type: 'insert', value: 'Hello world' },
    ]);
  });

  it('treats cleared values as deletions only', () => {
    expect(buildTextDiffSegments('Hello world', '(empty)')).toEqual([
      { type: 'delete', value: 'Hello world' },
    ]);
  });

  it('returns equal segments for identical strings', () => {
    expect(buildTextDiffSegments('Same text', 'Same text')).toEqual([
      { type: 'equal', value: 'Same text' },
    ]);
  });
});

describe('segmentsForSide', () => {
  const segments = buildTextDiffSegments('Old title', 'New title');

  it('keeps equal and delete segments on the old side', () => {
    expect(segmentsForSide(segments, 'old')).toEqual([
      { type: 'delete', value: 'Old' },
      { type: 'equal', value: ' title' },
    ]);
  });

  it('keeps equal and insert segments on the new side', () => {
    expect(segmentsForSide(segments, 'new')).toEqual([
      { type: 'insert', value: 'New' },
      { type: 'equal', value: ' title' },
    ]);
  });
});

describe('buildTextDiffAriaLabel', () => {
  it('summarizes removed and added words', () => {
    const segments = buildTextDiffSegments('Old title', 'New title');
    expect(buildTextDiffAriaLabel('Title', segments)).toBe(
      'Title changed: 1 word removed, 1 word added'
    );
  });

  it('uses a simple label when there are no insertions or deletions', () => {
    const segments = buildTextDiffSegments('Same text', 'Same text');
    expect(buildTextDiffAriaLabel('Summary', segments)).toBe('Summary changed');
  });
});
