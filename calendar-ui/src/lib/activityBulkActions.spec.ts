import { describe, expect, it } from 'vitest';

import { PERMISSIONS, type PermissionKey } from '@corpcal/shared';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';

import {
  bulkEditableActivityIds,
  isBulkEditableActivity,
  resolveActivityBulkMenu,
} from './activityBulkActions';

const baseRow = {
  id: 1,
  leadTeamId: 10,
  commsContactUserIds: [5],
};

describe('activityBulkActions', () => {
  describe('isBulkEditableActivity', () => {
    it('allows admin bypass without lead team or comms contact', () => {
      expect(
        isBulkEditableActivity(
          { id: 1, leadTeamId: null, commsContactUserIds: [] },
          2,
          [],
          SYSTEM_ROLES.ADMIN
        )
      ).toBe(true);
    });

    it('allows lead team members', () => {
      expect(isBulkEditableActivity(baseRow, 2, [10], 'Editor')).toBe(true);
    });

    it('allows comms contacts', () => {
      expect(
        isBulkEditableActivity(
          { id: 1, leadTeamId: 99, commsContactUserIds: [2, 5] },
          2,
          [],
          'Editor'
        )
      ).toBe(true);
    });

    it('denies shared-with-only viewers', () => {
      expect(isBulkEditableActivity(baseRow, 2, [20], 'Editor')).toBe(false);
    });
  });

  describe('resolveActivityBulkMenu', () => {
    const editorPerms = new Set<PermissionKey>([
      PERMISSIONS.ACTIVITIES.BULK_SHARE,
      PERMISSIONS.ACTIVITIES.EDIT,
      PERMISSIONS.FAVOURITES.MANAGE,
    ]);

    it('enables batch select for watchlist-only viewers', () => {
      const menu = resolveActivityBulkMenu({
        hasPermission: (key) => key === PERMISSIONS.FAVOURITES.MANAGE,
        userId: 1,
        teamIds: [],
        roleName: 'Viewer',
        canUnshare: false,
        selectedRows: [baseRow],
        watchlistIds: [],
      });
      expect(menu.canBulkSelect).toBe(true);
      expect(menu.watchlistAdd).toBe(true);
      expect(menu.sharing.show).toBe(false);
    });

    it('shows shared with only when selection includes editable activities', () => {
      const editable = resolveActivityBulkMenu({
        hasPermission: (key) => editorPerms.has(key),
        userId: 2,
        teamIds: [10],
        roleName: 'Editor',
        canUnshare: false,
        selectedRows: [baseRow],
        watchlistIds: [],
      });
      expect(editable.sharing.show).toBe(true);
      expect(editable.sharing.eligibleCount).toBe(1);

      const notEditable = resolveActivityBulkMenu({
        hasPermission: (key) => editorPerms.has(key),
        userId: 2,
        teamIds: [20],
        roleName: 'Editor',
        canUnshare: false,
        selectedRows: [baseRow],
        watchlistIds: [],
      });
      expect(notEditable.sharing.show).toBe(false);
    });

    it('hides review without review permission', () => {
      const menu = resolveActivityBulkMenu({
        hasPermission: (key) => editorPerms.has(key),
        userId: 2,
        teamIds: [10],
        roleName: 'Editor',
        canUnshare: false,
        selectedRows: [baseRow],
        watchlistIds: [],
      });
      expect(menu.review.show).toBe(false);
    });

    it('hides issue and tags without bulk issue or tags permissions', () => {
      const menu = resolveActivityBulkMenu({
        hasPermission: (key) => editorPerms.has(key),
        userId: 2,
        teamIds: [10],
        roleName: 'Editor',
        canUnshare: false,
        selectedRows: [baseRow],
        watchlistIds: [],
      });
      expect(menu.issue.show).toBe(false);
      expect(menu.tags.show).toBe(false);
    });

    it('shows unshare when canUnshare is true without bulk share', () => {
      const menu = resolveActivityBulkMenu({
        hasPermission: (key) => key === PERMISSIONS.ACTIVITIES.VIEW,
        userId: 2,
        teamIds: [10],
        roleName: 'Editor',
        canUnshare: true,
        selectedRows: [baseRow],
        watchlistIds: [],
      });
      expect(menu.sharing.show).toBe(false);
      expect(menu.unshare.show).toBe(true);
    });
  });

  describe('bulkEditableActivityIds', () => {
    it('filters to editable rows only', () => {
      expect(
        bulkEditableActivityIds(
          [
            baseRow,
            { id: 2, leadTeamId: 10, commsContactUserIds: [] },
            { id: 3, leadTeamId: 20, commsContactUserIds: [] },
          ],
          2,
          [10],
          'Editor'
        )
      ).toEqual([1, 2]);
    });
  });
});
