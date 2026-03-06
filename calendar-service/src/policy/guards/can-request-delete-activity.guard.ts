import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';

/**
 * Guard for activity request-delete.
 * Requires (1) activities.requestDelete permission, and (2) user is a comms contact
 * on the activity or a member of the activity's lead team.
 * Business rule validation (status not already delete_requested/deleted) is done in the service.
 */
@Injectable()
export class CanRequestDeleteActivityGuard implements CanActivate {
  constructor(private readonly policyService: PolicyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasPermission =
      user.permissions?.includes(PERMISSIONS.ACTIVITIES.REQUEST_DELETE) ??
      false;
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to request deletion of activities.'
      );
    }

    const activityIdParam = request.params?.id;
    if (activityIdParam === undefined || activityIdParam === null) {
      throw new BadRequestException('Activity ID required');
    }

    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId) || !Number.isInteger(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }

    const [isCommsContact, leadTeamId] = await Promise.all([
      this.policyService.isCommsContactForActivity(activityId, user.id),
      this.policyService.getLeadTeamIdForActivity(activityId),
    ]);

    if (isCommsContact) {
      return true;
    }

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
        "Be a comms contact or a member of the activity's lead team to request delete",
    });
  }
}
