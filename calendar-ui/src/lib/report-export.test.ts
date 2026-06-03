import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import type { ReportDataResponse } from '@/api/reportsApi';

import { handleReportExport } from './report-export';

const mockDownloadCustomReportXlsx = vi.hoisted(() => vi.fn());
const mockLoadCustomReportConfig = vi.hoisted(() => vi.fn());

vi.mock('@/lib/custom-report-xlsx', () => ({
  downloadCustomReportXlsx: mockDownloadCustomReportXlsx,
}));

vi.mock('@/lib/custom-report-config-storage', () => ({
  loadCustomReportConfig: mockLoadCustomReportConfig,
}));

vi.mock('@/api/reportsApi', () => ({
  downloadReportCsv: vi.fn(),
  downloadReportPdf: vi.fn(),
  downloadReportXlsx: vi.fn(),
}));

const sampleReportData = {
  sections: [{ activities: [{ id: 1, title: 'Activity' }] }],
} as unknown as ReportDataResponse;

const sampleFields = [
  {
    key: 'title',
    label: 'Title',
    selected: true,
    section: 'General',
    order: 0,
  },
] as CustomReportFieldConfig[];

describe('handleReportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownloadCustomReportXlsx.mockResolvedValue(undefined);
    mockLoadCustomReportConfig.mockReturnValue(sampleFields);
  });

  it('awaits downloadCustomReportXlsx for custom xlsx exports', async () => {
    let resolveDownload!: () => void;
    const downloadPromise = new Promise<void>((resolve) => {
      resolveDownload = resolve;
    });
    mockDownloadCustomReportXlsx.mockReturnValue(downloadPromise);

    const exportPromise = handleReportExport({
      reportType: 'custom',
      format: 'xlsx',
      data: sampleReportData,
      queryParams: {},
      customReportFields: sampleFields,
    });

    await Promise.resolve();
    expect(mockDownloadCustomReportXlsx).toHaveBeenCalledWith(
      [{ id: 1, title: 'Activity' }],
      sampleFields
    );
    expect(exportPromise).toBeInstanceOf(Promise);

    resolveDownload();
    await exportPromise;
  });

  it('propagates rejections from downloadCustomReportXlsx', async () => {
    const error = new Error('export failed');
    mockDownloadCustomReportXlsx.mockRejectedValue(error);

    await expect(
      handleReportExport({
        reportType: 'custom',
        format: 'xlsx',
        data: sampleReportData,
        queryParams: {},
        customReportFields: sampleFields,
      })
    ).rejects.toThrow('export failed');
  });
});
