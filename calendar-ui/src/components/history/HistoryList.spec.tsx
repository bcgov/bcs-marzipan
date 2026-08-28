import { render, screen, within } from '@testing-library/react';
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

function getDetailsPanels(buttonName: string) {
  return screen.getAllByRole('button', { name: buttonName }).map((button) => {
    const panelId = button.getAttribute('aria-controls');
    if (!panelId) {
      throw new Error(`Missing aria-controls for button "${buttonName}"`);
    }
    const panel = document.getElementById(panelId);
    if (!panel) {
      throw new Error(`Missing details panel "${panelId}"`);
    }
    return panel;
  });
}

function getDetailsPanel(buttonName: string) {
  const [panel] = getDetailsPanels(buttonName);
  if (!panel) {
    throw new Error(`Missing details panel for button "${buttonName}"`);
  }
  return panel;
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
    expect(getDetailsPanel('1 change')).toHaveAttribute('aria-hidden', 'true');
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
    const regions = getDetailsPanels('1 change');
    await user.click(changeButtons[0]);
    expect(regions[0]).toHaveAttribute('aria-hidden', 'false');
    expect(regions[1]).toHaveAttribute('aria-hidden', 'true');
    expect(within(regions[0]).getByText('First change')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expand all changes' })
    );
    expect(regions[0]).toHaveAttribute('aria-hidden', 'false');
    expect(regions[1]).toHaveAttribute('aria-hidden', 'false');
    expect(within(regions[0]).getByText('First change')).toBeInTheDocument();
    expect(within(regions[1]).getByText('Second change')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Collapse all changes' })
    );
    expect(regions[0]).toHaveAttribute('aria-hidden', 'true');
    expect(regions[1]).toHaveAttribute('aria-hidden', 'true');
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

    await user.click(screen.getByRole('button', { name: 'Expand all notes' }));

    expect(
      screen.queryByRole('button', { name: 'Show less' })
    ).not.toBeInTheDocument();
  });

  it('keeps notes in the disclosure panel in compact variant', async () => {
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

    expect(getDetailsPanel('1 change, Note')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(
      screen.queryByRole('button', { name: 'Expand all notes' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand all details' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1 change, Note' }));
    const combinedPanel = getDetailsPanel('1 change, Note');
    expect(combinedPanel).toHaveAttribute('aria-hidden', 'false');
    expect(
      within(combinedPanel).getByText('Compact note text')
    ).toBeInTheDocument();
    expect(within(combinedPanel).getByText('Old title')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Note' }));
    const notePanel = getDetailsPanel('Note');
    expect(notePanel).toHaveAttribute('aria-hidden', 'false');
    expect(within(notePanel).getByText('Note only entry')).toBeInTheDocument();
  });
});
