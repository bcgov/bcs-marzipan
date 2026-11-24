import { PERMISSIONS, type PermissionKey } from '@corpcal/shared';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import type { ActivityTableRow } from '@/components/activity/ActivityTable/activityTableRow';

export type BulkEditScopeRow = Pick<
  ActivityTableRow,
  'id' | 'leadTeamId' | 'commsContactUserIds'
>;

export type HasPermissionFn = (permission: PermissionKey) => boolean;

export type ScopedBulkAction = {
  show: boolean;
  eligibleIds: number[];
  eligibleCount: number;
};

export type ResolvedActivityBulkMenu = {
  /** Show row selection column when the user may run any batch action. */
  canBulkSelect: boolean;
  /** Show the batch actions dropdown for the current selection. */
  hasBatchActionsMenu: boolean;
  canManageWatchlist: boolean;
  watchlistAdd: boolean;
  watchlistRemove: boolean;
  sharing: ScopedBulkAction;
  issue: ScopedBulkAction;
  tags: ScopedBulkAction;
  review: ScopedBulkAction;
  delete: ScopedBulkAction;
  flag: { show: boolean };
  unshare: { show: boolean };
};

export function isAdminBulkEditBypass(roleName: string | undefined): boolean {
  return (
    roleName === SYSTEM_ROLES.ADMIN || roleName === SYSTEM_ROLES.SYSTEM_ADMIN
  );
}

/** Mirrors {@link assertCanBulkEditActivity} using list-row data (comms contacts + lead team). */
export function isBulkEditableActivity(
  row: BulkEditScopeRow,
  userId: number,
  teamIds: number[],
  roleName: string | undefined
): boolean {
  if (isAdminBulkEditBypass(roleName)) {
    return true;
  }
  if (row.leadTeamId != null && teamIds.includes(row.leadTeamId)) {
    return true;
  }
  if (row.commsContactUserIds.includes(userId)) {
    return true;
  }
  return false;
}

export function bulkEditableActivityIds(
  rows: BulkEditScopeRow[],
  userId: number,
  teamIds: number[],
  roleName: string | undefined
): number[] {
  return rows
    .filter((row) => isBulkEditableActivity(row, userId, teamIds, roleName))
    .map((row) => row.id);
}

function scopedBulkAction(
  show: boolean,
  rows: BulkEditScopeRow[],
  userId: number,
  teamIds: number[],
  roleName: string | undefined
): ScopedBulkAction {
  if (!show) {
    return { show: false, eligibleIds: [], eligibleCount: 0 };
  }
  const eligibleIds = bulkEditableActivityIds(rows, userId, teamIds, roleName);
  return {
    show: eligibleIds.length > 0,
    eligibleIds,
    eligibleCount: eligibleIds.length,
  };
}

export type ResolveActivityBulkMenuInput = {
  hasPermission: HasPermissionFn;
  userId: number | undefined;
  teamIds: number[];
  roleName: string | undefined;
  canUnshare: boolean;
  selectedRows: BulkEditScopeRow[];
  watchlistIds: number[];
};

export function resolveActivityBulkMenu(
  input: ResolveActivityBulkMenuInput
): ResolvedActivityBulkMenu {
  const {
    hasPermission,
    userId,
    teamIds,
    roleName,
    canUnshare,
    selectedRows,
    watchlistIds,
  } = input;

  const canManageWatchlist = hasPermission(PERMISSIONS.FAVOURITES.MANAGE);
  const canEdit = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);
  const canBulkIssue = hasPermission(PERMISSIONS.ACTIVITIES.BULK_ISSUE);
  const canBulkTags = hasPermission(PERMISSIONS.ACTIVITIES.BULK_TAGS);
  const canBulkShare = hasPermission(PERMISSIONS.ACTIVITIES.BULK_SHARE);
  const canReview = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);
  const canDelete = hasPermission(PERMISSIONS.ACTIVITIES.DELETE);
  const canFlag = hasPermission(PERMISSIONS.ACTIVITIES.FLAG);

  const resolvedUserId = userId ?? -1;
  const watchlistSet = new Set(watchlistIds);
  const selectedIds = selectedRows.map((row) => row.id);

  const watchlistAdd =
    canManageWatchlist && selectedIds.some((id) => !watchlistSet.has(id));
  const watchlistRemove =
    canManageWatchlist && selectedIds.some((id) => watchlistSet.has(id));

  const sharing = scopedBulkAction(
    canBulkShare && canEdit,
    selectedRows,
    resolvedUserId,
    teamIds,
    roleName
  );
  const issue = scopedBulkAction(
    canBulkIssue && canEdit,
    selectedRows,
    resolvedUserId,
    teamIds,
    roleName
  );
  const tags = scopedBulkAction(
    canBulkTags && canEdit,
    selectedRows,
    resolvedUserId,
    teamIds,
    roleName
  );
  const review = scopedBulkAction(
    canReview,
    selectedRows,
    resolvedUserId,
    teamIds,
    roleName
  );
  const deleteAction = scopedBulkAction(
    canDelete,
    selectedRows,
    resolvedUserId,
    teamIds,
    roleName
  );

  const flag = { show: canFlag && selectedRows.length > 0 };
  const unshare = { show: canUnshare };

  const canBulkSelect =
    canManageWatchlist ||
    canUnshare ||
    (canBulkShare && canEdit) ||
    (canBulkIssue && canEdit) ||
    (canBulkTags && canEdit) ||
    canReview ||
    canDelete ||
    canFlag;

  const hasBatchActionsMenu =
    selectedRows.length > 0 &&
    (watchlistAdd ||
      watchlistRemove ||
      sharing.show ||
      issue.show ||
      tags.show ||
      review.show ||
      deleteAction.show ||
      flag.show ||
      unshare.show);

  return {
    canBulkSelect,
    hasBatchActionsMenu,
    canManageWatchlist,
    watchlistAdd,
    watchlistRemove,
    sharing,
    issue,
    tags,
    review,
    delete: deleteAction,
    flag,
    unshare,
  };
}

export function bulkDialogTargetCount(
  bulkDialog: 'review' | 'issue' | 'tags' | 'sharing' | 'flag' | 'delete',
  menu: ResolvedActivityBulkMenu,
  selectedActivityCount: number
): number {
  switch (bulkDialog) {
    case 'sharing':
      return menu.sharing.eligibleCount;
    case 'issue':
      return menu.issue.eligibleCount;
    case 'tags':
      return menu.tags.eligibleCount;
    case 'review':
      return menu.review.eligibleCount;
    case 'delete':
      return menu.delete.eligibleCount;
    case 'flag':
      return selectedActivityCount;
    default:
      return selectedActivityCount;
  }
}

export function bulkDialogEligibleIds(
  bulkDialog: 'review' | 'issue' | 'tags' | 'sharing' | 'flag' | 'delete',
  menu: ResolvedActivityBulkMenu,
  selectedActivityIds: Iterable<number>
): number[] {
  if (bulkDialog === 'flag') {
    return [...selectedActivityIds];
  }
  switch (bulkDialog) {
    case 'sharing':
      return menu.sharing.eligibleIds;
    case 'issue':
      return menu.issue.eligibleIds;
    case 'tags':
      return menu.tags.eligibleIds;
    case 'review':
      return menu.review.eligibleIds;
    case 'delete':
      return menu.delete.eligibleIds;
    default:
      return [...selectedActivityIds];
  }
}
