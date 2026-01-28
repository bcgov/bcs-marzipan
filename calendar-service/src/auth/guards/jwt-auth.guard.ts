import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService, type JwtPayload } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
      cookies?: Record<string, string>;
      user?: unknown;
    }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = this.authService.validatePayload(payload);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract JWT from request.
   * Priority: Authorization header first (API clients), then httpOnly cookie (browser).
   */
  private extractToken(request: {
    headers?: { authorization?: string };
    cookies?: Record<string, string>;
  }): string | null {
    // 1. Try Authorization header first (API clients, Postman, etc.)
    const auth = request.headers?.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    // 2. Fall back to httpOnly cookie (browser)
    return request.cookies?.access_token ?? null;
  }
}
