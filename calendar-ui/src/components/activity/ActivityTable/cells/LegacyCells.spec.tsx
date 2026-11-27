import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mapLegacyActivityToTableRow } from '../activityTableRow';
import { LegacyOverviewCell, LegacyStatusCell } from './LegacyCells';
import { MaterialsCellCompact } from './MaterialsCellCompact';

vi.mock('@/hooks/useLookAheadSectionRows', () => ({
  useLookAheadSectionRows: () => ({ rows: [] }),
  getLookAheadSectionLegendColorFromRows: () => null,
  getLookAheadSectionReportLabelFromRows: () => '',
}));

const row = mapLegacyActivityToTableRow({
  id: 1,
  displayId: 'HLTH-123456789',
  title: 'Historical activity',
  summary: null,
  startDate: null,
  endDate: null,
  activityStatusId: 8,
  activityStatus: 'Archived',
  lookAheadStatus: null,
  leadOrgName: null,
  ministryName: null,
  locationName: null,
  commsMaterials: ['News release'],
  translations: ['French'],
  commsContactName: 'Jane Smith',
  createdDateTime: '2025-01-15T20:00:00.000Z',
  importedAt: '2026-03-20T20:00:00.000Z',
});

describe('legacy table cells', () => {
  it('shows Comms contact, materials, and original translation labels', () => {
    render(<MaterialsCellCompact row={row} />);

    expect(screen.getByText('Jane Smith')).toBeVisible();
    expect(screen.getByText('News release')).toBeVisible();
    expect(screen.getByText('French')).toBeVisible();
  });

  it('shows a placeholder when Comms information is missing', () => {
    render(
      <MaterialsCellCompact
        row={{
          ...row,
          commsContactName: null,
          commsMaterials: [],
          translationsRequired: [],
        }}
      />
    );

    expect(screen.getByText('—')).toBeVisible();
  });
  it('formats and copies the full activity ID without opening the row', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const openRow = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(
      <div onClick={openRow}>
        <LegacyOverviewCell row={row} />
      </div>
    );

    const button = screen.getByRole('button', { name: 'Copy activity ID' });
    expect(button).toHaveTextContent('HLTH-456789');
    fireEvent.click(button);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('HLTH-123456789')
    );
    expect(openRow).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('shows the original creation date instead of the import date', () => {
    render(<LegacyStatusCell row={row} />);

    expect(screen.getByText('Archived')).toBeVisible();
    expect(screen.getByText('Created Jan 15, 2025')).toBeVisible();
    expect(screen.queryByText(/Imported/)).not.toBeInTheDocument();
  });

  it('does not display a fabricated creation date when it is unknown', () => {
    render(<LegacyStatusCell row={{ ...row, legacyCreatedDateTime: null }} />);

    expect(screen.queryByText(/^Created/)).not.toBeInTheDocument();
  });
});
