import type { ReactNode } from 'react';

import {
  getReportTemplate,
  isReportTemplateKey,
} from './reportTemplateRegistry';

export type GenerateReportHTMLResult = string | ReactNode;

/**
 * Resolves the registered layout template for `reportType` and renders it with `data`.
 * Does not run sanitization or PDF conversion — callers own that when integrating exports.
 */
export function generateReportHTML(
  reportType: string,
  data: unknown
): GenerateReportHTMLResult {
  if (!isReportTemplateKey(reportType)) {
    throw new Error(`Unknown report template key: ${reportType}`);
  }
  return getReportTemplate(reportType)(data);
}
