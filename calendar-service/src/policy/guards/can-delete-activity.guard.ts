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
 * Allows the request if the user has activities.delete permission OR is the comms lead for the activity.
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

    const hasPermission =
      user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE) ?? false;

    if (hasPermission) {
      return true;
    }

    const isCommsLead = await this.policyService.isCommsLeadForActivity(
      activityId,
      user.id
    );

    if (isCommsLead) {
      return true;
    }

    throw new ForbiddenException({
      message: 'Permission denied',
      required: [
        PERMISSIONS.ACTIVITIES.DELETE,
        'or be the comms lead for this activity',
      ],
    });
  }
}
