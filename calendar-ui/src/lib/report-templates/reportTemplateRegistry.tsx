import { createElement, type ReactNode } from 'react';

import { formatTemplateDataStub } from './dataStub';
import { buildLookAheadLegacyPrintHtml } from './lookAheadLegacyPrintHtml';

/**
 * Report layout template keys for the UI registry.
 * Not wired to shared `ReportType` yet; integration can map API names to these keys later.
 */
export const REPORT_TEMPLATE_KEYS = [
  'LOOK_AHEAD',
  'EXEC_LOOK_AHEAD',
  'THIRTY_60_90',
  'PLANNING',
] as const;

export type ReportTemplateKey = (typeof REPORT_TEMPLATE_KEYS)[number];

/** Template output: static HTML string and/or a React tree. */
export type ReportTemplateRenderResult = string | ReactNode;

export type ReportTemplateFn = (data: unknown) => ReportTemplateRenderResult;

export function lookAheadReportTemplate(data: unknown): string {
  return buildLookAheadLegacyPrintHtml(data);
}

export function execLookAheadReportTemplate(data: unknown): ReactNode {
  const stub = formatTemplateDataStub(data);
  return createElement(
    'section',
    { 'data-report-template': 'EXEC_LOOK_AHEAD' },
    stub === ''
      ? 'EXEC_LOOK_AHEAD template placeholder'
      : `EXEC_LOOK_AHEAD template placeholder ${stub}`
  );
}

export function thirtySixtyNinetyReportTemplate(data: unknown): string {
  const stub = formatTemplateDataStub(data);
  const inner =
    stub === ''
      ? 'THIRTY_60_90 template placeholder'
      : `THIRTY_60_90 template placeholder<!--${stub}-->`;
  return `<section data-report-template="THIRTY_60_90">${inner}</section>`;
}

export function planningReportTemplate(data: unknown): string {
  const stub = formatTemplateDataStub(data);
  const inner =
    stub === ''
      ? 'PLANNING template placeholder'
      : `PLANNING template placeholder<!--${stub}-->`;
  return `<section data-report-template="PLANNING">${inner}</section>`;
}

export const REPORT_TEMPLATE_REGISTRY: Record<
  ReportTemplateKey,
  ReportTemplateFn
> = {
  LOOK_AHEAD: lookAheadReportTemplate,
  EXEC_LOOK_AHEAD: execLookAheadReportTemplate,
  THIRTY_60_90: thirtySixtyNinetyReportTemplate,
  PLANNING: planningReportTemplate,
};

export function isReportTemplateKey(value: string): value is ReportTemplateKey {
  return (REPORT_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function getReportTemplate(key: ReportTemplateKey): ReportTemplateFn {
  return REPORT_TEMPLATE_REGISTRY[key];
}
