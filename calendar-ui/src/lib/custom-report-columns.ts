import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';

/** All fields sorted by `order` (modal + table column sequence). */
export function getCustomReportFieldsSortedByOrder(
  config: CustomReportFieldConfig[]
): CustomReportFieldConfig[] {
  return [...config].sort((a, b) => a.order - b.order);
}

/**
 * Selected fields in display order — used by preview, XLSX, and print alignment.
 * Sorts only among selected fields by `order` so column order stays independent
 * of unselected fields (matches TanStack leaf column order after reorder).
 */
export function getSelectedCustomReportColumns(
  config: CustomReportFieldConfig[]
): CustomReportFieldConfig[] {
  return [...config]
    .filter((f) => f.selected)
    .sort((a, b) => a.order - b.order);
}
