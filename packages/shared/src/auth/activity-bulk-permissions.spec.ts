import { describe, expect, it } from 'vitest';

import {
  hasAllPermissions,
  requiredPermissionsForBulkUpdateOperation,
} from './activity-bulk-permissions';
import { PERMISSIONS } from './constants';

describe('activity-bulk-permissions', () => {
  it('requires bulk.issue and edit for issue', () => {
    expect(requiredPermissionsForBulkUpdateOperation('issue')).toEqual([
      PERMISSIONS.ACTIVITIES.BULK_ISSUE,
      PERMISSIONS.ACTIVITIES.EDIT,
    ]);
  });

  it('requires bulk.share and edit for sharedWith', () => {
    expect(requiredPermissionsForBulkUpdateOperation('sharedWith')).toEqual([
      PERMISSIONS.ACTIVITIES.BULK_SHARE,
      PERMISSIONS.ACTIVITIES.EDIT,
    ]);
  });

  it('requires only review for review', () => {
    expect(requiredPermissionsForBulkUpdateOperation('review')).toEqual([
      PERMISSIONS.ACTIVITIES.REVIEW,
    ]);
  });

  it('checks hasAllPermissions', () => {
    expect(
      hasAllPermissions(
        [PERMISSIONS.ACTIVITIES.BULK_SHARE, PERMISSIONS.ACTIVITIES.EDIT],
        requiredPermissionsForBulkUpdateOperation('sharedWith')
      )
    ).toBe(true);
    expect(
      hasAllPermissions(
        [PERMISSIONS.ACTIVITIES.EDIT],
        requiredPermissionsForBulkUpdateOperation('sharedWith')
      )
    ).toBe(false);
  });
});
