import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PERMISSIONS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';

/**
 * Guard for activity restore. Status-aware:
 * - Deleted: requires activities.delete.any (admin-only restore).
 * - Delete requested: requires (activities.requestDelete OR activities.delete OR activities.delete.any)
 *   AND (admin/sysAdmin OR comms contact OR lead-team member).
 * Other statuses: allow (service returns 400).
 */
@Injectable()
export class CanRestoreActivityGuard implements CanActivate {
  constructor(private readonly policyService: PolicyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const activityIdParam = request.params?.id;
    if (activityIdParam === undefined || activityIdParam === null) {
      throw new BadRequestException('Activity ID required');
    }

    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId) || !Number.isInteger(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }

    const statusName =
      await this.policyService.getActivityStatusNameForActivity(activityId);
    const status = statusName?.toLowerCase() ?? '';

    if (status !== 'delete_requested' && status !== 'deleted') {
      if (status === '') {
        throw new ForbiddenException(
          'Activity not found or status unknown; cannot restore.'
        );
      }
      return true;
    }

    if (status === 'deleted') {
      const hasDeleteAny =
        user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ?? false;
      if (!hasDeleteAny) {
        throw new ForbiddenException(
          'Restore from deleted requires activities.delete.any'
        );
      }
      return true;
    }

    const hasRestorePermission =
      (user.permissions?.includes(PERMISSIONS.ACTIVITIES.REQUEST_DELETE) ||
        user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE) ||
        user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY)) ??
      false;
    if (!hasRestorePermission) {
      throw new ForbiddenException(
        'You do not have permission to restore this activity.'
      );
    }

    const isAdmin =
      user.roleName === SYSTEM_ROLES.ADMIN ||
      user.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
    if (isAdmin) {
      return true;
    }

    const isCommsContact = await this.policyService.isCommsContactForActivity(
      activityId,
      user.id
    );
    if (isCommsContact) {
      return true;
    }

    const leadTeamId =
      await this.policyService.getLeadTeamIdForActivity(activityId);
    const isLeadTeamMember =
      leadTeamId != null &&
      Array.isArray(user.teamIds) &&
      user.teamIds.includes(leadTeamId);
    if (isLeadTeamMember) {
      return true;
    }

    throw new ForbiddenException({
      message: 'Permission denied',
      required:
        "Be a comms contact, a member of the activity's lead team, or an admin to restore",
    });
  }
}
