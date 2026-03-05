import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';

/**
 * Guard for activity restore (comms contacts, lead-team members, or admin/sysAdmin).
 * Allows the request if the user is a comms contact on the activity, a member of the
 * activity's lead team, or has admin/systemAdmin role.
 * Business rule validation (status is delete_requested or deleted) is done in the service.
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
