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
  toolbar = 'full',
}: {
  value: string;
  name: string;
  toolbar?: 'full' | 'links';
}): ReactElement {
  return (
    <>
      {toolbar === 'links' ? (
        <div role="toolbar" aria-label="Text formatting">
          <button type="button" aria-label="Clear formatting">
            Clear
          </button>
          <button type="button" aria-label="Link">
            Link
          </button>
        </div>
      ) : null}
      <input type="hidden" name={name} value={value} readOnly />
    </>
  );
}
