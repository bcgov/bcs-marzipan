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
 * Guard for activity update (PATCH and PUT).
 * Requires activities.edit (enforced by @RequirePermission) and at least one of:
 * comms contact, member of the activity's lead team, or bypass role (Admin / System Admin).
 * Users with only "shared with" access get 403 (view-only).
 */
@Injectable()
export class CanEditActivityGuard implements CanActivate {
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

    const isBypass =
      user.roleName === SYSTEM_ROLES.ADMIN ||
      user.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
    if (isBypass) {
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

    throw new ForbiddenException(
      'You may only edit activities where you are a comms contact or lead-team member. This activity is shared with your team for viewing only.'
    );
  }
}
