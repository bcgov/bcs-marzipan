import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import {
  and,
  eq,
  gt,
  inArray,
  passwordResetTokens,
  sessions,
} from '@corpcal/database';
import {
  DEFAULT_JWT_EXPIRES_IN,
  type AuthUser,
  type CheckEmailResponse,
} from '@corpcal/shared';

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
import {
  findUserByEmailLocal,
  findUserByIdLocal,
  updateUserPassword,
  updateUserStatus,
} from './strategies/local.strategy';
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

  async login(
    body: LoginDto
  ): Promise<
    | AuthResponseDto
    | { requiresPasswordSetup: true; email: string }
    | { requiresPasswordReset: true; email: string }
  > {
    const strategy = this.configService.get<string>('AUTH_STRATEGY', 'mock');

    if (strategy === 'mock') {
      return this.loginMock(body.username);
    }

    // LOCAL_AUTH_ENABLED=true allows local email/password login alongside any
    // primary strategy (e.g. AUTH_STRATEGY=azure + LOCAL_AUTH_ENABLED=true).
    if (strategy === 'local' || this.isLocalAuthEnabled()) {
      return this.loginLocal(body.username, body.password);
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
      `Unknown AUTH_STRATEGY: ${strategy}. Use 'mock', 'local', 'ad', or 'azure'.`
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

  // ---------------------------------------------------------------------------
  // Local auth strategy
  // ---------------------------------------------------------------------------

  /**
   * Step 1: Check the status of a local account by email.
   * Called before prompting for a password so the UI can branch on account state.
   */
  async checkEmail(email: string): Promise<CheckEmailResponse> {
    const dbUser = await findUserByEmailLocal(
      this.databaseService.db,
      email.trim()
    );

    if (!dbUser) {
      return { status: 'not_found' };
    }

    if (!dbUser.isActive || dbUser.status === 'inactive') {
      return { status: 'inactive' };
    }

    if (dbUser.status === 'pending') {
      return { status: 'pending', email: dbUser.adEmail ?? undefined };
    }

    if (dbUser.status === 'password_reset_required') {
      return {
        status: 'requires_reset',
        email: dbUser.adEmail ?? undefined,
      };
    }

    return { status: 'active', email: dbUser.adEmail ?? undefined };
  }

  /**
   * Step 2a: Login with email + password (active accounts).
   * Also returns soft status signals for pending/reset-required accounts.
   */
  private async loginLocal(
    email: string,
    password?: string
  ): Promise<
    | AuthResponseDto
    | { requiresPasswordSetup: true; email: string }
    | { requiresPasswordReset: true; email: string }
  > {
    const dbUser = await findUserByEmailLocal(
      this.databaseService.db,
      email.trim()
    );

    if (!dbUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!dbUser.isActive || dbUser.status === 'inactive') {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (dbUser.status === 'pending') {
      return {
        requiresPasswordSetup: true as const,
        email: dbUser.adEmail ?? email.trim(),
      };
    }

    if (dbUser.status === 'password_reset_required') {
      return {
        requiresPasswordReset: true as const,
        email: dbUser.adEmail ?? email.trim(),
      };
    }

    if (!dbUser.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!password) {
      throw new UnauthorizedException('Password is required');
    }

    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(dbUser);
  }

  /**
   * Set a password for a pending account, activating it.
   * Returns a full auth response so the client can log the user in immediately.
   */
  async setPassword(
    email: string,
    password: string
  ): Promise<{ message: string }> {
    const dbUser = await findUserByEmailLocal(
      this.databaseService.db,
      email.trim()
    );

    if (!dbUser) {
      throw new BadRequestException('Account not found');
    }

    if (dbUser.status !== 'pending') {
      throw new BadRequestException(
        'Account has already been activated. Please use the login page.'
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await updateUserPassword(
      this.databaseService.db,
      dbUser.id,
      passwordHash,
      'active'
    );

    return { message: 'Password set successfully. Please log in.' };
  }

  /**
   * Verify an admin-issued password-reset code.
   * Returns true if the code is valid; does not consume it.
   */
  async verifyResetCode(email: string, resetCode: string): Promise<boolean> {
    const dbUser = await findUserByEmailLocal(
      this.databaseService.db,
      email.trim()
    );

    if (!dbUser || dbUser.status !== 'password_reset_required') {
      return false;
    }

    const tokenHash = createHash('sha256').update(resetCode).digest('hex');
    const [token] = await this.databaseService.db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return !!token && token.userId === dbUser.id;
  }

  /**
   * Change a password:
   * - Forced-reset flow: supply tempToken (the admin-issued reset code).
   * - Voluntary change: supply currentPassword + pass the bearer token to validateAndTouchSession first.
   *
   * Returns a full auth response for the forced-reset flow so the UI can log in immediately.
   * Returns null for voluntary changes (no new session needed).
   */
  async changePassword(opts: {
    tempToken?: string;
    currentPassword?: string;
    newPassword: string;
    bearerToken?: string;
  }): Promise<AuthResponseDto | { message: string }> {
    if (opts.tempToken) {
      // Forced reset path
      const tokenHash = createHash('sha256')
        .update(opts.tempToken)
        .digest('hex');

      const [token] = await this.databaseService.db
        .select({
          id: passwordResetTokens.id,
          userId: passwordResetTokens.userId,
          expiresAt: passwordResetTokens.expiresAt,
        })
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!token) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      const userRow = await findUserByIdLocal(
        this.databaseService.db,
        token.userId
      );

      if (!userRow || userRow.status !== 'password_reset_required') {
        throw new BadRequestException(
          'Password reset is not required for this account'
        );
      }

      const passwordHash = await bcrypt.hash(opts.newPassword, 12);
      await updateUserPassword(
        this.databaseService.db,
        userRow.id,
        passwordHash,
        'active'
      );

      // Consume the token
      await this.databaseService.db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, token.id));

      return { message: 'Password reset successfully. Please log in.' };
    }

    // Voluntary change path — bearer token validated by caller (controller)
    if (!opts.bearerToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    const tokenHash = this.hashToken(opts.bearerToken);
    await this.validateAndTouchSession(tokenHash);

    // Decode JWT to get userId
    let userId: number;
    try {
      const payload = this.jwtService.verify<{ sub: number }>(opts.bearerToken);
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const userRow = await findUserByIdLocal(this.databaseService.db, userId);

    if (!userRow) {
      throw new BadRequestException('User not found');
    }

    if (!userRow.passwordHash) {
      throw new BadRequestException('No current password set');
    }

    if (!opts.currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    const valid = await bcrypt.compare(
      opts.currentPassword,
      userRow.passwordHash
    );
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(opts.newPassword, 12);
    await updateUserPassword(
      this.databaseService.db,
      userId,
      passwordHash,
      'active'
    );

    return { message: 'Password changed successfully' };
  }

  /**
   * Create a temporary reset token for an admin-triggered password reset.
   * Sets the user's status to password_reset_required and returns the plaintext code.
   */
  async createPasswordResetToken(userId: number): Promise<string> {
    const plainCode = randomBytes(16).toString('hex'); // 32-char hex code
    const tokenHash = createHash('sha256').update(plainCode).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Remove any existing tokens for this user
    await this.databaseService.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));

    await this.databaseService.db.insert(passwordResetTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    await updateUserStatus(
      this.databaseService.db,
      userId,
      'password_reset_required'
    );

    return plainCode;
  }

  /** Whether local (email/password) auth is active.
   * True when AUTH_STRATEGY=local OR LOCAL_AUTH_ENABLED=true (allows local
   * login alongside a primary strategy such as azure).
   */
  isLocalAuthEnabled(): boolean {
    const strategy = this.configService.get<string>('AUTH_STRATEGY', 'mock');
    if (strategy === 'local') return true;
    return (
      this.configService.get<string>('LOCAL_AUTH_ENABLED', 'false') === 'true'
    );
  }

  /** Whether the mock auth strategy is active (development only) */
  isMockEnabled(): boolean {
    return this.configService.get<string>('AUTH_STRATEGY', 'mock') === 'mock';
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
