import {
  REVIEW_HIGHLIGHT_BG,
  REVIEW_HIGHLIGHT_RING,
} from '@/lib/review-highlight';
import { cn } from '@/lib/utils';

/** Label background for unsaved and/or since-review field changes (matches activity list). */
export const FORM_FIELD_LABEL_HIGHLIGHT_CLASS = cn(
  'rounded-sm',
  REVIEW_HIGHLIGHT_BG,
  REVIEW_HIGHLIGHT_RING
);

export function getFormFieldHighlightScreenReaderText(
  isDirty: boolean,
  needsReview: boolean
): string | null {
  if (isDirty && needsReview) {
    return 'Unsaved change; changed since last review';
  }
  if (isDirty) {
    return 'Unsaved change';
  }
  if (needsReview) {
    return 'Changed since last review';
  }
  return null;
}

export function formatDiscardChangesLabel(changeCount: number): string {
  if (changeCount === 1) {
    return 'Discard 1 change';
  }
  return `Discard ${changeCount} changes`;
}

export function formatDiscardChangesDialogTitle(changeCount: number): string {
  if (changeCount === 1) {
    return 'Discard 1 change?';
  }
  return `Discard ${changeCount} changes?`;
}
