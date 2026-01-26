import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '@corpcal/shared';
import {
  ROLES_METADATA_KEY,
  type RolesMetadata,
} from '../decorators/require-role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<RolesMetadata>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!metadata || !metadata.roleNames || metadata.roleNames.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user || !user.roleName) {
      throw new ForbiddenException('Authentication required');
    }

    const hasAccess = metadata.roleNames.includes(user.roleName);

    if (!hasAccess) {
      throw new ForbiddenException({
        message: 'Insufficient role',
        required: metadata.roleNames,
      });
    }

    return true;
  }
}
