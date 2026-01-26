import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuthUser } from '@corpcal/shared';
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
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (user) {
      const bypass = this.policyService.bypassesDataScoping(user.roleName);
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
