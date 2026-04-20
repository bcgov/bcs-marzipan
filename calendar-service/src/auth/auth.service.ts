import { createHash } from 'node:crypto';
import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { eq, sessions } from '@corpcal/database';
import type { AuthUser } from '@corpcal/shared';

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

    const raw = this.configService.get<string | number>('JWT_EXPIRES_IN', 3600);
    const expiresIn = Number(raw ?? 3600);
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

  private extractBearerToken(authorizationHeader: string): string {
    const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('A valid bearer token is required.');
    }

    return token;
  }

  private hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async logout(
    userId: number,
    authorizationHeader: string
  ): Promise<{ message: string }> {
    const token = this.extractBearerToken(authorizationHeader);
    const tokenHash = this.hashSessionToken(token);

    await this.databaseService.db
      .delete(sessions)
      .where(
        eq(sessions.userId, userId) && eq(sessions.tokenHash, tokenHash)
      );
    return { message: 'Logged out' };
  }

  refresh(): never {
    throw new NotImplementedException(
      'Refresh not implemented. Re-login to obtain a new token.'
    );
  }
}
