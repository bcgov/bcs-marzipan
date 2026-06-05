/**
 * React Query key factory for `/reports/data` queries.
 */

export const reportQueryKeys = {
  all: ['report-data'] as const,
  data: (type: string, paramsKey: string) =>
    ['report-data', type, paramsKey] as const,
} as const;
