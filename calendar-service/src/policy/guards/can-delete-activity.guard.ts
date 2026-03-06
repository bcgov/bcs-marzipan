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
 * Guard for activity delete (hard and soft).
 * Requires activities.delete and (comms contact OR lead-team member OR activities.delete.any).
 * Users without delete.any may only delete activities where they are a comms contact or lead-team member.
 */
@Injectable()
export class CanDeleteActivityGuard implements CanActivate {
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
    if (Number.isNaN(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }

    const hasDeletePermission =
      user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE) ?? false;
    if (!hasDeletePermission) {
      throw new ForbiddenException(
        'You do not have the required permission to delete activities.'
      );
    }

    const hasDeleteAny =
      user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ?? false;
    if (hasDeleteAny) {
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
      'You may only delete activities where you are a comms contact or lead-team member, or have activities.delete.any.'
    );
  }
}
