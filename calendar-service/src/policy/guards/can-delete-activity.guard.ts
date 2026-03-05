import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

/**
 * Guard for activity delete (hard and soft).
 * Requires activities.delete permission; no context (e.g. comms lead) can bypass this.
 * Viewers and others without the permission cannot delete, even if other context checks would pass.
 */
@Injectable()
export class CanDeleteActivityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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

    throw new ForbiddenException(
      'You do not have the required permission to delete activities.'
    );
  }
}
