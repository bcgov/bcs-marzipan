import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import {
  resolveDataScope,
  type RequestContext as RequestContextType,
} from '../dto/user-context.dto';

/**
 * Parameter decorator that provides type-safe request context (user + dataScope).
 * Use @RequestContext() when you need dataScope or both user and dataScope; use @CurrentUser() when you only need the authenticated user.
 *
 * DataScopeInterceptor sets request.dataScope; when absent (e.g. in tests), a default is returned.
 *
 * @example
 * // Full context
 * findAll(@RequestContext() ctx: RequestContext) {
 *   return this.service.findAll(ctx.dataScope);
 * }
 *
 * @example
 * // Only user (same as @CurrentUser() when you also need dataScope elsewhere in the handler)
 * getProfile(@RequestContext('user') user: AuthUser | undefined) { ... }
 *
 * @example
 * // Only dataScope
 * list(@RequestContext('dataScope') dataScope: DataScope) { ... }
 */
export const RequestContext = createParamDecorator(
  (
    data: keyof RequestContextType | undefined,
    ctx: ExecutionContext
  ): RequestContextType | RequestContextType[keyof RequestContextType] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    const dataScope = resolveDataScope(request.dataScope);
    const full: RequestContextType = { user, dataScope };

    if (data !== undefined) {
      return full[data];
    }
    return full;
  }
);
