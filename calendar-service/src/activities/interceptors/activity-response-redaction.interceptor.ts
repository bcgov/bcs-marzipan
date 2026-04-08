import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { AuthUser } from '@corpcal/shared';
import {
  isActivityResponsePayload,
  redactActivityResponse,
} from '@corpcal/shared/utils';

function redactSuccessDataBody(
  body: unknown,
  user: AuthUser | undefined
): unknown {
  if (!user || body === null || typeof body !== 'object') return body;
  const envelope = body as Record<string, unknown>;
  if (envelope.success !== true || !('data' in envelope)) return body;
  const data = envelope.data;

  if (isActivityResponsePayload(data)) {
    return {
      ...envelope,
      data: redactActivityResponse(data, user),
    };
  }

  if (
    Array.isArray(data) &&
    data.length > 0 &&
    isActivityResponsePayload(data[0])
  ) {
    return {
      ...envelope,
      data: data.map((item) =>
        isActivityResponsePayload(item)
          ? redactActivityResponse(item, user)
          : item
      ),
    };
  }

  return body;
}

/**
 * Applies field-level view redaction to ActivityResponse payloads in `{ success, data }` bodies.
 * Skips non-activity `data` (categories, history, etc.) via {@link isActivityResponsePayload}.
 */
@Injectable()
export class ActivityResponseRedactionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    return next
      .handle()
      .pipe(map((body: unknown) => redactSuccessDataBody(body, user)));
  }
}
