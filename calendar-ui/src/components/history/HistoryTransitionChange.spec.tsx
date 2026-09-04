import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HistoryTransitionChange } from './HistoryTransitionChange';

describe('HistoryTransitionChange', () => {
  it('does not show a toggle for short old → new values', () => {
    render(
      <HistoryTransitionChange
        label="Title"
        oldValue="Old title"
        newValue="New title"
      />
    );

    expect(screen.getByText('Old title')).toBeInTheDocument();
    expect(screen.getByText('New title')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show more Title change' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show less Title change' })
    ).not.toBeInTheDocument();
  });

  it('uses inline flow so label and change share one line and wrap from the left edge', () => {
    const { container } = render(
      <HistoryTransitionChange
        label="Title"
        oldValue="Old title"
        newValue="New title"
      />
    );

    const row = container.firstElementChild;
    expect(row).not.toHaveClass('flex');
    expect(row?.textContent).toMatch(/^Title:\s+Old title → New title$/);
  });

  it('shows truncated previews of both sides and an inline Show more', () => {
    const oldValue = 'Previous summary text '.repeat(8);
    const newValue = 'Updated summary text '.repeat(8);

    const { container } = render(
      <HistoryTransitionChange
        label="Summary"
        oldValue={oldValue}
        newValue={newValue}
      />
    );

    expect(
      screen.getByText(`${oldValue.slice(0, 48)}…`, { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${newValue.slice(0, 48)}…`, { exact: false })
    ).toBeInTheDocument();

    const row = container.firstElementChild;
    const showMore = screen.getByRole('button', {
      name: 'Show more Summary change',
    });
    expect(row?.contains(showMore)).toBe(true);
    expect(container.querySelector('.flex-1')).not.toBeInTheDocument();
  });

  it('shows Show more when only one side exceeds the preview length', () => {
    render(
      <HistoryTransitionChange
        label="Notes"
        oldValue="Short"
        newValue={'Updated notes text '.repeat(8)}
      />
    );

    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show more Notes change' })
    ).toBeInTheDocument();
  });

  it('expands both values with a single Show more click', async () => {
    const user = userEvent.setup();

    const oldValue = 'Previous summary text '.repeat(8);
    const newValue = 'Updated summary text '.repeat(8);

    render(
      <HistoryTransitionChange
        label="Summary"
        oldValue={oldValue}
        newValue={newValue}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Show more Summary change' })
    );

    expect(screen.getByText(oldValue.trimEnd())).toBeInTheDocument();
    expect(screen.getByText(newValue.trimEnd())).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show less Summary change' })
    ).toBeInTheDocument();
  });

  it('returns to truncated preview when Show less is clicked', async () => {
    const user = userEvent.setup();

    const oldValue = 'Previous summary text '.repeat(8);
    const newValue = 'Updated summary text '.repeat(8);

    render(
      <HistoryTransitionChange
        label="Summary"
        oldValue={oldValue}
        newValue={newValue}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Show more Summary change' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Show less Summary change' })
    );

    expect(
      screen.getByText(`${oldValue.slice(0, 48)}…`, { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show more Summary change' })
    ).toBeInTheDocument();
  });
});
