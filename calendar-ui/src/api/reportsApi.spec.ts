import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchReportData } from './reportsApi';

const mockGet = vi.fn();

vi.mock('./axios', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('fetchReportData', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({
      data: { report: { name: 'exec' }, sections: [] },
    });
  });

  it('serializes array filter params as comma-separated strings', async () => {
    await fetchReportData('exec', {
      includeCompleted: false,
      activityStatusIds: [1, 2],
      categoryNames: ['Event', 'FYI'],
    });

    expect(mockGet).toHaveBeenCalledWith('/reports/data/exec', {
      params: {
        includeCompleted: false,
        activityStatusIds: '1,2',
        categoryNames: 'Event,FYI',
      },
    });
  });
});
