import { describe, expect, it } from 'vitest';

import { formHasLeadOrganizationForOriginInference } from './resolve-form-organizations';

describe('formHasLeadOrganizationForOriginInference', () => {
  it('is false when there are no organizations', () => {
    expect(formHasLeadOrganizationForOriginInference([])).toBe(false);
  });

  it('is false when no lead row is present', () => {
    expect(
      formHasLeadOrganizationForOriginInference([
        { organizationId: 2, isLead: false },
      ])
    ).toBe(false);
  });

  it('is false when lead row has no id or name', () => {
    expect(formHasLeadOrganizationForOriginInference([{ isLead: true }])).toBe(
      false
    );
  });

  it('is true when lead has catalog id', () => {
    expect(
      formHasLeadOrganizationForOriginInference([
        { organizationId: 2, isLead: true },
      ])
    ).toBe(true);
  });

  it('is true when lead has freeform name', () => {
    expect(
      formHasLeadOrganizationForOriginInference([
        { organizationName: 'Partner', isLead: true },
      ])
    ).toBe(true);
  });
});
