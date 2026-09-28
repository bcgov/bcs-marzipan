import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PERMISSIONS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

/**
 * True when the user may remove `teamId` from an activity's Shared With list.
 * Membership on the team is required unless the user has activities.unshare.all
 * or a bypass role. Lead-team / comms-contact status is deliberately not required:
 * unsharing opts a team out of a share, it does not manage the full list.
 */
export function canUnshareTeam(user: AuthUser, teamId: number): boolean {
  if (
    user.roleName === SYSTEM_ROLES.ADMIN ||
    user.roleName === SYSTEM_ROLES.SYSTEM_ADMIN
  ) {
    return true;
  }

  if (user.permissions?.includes(PERMISSIONS.ACTIVITIES.UNSHARE_ALL)) {
    return true;
  }

  return Array.isArray(user.teamIds) && user.teamIds.includes(teamId);
}

/**
 * Guard for removing a single team from an activity's Shared With list.
 * Permission (activities.unshare or activities.unshare.all) is enforced by the
 * route decorator; this guard enforces which team may be removed.
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

    if (canUnshareTeam(user, teamId)) {
      return true;
    }

    throw new ForbiddenException(
      'You may only unshare an activity from a team you belong to.'
    );
  }
}
