import { ForbiddenException } from '@nestjs/common';

import { PERMISSIONS } from '@corpcal/shared';

/**
 * Enforces report-type access beyond the controller gate
 * (`reports.view` OR `look_ahead.view` on data routes).
 */
export function assertReportTypeAccess(
  reportName: string,
  permissions: string[] | undefined
): void {
  const normalized = reportName.trim().toLowerCase();
  const perms = permissions ?? [];
  const has = (key: string) => perms.includes(key);
  const canReportsView = has(PERMISSIONS.REPORTS.VIEW);
  const canLookAheadView = has(PERMISSIONS.LOOK_AHEAD.VIEW);
  const canExecView = has(PERMISSIONS.LOOK_AHEAD.EXEC_VIEW);

  if (normalized === 'look-ahead') {
    if (!canLookAheadView && !canReportsView) {
      throw new ForbiddenException({
        message: 'Permission denied',
        required: [PERMISSIONS.LOOK_AHEAD.VIEW, PERMISSIONS.REPORTS.VIEW],
      });
    }
    return;
  }

  if (normalized === 'exec') {
    if (!canExecView && !canReportsView) {
      throw new ForbiddenException({
        message: 'Permission denied',
        required: [PERMISSIONS.LOOK_AHEAD.EXEC_VIEW, PERMISSIONS.REPORTS.VIEW],
      });
    }
    return;
  }

  if (!canReportsView) {
    throw new ForbiddenException({
      message: 'Permission denied',
      required: [PERMISSIONS.REPORTS.VIEW],
    });
  }
}
