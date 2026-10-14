import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { HistoryEntryViewModel } from './history-types';
import { HistoryTable } from './HistoryTable';

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

describe('HistoryTable', () => {
  it('renders table columns and activity id links', () => {
    render(
      <MemoryRouter>
        <HistoryTable
          entries={[
            entry(1, {
              actor: { name: 'Jane Martinez' },
              team: 'Corporate Communications',
              subject: {
                label: 'MIN-000123 Cabinet announcement',
                displayId: 'MIN-000123',
                title: 'Cabinet announcement',
                href: '/activity/123',
              },
              changes: [
                {
                  key: 'status-0',
                  kind: 'transition',
                  field: 'status',
                  label: 'Status',
                  oldValue: 'Draft',
                  newValue: 'Published',
                },
              ],
            }),
          ]}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('columnheader', { name: 'User' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Type' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Details' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Activity ID' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Date' })
    ).toBeInTheDocument();

    expect(screen.getByText('Jane Martinez')).toBeInTheDocument();
    expect(screen.getByText('Corporate Communications')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Cabinet announcement' })
    ).toHaveAttribute('href', '/activity/123');
    expect(screen.getByRole('link', { name: 'MIN-000123' })).toHaveAttribute(
      'href',
      '/activity/123'
    );
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });

  it('expands row details from the badge and expand-all control', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryTable
          entries={[
            entry(1, {
              notes: 'Compact note text',
              changes: [
                {
                  key: 'status-0',
                  kind: 'transition',
                  field: 'status',
                  label: 'Status',
                  oldValue: 'Draft',
                  newValue: 'Published',
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

    await user.click(
      screen.getAllByRole('button', { name: 'Show note and 1 change' })[0]
    );
    expect(screen.getByText('Compact note text')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.queryByText('Second change')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('Second change')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('Compact note text')).not.toBeInTheDocument();
    expect(screen.queryByText('Second change')).not.toBeInTheDocument();
  });
});
