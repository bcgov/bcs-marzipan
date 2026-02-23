import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';

/**
 * Guard for activity request-delete (comms contacts only).
 * Allows the request only if the user is a comms contact (lead or not) on the activity.
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

    const activityIdParam = request.params?.id;
    if (activityIdParam === undefined || activityIdParam === null) {
      throw new BadRequestException('Activity ID required');
    }

    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId) || !Number.isInteger(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }

    const isCommsContact = await this.policyService.isCommsContactForActivity(
      activityId,
      user.id
    );

    if (isCommsContact) {
      return true;
    }

    throw new ForbiddenException({
      message: 'Permission denied',
      required: 'Be a comms contact on this activity to request delete',
    });
  }
}
