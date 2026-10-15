import { describe, expect, it } from 'vitest';

import {
  formatDiscardChangesDialogTitle,
  formatDiscardChangesLabel,
  getFormFieldHighlightScreenReaderText,
} from './form-field-highlight';

describe('form-field-highlight', () => {
  describe('getFormFieldHighlightScreenReaderText', () => {
    it('describes dirty, review, and combined states', () => {
      expect(getFormFieldHighlightScreenReaderText(true, false)).toBe(
        'Unsaved change'
      );
      expect(getFormFieldHighlightScreenReaderText(false, true)).toBe(
        'Changed since last review'
      );
      expect(getFormFieldHighlightScreenReaderText(true, true)).toBe(
        'Unsaved change; changed since last review'
      );
      expect(getFormFieldHighlightScreenReaderText(false, false)).toBeNull();
    });
  });

  describe('formatDiscardChangesLabel', () => {
    it('pluralizes discard button labels', () => {
      expect(formatDiscardChangesLabel(1)).toBe('Discard 1 change');
      expect(formatDiscardChangesLabel(2)).toBe('Discard 2 changes');
    });
  });

  describe('formatDiscardChangesDialogTitle', () => {
    it('pluralizes discard dialog titles', () => {
      expect(formatDiscardChangesDialogTitle(1)).toBe('Discard 1 change?');
      expect(formatDiscardChangesDialogTitle(3)).toBe('Discard 3 changes?');
    });
  });
});
