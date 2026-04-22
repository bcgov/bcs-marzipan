import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { ACCESS_TOKEN_COOKIE } from '@corpcal/shared';

import { AuthService } from '../auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: {
  isPublic?: boolean;
  authorization?: string;
  cookies?: Record<string, string>;
}): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({
        headers: { authorization: overrides.authorization },
        cookies: overrides.cookies ?? {},
        user: undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockReflector: { getAllAndOverride: Mock };
  let mockJwtService: { verify: Mock };
  let mockAuthService: {
    validatePayload: Mock;
    hashToken: Mock;
    validateAndTouchSession: Mock;
  };

  beforeEach(async () => {
    mockReflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    mockJwtService = { verify: vi.fn() };
    mockAuthService = {
      validatePayload: vi.fn().mockReturnValue({ id: 1, username: 'alice' }),
      hashToken: vi.fn().mockReturnValue('hash-abc'),
      validateAndTouchSession: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  // -------------------------------------------------------------------------
  // Public routes
  // -------------------------------------------------------------------------

  describe('public routes', () => {
    it('returns true without touching the token or session', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext({});

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockJwtService.verify).not.toHaveBeenCalled();
      expect(mockAuthService.validateAndTouchSession).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Missing token
  // -------------------------------------------------------------------------

  describe('missing token', () => {
    it('throws UnauthorizedException when no Authorization header or cookie', async () => {
      const ctx = makeContext({});

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Authentication required')
      );
    });
  });

  // -------------------------------------------------------------------------
  // Invalid / expired JWT
  // -------------------------------------------------------------------------

  describe('invalid JWT', () => {
    it('throws UnauthorizedException when jwtService.verify throws', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const ctx = makeContext({ authorization: 'Bearer bad.token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token')
      );
      expect(mockAuthService.validateAndTouchSession).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Session not found
  // -------------------------------------------------------------------------

  describe('session not found in DB', () => {
    it('throws UnauthorizedException when validateAndTouchSession rejects', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockAuthService.validateAndTouchSession.mockRejectedValue(
        new UnauthorizedException('Session not found or expired')
      );

      const ctx = makeContext({ authorization: 'Bearer valid.token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — Bearer header
  // -------------------------------------------------------------------------

  describe('valid Bearer token with active session', () => {
    it('returns true and sets request.user', async () => {
      const payload = { sub: 1, username: 'alice' };
      mockJwtService.verify.mockReturnValue(payload);

      const ctx = makeContext({ authorization: 'Bearer valid.jwt' });

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockAuthService.validatePayload).toHaveBeenCalledWith(payload);
      expect(mockAuthService.hashToken).toHaveBeenCalledWith('valid.jwt');
      expect(mockAuthService.validateAndTouchSession).toHaveBeenCalledWith(
        'hash-abc'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — cookie
  // -------------------------------------------------------------------------

  describe('valid cookie token with active session', () => {
    it('extracts token from cookie when no Authorization header', async () => {
      const payload = { sub: 2, username: 'bob' };
      mockJwtService.verify.mockReturnValue(payload);

      const ctx = makeContext({
        cookies: { [ACCESS_TOKEN_COOKIE]: 'cookie.jwt' },
      });

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockAuthService.hashToken).toHaveBeenCalledWith('cookie.jwt');
    });
  });
});
