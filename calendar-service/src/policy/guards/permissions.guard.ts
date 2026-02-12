import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import {
  PERMISSIONS_METADATA_KEY,
  type PermissionsMetadata,
} from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<PermissionsMetadata>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!metadata || !metadata.keys || metadata.keys.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('Authentication required');
    }

    const hasAccess =
      metadata.mode === 'all'
        ? metadata.keys.every((k) => user.permissions.includes(k))
        : metadata.keys.some((k) => user.permissions.includes(k));

    if (!hasAccess) {
      throw new ForbiddenException({
        message: 'Permission denied',
        required: metadata.keys,
      });
    }

    return true;
  }
}
