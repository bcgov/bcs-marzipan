import type { ReactElement } from 'react';

/**
 * TipTap fires onUpdate on mount in jsdom and can clear summary.
 *
 * In test files:
 * ```ts
 * vi.mock('@/components/ui/rich-text-field', () =>
 *   import('@/test-utils/rich-text-field-mock').then((m) => ({
 *     RichTextField: m.RichTextFieldMock,
 *   }))
 * );
 * ```
 */
export function RichTextFieldMock({
  value,
  name,
}: {
  value: string;
  name: string;
}): ReactElement {
  return <input type="hidden" name={name} value={value} readOnly />;
}
