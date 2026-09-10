import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

/**
 * Guard for removing a single team from an activity's Shared With list.
 * Requires activities.unshare (enforced by @RequirePermission) and membership on the
 * team being removed (or a bypass role). Does not require lead-team/comms-contact
 * status — this only lets a user remove their own team's share, not manage the full list.
 */
@Injectable()
export class CanUnshareActivityTeamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const teamIdParam = request.params?.teamId;
    if (teamIdParam === undefined || teamIdParam === null) {
      throw new BadRequestException('Team ID required');
    }

    const teamId = Number(teamIdParam);
    if (Number.isNaN(teamId) || !Number.isInteger(teamId)) {
      throw new BadRequestException('Invalid team ID');
    }

    const isBypass =
      user.roleName === SYSTEM_ROLES.ADMIN ||
      user.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
    if (isBypass) {
      return true;
    }

    const isOwnTeam =
      Array.isArray(user.teamIds) && user.teamIds.includes(teamId);
    if (isOwnTeam) {
      return true;
    }

    throw new ForbiddenException(
      'You may only unshare an activity from a team you belong to.'
    );
  }
}
