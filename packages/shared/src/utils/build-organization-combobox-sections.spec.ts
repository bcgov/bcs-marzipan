import { describe, expect, it } from 'vitest';

import {
  buildOrganizationComboboxSections,
  ORGANIZATION_COMBOBOX_OTHER_HEADING,
} from './build-organization-combobox-sections';

describe('buildOrganizationComboboxSections', () => {
  it('groups by type, orders sections by type sort_order, orgs alphabetically within', () => {
    const sections = buildOrganizationComboboxSections([
      {
        value: 3,
        label: 'Zebra Ministry',
        organizationTypeId: 1,
        organizationTypeDisplayName: 'Ministry',
        organizationTypeSortOrder: 1,
      },
      {
        value: 1,
        label: 'Alpha Ministry',
        organizationTypeId: 1,
        organizationTypeDisplayName: 'Ministry',
        organizationTypeSortOrder: 1,
      },
      {
        value: 10,
        label: 'BC Health',
        organizationTypeId: 5,
        organizationTypeDisplayName: 'Health Authority',
        organizationTypeSortOrder: 5,
      },
      {
        value: 99,
        label: 'Custom Org',
        organizationTypeId: null,
        organizationTypeDisplayName: null,
        organizationTypeSortOrder: null,
      },
    ]);

    expect(sections.map((s) => s.heading)).toEqual([
      'Ministry',
      'Health Authority',
      ORGANIZATION_COMBOBOX_OTHER_HEADING,
    ]);
    expect(sections[0].options.map((o) => o.label)).toEqual([
      'Alpha Ministry',
      'Zebra Ministry',
    ]);
    expect(sections[2].options[0].label).toBe('Custom Org');
  });

  it('ties type sort_order by heading name', () => {
    const sections = buildOrganizationComboboxSections([
      {
        value: 1,
        label: 'A',
        organizationTypeId: 2,
        organizationTypeDisplayName: 'Agency',
        organizationTypeSortOrder: 1,
      },
      {
        value: 2,
        label: 'B',
        organizationTypeId: 3,
        organizationTypeDisplayName: 'Board',
        organizationTypeSortOrder: 1,
      },
    ]);

    expect(sections.map((s) => s.heading)).toEqual(['Agency', 'Board']);
  });
});
