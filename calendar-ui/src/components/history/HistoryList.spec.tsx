import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { HistoryEntryViewModel } from './history-types';
import { HistoryList } from './HistoryList';

const timestamp = new Date().toISOString();

function entry(
  id: number,
  overrides: Partial<HistoryEntryViewModel> = {}
): HistoryEntryViewModel {
  return {
    id,
    actor: { id, name: `User ${id}` },
    actionLabel: 'Updated',
    changes: [],
    timestamp,
    ...overrides,
  };
}

describe('HistoryList', () => {
  it('renders the compact entry metadata and hides changes initially', () => {
    render(
      <MemoryRouter>
        <HistoryList
          entries={[
            entry(1, {
              actor: { name: 'Jane Martinez' },
              team: 'Corporate Communications',
              subject: {
                label: 'ACT-123 Cabinet announcement',
                href: '/activity/123',
              },
              changes: [
                {
                  key: 'title-0',
                  kind: 'transition',
                  field: 'title',
                  label: 'Title',
                  oldValue: 'Old title',
                  newValue: 'New title',
                },
              ],
            }),
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Jane Martinez')).toBeInTheDocument();
    expect(screen.getByText('Corporate Communications')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'ACT-123 Cabinet announcement' })
    ).toHaveAttribute('href', '/activity/123');
    expect(screen.getByRole('button', { name: '1 change' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('Old title')).not.toBeInTheDocument();
  });

  it('expands changes independently per item and across the list', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryList
          entries={[
            entry(1, {
              changes: [
                {
                  key: 'one',
                  kind: 'message',
                  message: 'First change',
                },
              ],
            }),
            entry(2, {
              changes: [
                {
                  key: 'two',
                  kind: 'message',
                  message: 'Second change',
                },
              ],
            }),
          ]}
        />
      </MemoryRouter>
    );

    const changeButtons = screen.getAllByRole('button', {
      name: '1 change',
    });
    await user.click(changeButtons[0]);
    expect(screen.getByText('First change')).toBeInTheDocument();
    expect(screen.queryByText('Second change')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('First change')).toBeInTheDocument();
    expect(screen.getByText('Second change')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('First change')).not.toBeInTheDocument();
    expect(screen.queryByText('Second change')).not.toBeInTheDocument();
  });

  it('does not show Show less on short notes after Expand all notes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryList
          entries={[
            entry(1, { notes: 'Short note' }),
            entry(2, { notes: 'Another brief note' }),
          ]}
        />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Expand all' }));

    expect(
      screen.queryByRole('button', { name: 'Show less' })
    ).not.toBeInTheDocument();
  });

  it('shows note and changes in a combined disclosure in compact variant', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryList
          variant="compact"
          entries={[
            entry(1, {
              notes: 'Compact note text',
              changes: [
                {
                  key: 'title-0',
                  kind: 'transition',
                  field: 'title',
                  label: 'Title',
                  oldValue: 'Old title',
                  newValue: 'New title',
                },
              ],
            }),
            entry(2, { notes: 'Note only entry' }),
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Compact note text')).not.toBeInTheDocument();
    expect(screen.queryByText('Old title')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand all' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Note and 1 change' }));
    expect(screen.getByText('Compact note text')).toBeInTheDocument();
    expect(screen.getByText('Old title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Hide note and 1 change' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Note' }));
    expect(screen.getByText('Note only entry')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Hide note' })
    ).toBeInTheDocument();
  });

  it('expands notes and changes together from the main expand-all button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryList
          variant="compact"
          entries={[
            entry(1, {
              notes: 'Compact note text',
              changes: [
                {
                  key: 'title-0',
                  kind: 'transition',
                  field: 'title',
                  label: 'Title',
                  oldValue: 'Old title',
                  newValue: 'New title',
                },
              ],
            }),
          ]}
        />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('Compact note text')).toBeInTheDocument();
    expect(screen.getByText('Old title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Hide note and 1 change' })
    ).toBeInTheDocument();
  });
});
