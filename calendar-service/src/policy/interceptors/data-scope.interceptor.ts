import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';

import type { DataScope } from '../dto/user-context.dto';
import { PolicyService } from '../policy.service';

/**
 * Attaches dataScope to the request for use by handlers/services.
 * Run after JwtAuthGuard so request.user is set.
 *
 * request.dataScope = { teamIds, bypass }
 * - teamIds: from user.teamIds (empty if bypass)
 * - bypass: from user.bypassDataScoping (set at login from user + team roles)
 */
@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  constructor(private readonly policyService: PolicyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (user) {
      const bypass =
        typeof user.bypassDataScoping === 'boolean'
          ? user.bypassDataScoping
          : this.policyService.bypassesDataScoping(user.roleName);
      request.dataScope = {
        teamIds: bypass ? [] : (user.teamIds ?? []),
        bypass,
      } satisfies DataScope;
    } else {
      request.dataScope = { teamIds: [], bypass: false } satisfies DataScope;
    }

    return next.handle();
  }
}
