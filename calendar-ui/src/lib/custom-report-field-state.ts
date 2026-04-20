import {
  DEFAULT_CUSTOM_REPORT_FIELD_CONFIG,
  type CustomReportFieldConfig,
} from '@corpcal/shared/reports/customReportFieldConfig';

export function cloneDefaultCustomReportFields(): CustomReportFieldConfig[] {
  return DEFAULT_CUSTOM_REPORT_FIELD_CONFIG.map((f) => ({ ...f }));
}
