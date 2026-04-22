import { createHash } from 'node:crypto';
import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { and, eq, gt, inArray, sessions } from '@corpcal/database';
import { DEFAULT_JWT_EXPIRES_IN, type AuthUser } from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';
import { PolicyService } from '../policy/policy.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import {
  findUserByEmail,
  findUserByExternalId,
  syncAzureIdentity,
  type AuthDbUser,
} from './strategies/ad.strategy';
import { findUserByUsername } from './strategies/mock.strategy';

const MAX_SESSIONS = 5;

export interface JwtPayload {
  sub: number;
  username: string;
  displayName: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  teamIds: number[];
  bypassDataScoping: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly policyService: PolicyService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(body: LoginDto): Promise<AuthResponseDto> {
    const strategy = this.configService.get<string>('AUTH_STRATEGY', 'mock');

    if (strategy === 'mock') {
      return this.loginMock(body.username);
    }

    if (strategy === 'ad') {
      throw new UnauthorizedException(
        'AD strategy not yet implemented. Use AUTH_STRATEGY=mock for development.'
      );
    }

    if (strategy === 'azure') {
      throw new UnauthorizedException(
        'Azure strategy uses OIDC redirect flow. Start at GET /auth/azure.'
      );
    }

    throw new UnauthorizedException(
      `Unknown AUTH_STRATEGY: ${strategy}. Use 'mock', 'ad', or 'azure'.`
    );
  }

  async loginWithAzureClaims(claims: {
    externalId: string;
    username?: string;
    displayName?: string;
    email?: string;
  }): Promise<AuthResponseDto> {
    let dbUser = await findUserByExternalId(
      this.databaseService.db,
      claims.externalId
    );

    if (!dbUser && claims.email?.trim()) {
      dbUser = await findUserByEmail(this.databaseService.db, claims.email);
    }

    if (!dbUser) {
      throw new UnauthorizedException(
        'No active local account found for this Azure AD user.'
      );
    }

    await syncAzureIdentity(this.databaseService.db, dbUser.id, claims);

    const syncedUser =
      (await findUserByExternalId(
        this.databaseService.db,
        claims.externalId
      )) ?? dbUser;

    return this.buildAuthResponse(syncedUser);
  }

  private async loginMock(username: string): Promise<AuthResponseDto> {
    const dbUser = await findUserByUsername(this.databaseService.db, username);

    if (!dbUser) {
      throw new UnauthorizedException('Invalid username');
    }

    return this.buildAuthResponse(dbUser);
  }

  private async buildAuthResponse(
    dbUser: AuthDbUser
  ): Promise<AuthResponseDto> {
    const [roleName, effective] = await Promise.all([
      this.policyService.getRoleName(dbUser.roleId),
      this.policyService.getEffectivePermissionsForUser(dbUser.id),
    ]);

    if (!roleName) {
      throw new UnauthorizedException('User role not found');
    }

    const teamIds = await this.policyService.getTeamIdsForUser(dbUser.id);
    const user: AuthUser = {
      id: dbUser.id,
      username: dbUser.adUsername ?? String(dbUser.id),
      displayName:
        dbUser.adDisplayName ?? dbUser.adUsername ?? String(dbUser.id),
      email: dbUser.adEmail ?? '',
      roleId: dbUser.roleId,
      roleName,
      permissions: effective.permissions,
      teamIds,
      bypassDataScoping: effective.bypass,
    };

    const raw = this.configService.get<string | number>(
      'JWT_EXPIRES_IN',
      DEFAULT_JWT_EXPIRES_IN
    );
    const expiresIn = Number(raw ?? DEFAULT_JWT_EXPIRES_IN);
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions,
        teamIds: user.teamIds,
        bypassDataScoping: user.bypassDataScoping ?? false,
      } satisfies JwtPayload,
      { expiresIn }
    );

    const tokenHash = createHash('sha256').update(accessToken).digest('hex');
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    await this.databaseService.db.insert(sessions).values({
      userId: dbUser.id,
      token: tokenHash,
      expiresAt,
      lastAccessedAt: new Date(),
    });

    // Prune oldest sessions if user exceeds MAX_SESSIONS
    const allSessions = await this.databaseService.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, dbUser.id))
      .orderBy(sessions.createdAt);

    if (allSessions.length > MAX_SESSIONS) {
      const toDelete = allSessions
        .slice(0, allSessions.length - MAX_SESSIONS)
        .map((s) => s.id);
      await this.databaseService.db
        .delete(sessions)
        .where(
          and(eq(sessions.userId, dbUser.id), inArray(sessions.id, toDelete))
        );
    }

    return {
      user,
      accessToken,
      expiresIn,
    };
  }

  /**
   * Validate JWT payload and return AuthUser for request
   */
  validatePayload(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
      email: payload.email,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions ?? [],
      teamIds: payload.teamIds ?? [],
      bypassDataScoping: payload.bypassDataScoping ?? false,
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify the session exists in the DB and update lastAccessedAt.
   * Called by JwtAuthGuard on every authenticated request.
   */
  async validateAndTouchSession(tokenHash: string): Promise<void> {
    const [session] = await this.databaseService.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(eq(sessions.token, tokenHash), gt(sessions.expiresAt, new Date()))
      )
      .limit(1);

    if (!session) {
      throw new UnauthorizedException('Session not found or expired');
    }

    // Fire-and-forget — non-critical, don't block the request
    void this.databaseService.db
      .update(sessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(sessions.id, session.id))
      .catch(() => undefined);
  }

  async logout(tokenHash: string): Promise<{ message: string }> {
    await this.databaseService.db
      .delete(sessions)
      .where(eq(sessions.token, tokenHash));
    return { message: 'Logged out' };
  }

  refresh(): never {
    throw new NotImplementedException(
      'Refresh not implemented. Re-login to obtain a new token.'
    );
  }
}
