import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import {
  normalizeActivityStatusLabel,
  PERMISSIONS,
  SYSTEM_ROLES,
  type AuthUser,
} from '@corpcal/shared';

import { PolicyService } from '../policy.service';

/**
 * Guard for activity clone (`POST /activities/:id/clone`).
 *
 * Clone reuses `activities.create` (enforced by `@RequirePermission`) plus the
 * same edit eligibility as PATCH/PUT on the **source** activity: Admin /
 * System Admin bypass, comms contact, or lead-team member.
 *
 * When the source is in a blocked status (`delete_requested` or `deleted`) the
 * user must additionally hold `activities.delete.any` — mirroring who is
 * allowed to edit blocked activities in the UI.
 */
@Injectable()
export class CanCloneActivityGuard implements CanActivate {
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

    const statusName =
      await this.policyService.getActivityStatusNameForActivity(activityId);
    const normalizedStatus = normalizeActivityStatusLabel(statusName ?? '');
    const isBlockedStatus =
      normalizedStatus === 'delete_requested' || normalizedStatus === 'deleted';

    if (isBlockedStatus) {
      const hasDeleteAny =
        user.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ?? false;
      if (!hasDeleteAny) {
        throw new ForbiddenException(
          'Cloning an activity in delete requested or deleted status requires activities.delete.any'
        );
      }
    }

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
      'You may only clone activities where you are a comms contact, a lead-team member, or an admin.'
    );
  }
}
