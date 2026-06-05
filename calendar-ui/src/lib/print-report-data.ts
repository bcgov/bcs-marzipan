import type { ComponentProps } from 'react';

import type { ReportDataResponse } from '@corpcal/shared/api/types';
import type { PrintReportDocument } from '@corpcal/shared/reports/reportPrintHtml';

/** Input shape expected by shared print React components. */
export type PrintReportDocumentData = ComponentProps<
  typeof PrintReportDocument
>['data'];

/**
 * Maps API report data to print component input.
 * Print components resolve from shared src; API types resolve from shared dist,
 * so branded date types differ at compile time despite matching at runtime.
 */
export function toPrintReportDocumentData(
  data: ReportDataResponse
): PrintReportDocumentData {
  return data as PrintReportDocumentData;
}
