import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HistoryNote } from './HistoryNote';

describe('HistoryNote', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not show a toggle for short notes even when expanded externally', () => {
    render(
      <HistoryNote text="Short note" expanded onExpandedChange={() => {}} />
    );

    expect(
      screen.queryByRole('button', { name: 'Show less' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show more' })
    ).not.toBeInTheDocument();
  });

  it('shows Show more inline on the truncated preview row', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(240);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(120);

    const { container } = render(
      <HistoryNote
        text="This note is long enough to overflow the single-line preview"
        expanded={false}
        onExpandedChange={() => {}}
      />
    );

    const row = container.firstElementChild;
    expect(row).toHaveClass('flex');

    const noteText = screen.getByText(
      'This note is long enough to overflow the single-line preview'
    );
    expect(noteText).toHaveClass('truncate');

    const showMore = screen.getByRole('button', { name: 'Show more' });
    expect(showMore).toHaveClass('shrink-0');
    expect(row?.contains(showMore)).toBe(true);
  });
});
