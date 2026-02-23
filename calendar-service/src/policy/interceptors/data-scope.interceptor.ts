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
 * - bypass: true for Advanced, Admin, and System Admin (see all data)
 */
@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  constructor(private readonly policyService: PolicyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (user) {
      const bypass = this.policyService.bypassesDataScoping(user.roleName);
      request.dataScope = {
        teamIds: bypass ? [] : (user.teamIds ?? []),
        bypass,
      } satisfies DataScope;
      // #region agent log
      fetch(
        'http://127.0.0.1:7242/ingest/d7babf38-8e48-44d1-9cb2-88c37682cecb',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'caffe0',
          },
          body: JSON.stringify({
            sessionId: 'caffe0',
            location: 'data-scope.interceptor.ts:intercept',
            message: 'DataScopeInterceptor set dataScope',
            data: {
              roleName: user.roleName,
              roleId: user.roleId,
              bypass,
              teamIds: request.dataScope.teamIds,
            },
            timestamp: Date.now(),
            hypothesisId: 'H1',
          }),
        }
      ).catch(() => {});
      // #endregion
    } else {
      request.dataScope = { teamIds: [], bypass: false } satisfies DataScope;
    }

    return next.handle();
  }
}
