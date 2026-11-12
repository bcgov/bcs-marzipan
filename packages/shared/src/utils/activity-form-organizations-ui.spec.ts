import { describe, expect, it } from 'vitest';

import {
  mergeLeadAndJointOrganizations,
  organizationEntryIdentityKey,
  splitOrganizationFormEntries,
} from './activity-form-organizations-ui';

describe('activity-form-organizations-ui', () => {
  describe('organizationEntryIdentityKey', () => {
    it('uses id when organizationId is set', () => {
      expect(
        organizationEntryIdentityKey({ organizationId: 5, isLead: true })
      ).toBe('id:5');
    });

    it('uses trimmed lowercase name for freeform', () => {
      expect(
        organizationEntryIdentityKey({
          organizationName: '  Custom Org  ',
          isLead: false,
        })
      ).toBe('name:custom org');
    });
  });

  describe('splitOrganizationFormEntries', () => {
    it('splits lead and joints', () => {
      const entries = [
        { organizationId: 1, isLead: false },
        { organizationId: 2, isLead: true },
        { organizationName: 'Joint B', isLead: false },
      ];
      const { lead, joints } = splitOrganizationFormEntries(entries);
      expect(lead).toEqual({ organizationId: 2, isLead: true });
      expect(joints).toHaveLength(2);
    });
  });

  describe('mergeLeadAndJointOrganizations', () => {
    it('dedupes joint matching lead id', () => {
      const result = mergeLeadAndJointOrganizations(
        { organizationId: 1, isLead: true },
        [
          { organizationId: 1, isLead: false },
          { organizationId: 2, isLead: false },
        ]
      );
      expect(result).toEqual([
        { organizationId: 1, isLead: true },
        { organizationId: 2, isLead: false },
      ]);
    });

    it('dedupes joint matching lead freeform name case-insensitively', () => {
      const result = mergeLeadAndJointOrganizations(
        { organizationName: 'Agency A', isLead: true },
        [
          { organizationName: ' agency a ', isLead: false },
          { organizationName: 'Agency B', isLead: false },
        ]
      );
      expect(result).toEqual([
        { organizationName: 'Agency A', isLead: true },
        { organizationName: 'Agency B', isLead: false },
      ]);
    });

    it('returns joints only when lead is null', () => {
      const result = mergeLeadAndJointOrganizations(null, [
        { organizationId: 3, isLead: false },
      ]);
      expect(result).toEqual([{ organizationId: 3, isLead: false }]);
    });
  });
});
