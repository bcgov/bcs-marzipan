import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HistoryTransitionChange } from './HistoryTransitionChange';

describe('HistoryTransitionChange', () => {
  it('does not show a toggle for short old → new values', () => {
    render(
      <HistoryTransitionChange
        field="title"
        label="Title"
        oldValue="Old title"
        newValue="New title"
      />
    );

    expect(screen.getByText('Old')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
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
        field="title"
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
        field="summary"
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
    expect(container.querySelector('del')).not.toBeInTheDocument();
    expect(container.querySelector('ins')).not.toBeInTheDocument();

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
        field="notes"
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

    const { container } = render(
      <HistoryTransitionChange
        field="summary"
        label="Summary"
        oldValue={oldValue}
        newValue={newValue}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Show more Summary change' })
    );

    expect(container.querySelector('del')).toBeInTheDocument();
    expect(container.querySelector('ins')).toBeInTheDocument();
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
        field="summary"
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

  it('renders narrative diff markup when expanded', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <HistoryTransitionChange
        field="summary"
        label="Summary"
        oldValue={'Previous summary text '.repeat(8)}
        newValue={'Updated summary text '.repeat(8)}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Show more Summary change' })
    );

    expect(container.querySelector('del')).toBeInTheDocument();
    expect(container.querySelector('ins')).toBeInTheDocument();
    expect(screen.getByLabelText(/Summary changed:/)).toBeInTheDocument();
  });

  it('does not render diff markup for non-narrative fields when expanded', async () => {
    const user = userEvent.setup();

    const oldValue = 'Previous status label '.repeat(8);
    const newValue = 'Updated status label '.repeat(8);

    const { container } = render(
      <HistoryTransitionChange
        field="dateStatusId"
        label="Date status"
        oldValue={oldValue}
        newValue={newValue}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Show more Date status change' })
    );

    expect(container.querySelector('del')).not.toBeInTheDocument();
    expect(container.querySelector('ins')).not.toBeInTheDocument();
    expect(screen.getByText(oldValue.trimEnd())).toBeInTheDocument();
    expect(screen.getByText(newValue.trimEnd())).toBeInTheDocument();
  });

  it('shows only highlighted new text when old is empty', () => {
    const { container } = render(
      <HistoryTransitionChange
        field="summary"
        label="Summary"
        oldValue="(empty)"
        newValue="Hello world"
      />
    );

    expect(screen.queryByText('(empty)')).not.toBeInTheDocument();
    expect(container.querySelector('del')).not.toBeInTheDocument();
    expect(screen.getByText('Hello world').tagName).toBe('INS');
    expect(container.textContent).not.toContain('→');
  });

  it('shows only deleted old text when new is empty', () => {
    const { container } = render(
      <HistoryTransitionChange
        field="summary"
        label="Summary"
        oldValue="Hello world"
        newValue="(empty)"
      />
    );

    expect(screen.getByText('Hello world').tagName).toBe('DEL');
    expect(container.querySelector('ins')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('→');
  });
});
