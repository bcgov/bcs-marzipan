import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { normalizeReportActivityDateRange } from '@corpcal/shared/reports/normalizeReportActivityDateRange';

import { ReportAppliedDateRange } from './ReportAppliedDateRange';

const dateRange = normalizeReportActivityDateRange({
  startDateFrom: '2026-01-01',
  startDateTo: '2026-03-31',
});

describe('ReportAppliedDateRange', () => {
  it('renders the formatted applied date range', () => {
    render(<ReportAppliedDateRange dateRange={dateRange} />);

    expect(
      screen.getByLabelText('Applied date range: Jan 1 – Mar 31, 2026')
    ).toBeTruthy();
  });

  it('renders nothing when date range is missing', () => {
    const { container } = render(<ReportAppliedDateRange dateRange={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
