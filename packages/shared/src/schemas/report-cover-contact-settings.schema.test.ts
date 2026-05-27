import { describe, expect, it } from 'vitest';

import { reportCoverContactSettingsSchema } from './report-cover-contact-settings.schema';

describe('reportCoverContactSettingsSchema', () => {
  it('accepts plain display text for contactEmail', () => {
    const result = reportCoverContactSettingsSchema.safeParse({
      contactPhone: '555-555-3498',
      contactEmail: 'GCPE inbox (see SharePoint)',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactEmail).toBe('GCPE inbox (see SharePoint)');
    }
  });

  it('accepts email-shaped display text for contactEmail', () => {
    const result = reportCoverContactSettingsSchema.safeParse({
      contactPhone: '',
      contactEmail: 'gcpe@example.com',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactEmail).toBe('gcpe@example.com');
    }
  });

  it('trims contactEmail and rejects values over max length', () => {
    const result = reportCoverContactSettingsSchema.safeParse({
      contactPhone: '',
      contactEmail: `  ${'a'.repeat(255)}  `,
    });

    expect(result.success).toBe(false);
  });
});
