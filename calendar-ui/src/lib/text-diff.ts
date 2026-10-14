import { diffWordsWithSpace } from 'diff';

export type TextDiffSegment = {
  type: 'equal' | 'insert' | 'delete';
  value: string;
};

export type TextDiffSide = 'old' | 'new';

const EMPTY_DISPLAY_VALUE = '(empty)';

export function isEmptyDisplayValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === EMPTY_DISPLAY_VALUE;
}

function normalizeDiffValue(value: string): string {
  return isEmptyDisplayValue(value) ? '' : value;
}

export function buildTextDiffSegments(
  oldValue: string,
  newValue: string
): TextDiffSegment[] {
  const parts = diffWordsWithSpace(
    normalizeDiffValue(oldValue),
    normalizeDiffValue(newValue)
  );

  const segments: TextDiffSegment[] = [];
  for (const part of parts) {
    if (part.removed) {
      segments.push({ type: 'delete', value: part.value });
      continue;
    }
    if (part.added) {
      segments.push({ type: 'insert', value: part.value });
      continue;
    }
    segments.push({ type: 'equal', value: part.value });
  }

  return segments;
}

export function segmentsForSide(
  segments: TextDiffSegment[],
  side: TextDiffSide
): TextDiffSegment[] {
  return segments.filter((segment) => {
    if (segment.type === 'equal') return true;
    if (side === 'old') return segment.type === 'delete';
    return segment.type === 'insert';
  });
}

function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function buildTextDiffAriaLabel(
  label: string,
  segments: TextDiffSegment[]
): string {
  let deletedWords = 0;
  let insertedWords = 0;

  for (const segment of segments) {
    if (segment.type === 'delete') {
      deletedWords += countWords(segment.value);
    } else if (segment.type === 'insert') {
      insertedWords += countWords(segment.value);
    }
  }

  if (deletedWords === 0 && insertedWords === 0) {
    return `${label} changed`;
  }

  const details: string[] = [];
  if (deletedWords > 0) {
    details.push(
      `${deletedWords} word${deletedWords === 1 ? '' : 's'} removed`
    );
  }
  if (insertedWords > 0) {
    details.push(
      `${insertedWords} word${insertedWords === 1 ? '' : 's'} added`
    );
  }

  return `${label} changed: ${details.join(', ')}`;
}
