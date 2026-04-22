import { describe, expect, it } from 'vitest';

import {
  getReportTemplate,
  isReportTemplateKey,
  REPORT_TEMPLATE_KEYS,
  REPORT_TEMPLATE_REGISTRY,
} from './reportTemplateRegistry';

describe('reportTemplateRegistry', () => {
  it('exposes a template for every key', () => {
    for (const key of REPORT_TEMPLATE_KEYS) {
      expect(typeof REPORT_TEMPLATE_REGISTRY[key]).toBe('function');
      const out = REPORT_TEMPLATE_REGISTRY[key](undefined);
      expect(out).toBeDefined();
    }
  });

  it('getReportTemplate returns the registered function', () => {
    const fn = getReportTemplate('LOOK_AHEAD');
    const out = fn(undefined);
    expect(typeof out).toBe('string');
    expect(out).toContain('data-report-template="LOOK_AHEAD"');
    expect(out).toContain('No report data loaded');
  });

  it('isReportTemplateKey narrows known keys', () => {
    expect(isReportTemplateKey('LOOK_AHEAD')).toBe(true);
    expect(isReportTemplateKey('unknown')).toBe(false);
  });
});
