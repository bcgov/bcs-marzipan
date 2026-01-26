import {
  Injectable,
  UnauthorizedException,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '@corpcal/shared';
import { DatabaseService } from '../database/database.service';
import { PolicyService } from '../policy/policy.service';
import { findUserByUsername } from './strategies/mock.strategy';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: number;
  username: string;
  displayName: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  teamIds: number[];
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

    throw new UnauthorizedException(
      `Unknown AUTH_STRATEGY: ${strategy}. Use 'mock' or 'ad'.`
    );
  }

  private async loginMock(username: string): Promise<AuthResponseDto> {
    const dbUser = await findUserByUsername(this.databaseService.db, username);

    if (!dbUser) {
      throw new UnauthorizedException('Invalid username');
    }

    const [roleName, permissions, teamIds] = await Promise.all([
      this.policyService.getRoleName(dbUser.roleId),
      this.policyService.getPermissionsForRole(dbUser.roleId),
      this.policyService.getTeamIdsForUser(dbUser.id),
    ]);

    if (!roleName) {
      throw new UnauthorizedException('User role not found');
    }

    const user: AuthUser = {
      id: dbUser.id,
      username: dbUser.adUsername ?? String(dbUser.id),
      displayName:
        dbUser.adDisplayName ?? dbUser.adUsername ?? String(dbUser.id),
      email: dbUser.adEmail ?? '',
      roleId: dbUser.roleId,
      roleName,
      permissions,
      teamIds,
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
      } satisfies JwtPayload,
      { expiresIn }
    );

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
    };
  }

  logout(): { message: string } {
    // Stateless JWT: client discards token. Future: invalidate refresh token/session.
    return { message: 'Logged out' };
  }

  refresh(): never {
    throw new NotImplementedException(
      'Refresh not implemented. Re-login to obtain a new token.'
    );
  }
}
