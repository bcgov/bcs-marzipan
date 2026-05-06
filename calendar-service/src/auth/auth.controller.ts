import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import * as oidc from 'openid-client';

import {
  ACCESS_TOKEN_COOKIE,
  changePasswordBodySchema,
  checkEmailBodySchema,
  DEFAULT_JWT_EXPIRES_IN,
  setPasswordBodySchema,
  verifyResetCodeBodySchema,
  type AuthUser,
} from '@corpcal/shared';

import { AuthService } from './auth.service';
import { AzureOidcService } from './azure-oidc.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { loginBodySchema } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly azureOidcService: AzureOidcService
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticate and receive JWT. For local strategy: supply email as username + password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful or status signal',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = loginBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    const result = await this.authService.login(parsed.data);

    // Status-signal responses (pending / password_reset_required) don't carry a token
    if (
      'requiresPasswordSetup' in result ||
      'requiresPasswordReset' in result
    ) {
      return result;
    }

    this.setAuthCookie(req, res, result.accessToken, result.expiresIn);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Local auth endpoints
  // ---------------------------------------------------------------------------

  @Public()
  @Get('local/config')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Local auth availability',
    description:
      'Returns whether local (email/password) or mock login is configured',
  })
  @ApiResponse({ status: 200, description: 'Local auth availability status' })
  localConfig() {
    return {
      enabled: this.authService.isLocalAuthEnabled(),
      mockEnabled: this.authService.isMockEnabled(),
    };
  }

  @Public()
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Check email status',
    description: 'Returns account status for a given email (local auth)',
  })
  @ApiResponse({ status: 200, description: 'Account status' })
  async checkEmail(@Body() body: unknown) {
    const parsed = checkEmailBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    return this.authService.checkEmail(parsed.data.email);
  }

  @Public()
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Set first-time password',
    description: 'Activates a pending account by setting its initial password',
  })
  @ApiResponse({ status: 200, description: 'Password set; please log in' })
  async setPassword(@Body() body: unknown) {
    const parsed = setPasswordBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    if (parsed.data.password !== parsed.data.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.authService.setPassword(
      parsed.data.email,
      parsed.data.password
    );
  }

  @Public()
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify password reset code',
    description: 'Validates an admin-issued reset code without consuming it',
  })
  @ApiResponse({ status: 200, description: 'Code validity result' })
  async verifyResetCode(@Body() body: unknown) {
    const parsed = verifyResetCodeBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    const valid = await this.authService.verifyResetCode(
      parsed.data.email,
      parsed.data.resetCode
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }
    return { valid: true };
  }

  @Public()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Change password',
    description:
      'Forced-reset flow (tempToken) or voluntary change (Bearer token + currentPassword)',
  })
  @ApiResponse({ status: 200, description: 'Password changed' })
  async changePassword(@Body() body: unknown, @Req() req: Request) {
    const parsed = changePasswordBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    if (parsed.data.newPassword !== parsed.data.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : (req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined);

    return this.authService.changePassword({
      tempToken: parsed.data.tempToken,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      bearerToken,
    });
  }

  @Public()
  @Get('azure/config')
  @ApiOperation({
    summary: 'Azure AD availability',
    description: 'Returns whether Azure AD login is configured and enabled',
  })
  @ApiResponse({ status: 200, description: 'Azure AD availability status' })
  azureConfig() {
    return { enabled: this.azureOidcService.isConfigured() };
  }

  @Public()
  @Get('azure')
  @ApiOperation({
    summary: 'Start Azure AD login',
    description: 'Initiates OIDC auth flow and redirects to Microsoft login',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Azure AD login' })
  async azureLogin(@Req() req: Request, @Res() res: Response) {
    if (!this.azureOidcService.isConfigured()) {
      this.logger.warn(
        'Azure login attempted while Azure AD is not configured'
      );
      return res.redirect('/login?error=azure_not_configured');
    }

    try {
      const config = await this.azureOidcService.getConfig();
      const redirectUri = this.azureOidcService.getRedirectUri(req);
      const nonce = this.azureOidcService.generateNonce();
      const state = this.azureOidcService.createState(nonce);

      const redirectUrl = oidc.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state,
        nonce,
        response_type: 'code',
      });

      return res.redirect(redirectUrl.href);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Azure AD login initiation failed: ${message}`);
      return res.redirect('/login?error=azure_auth_failed');
    }
  }

  @Public()
  @Get('azure/callback')
  @ApiOperation({
    summary: 'Azure AD callback',
    description: 'Handles OIDC callback and signs user into local app session',
  })
  @ApiResponse({ status: 302, description: 'Redirect to app after sign-in' })
  async azureCallback(@Req() req: Request, @Res() res: Response) {
    if (!this.azureOidcService.isConfigured()) {
      this.logger.warn(
        'Azure callback received while Azure AD is not configured'
      );
      return res.redirect('/login?error=azure_not_configured');
    }

    try {
      const state =
        typeof req.query.state === 'string' ? req.query.state : undefined;
      if (!state) {
        const oidcError =
          typeof req.query.error === 'string' ? req.query.error : undefined;
        const oidcDescription =
          typeof req.query.error_description === 'string'
            ? req.query.error_description
            : undefined;
        this.logger.warn(
          `Azure callback missing state${oidcError ? `; oidc_error=${oidcError}` : ''}${oidcDescription ? `; oidc_error_description=${oidcDescription}` : ''}`
        );
        return res.redirect('/login?error=azure_auth_failed');
      }

      const nonce = this.azureOidcService.consumeState(state);
      if (!nonce) {
        this.logger.warn(
          'Azure callback rejected due to invalid or expired state'
        );
        return res.redirect('/login?error=azure_auth_failed');
      }

      const config = await this.azureOidcService.getConfig();
      const redirectUri = this.azureOidcService.getRedirectUri(req);

      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          search.append(key, value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              search.append(key, item);
            }
          }
        }
      }

      const callbackUrl = new URL(`${redirectUri}?${search.toString()}`);

      const tokenSet = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: undefined,
        expectedState: state,
        expectedNonce: nonce,
      });

      const claims = tokenSet.claims() as Record<string, unknown>;
      const externalId =
        typeof claims.oid === 'string'
          ? claims.oid
          : typeof claims.sub === 'string'
            ? claims.sub
            : '';

      const username =
        typeof claims.preferred_username === 'string'
          ? claims.preferred_username
          : typeof claims.email === 'string'
            ? claims.email
            : externalId;

      const email =
        typeof claims.email === 'string'
          ? claims.email
          : typeof claims.preferred_username === 'string'
            ? claims.preferred_username
            : '';

      const displayName =
        typeof claims.name === 'string' ? claims.name : username;

      if (!externalId) {
        this.logger.warn(
          `Azure callback missing external identifier for username=${username || 'unknown'}`
        );
        return res.redirect('/login?error=azure_auth_failed');
      }

      const result = await this.authService.loginWithAzureClaims({
        externalId,
        username,
        displayName,
        email,
      });

      this.logger.log(
        `Azure login successful for userId=${result.user.id}, username=${result.user.username}, email=${result.user.email || 'n/a'}`
      );

      this.setAuthCookie(req, res, result.accessToken, result.expiresIn);
      return res.redirect(this.getPostLoginRedirectUrl());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Azure login failed during callback: ${message}`);
      return res.redirect('/login?error=azure_no_account');
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current user',
    description: 'Get current user and permissions',
  })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Log out and clear auth cookie',
  })
  @ApiResponse({ status: 200, description: 'Logged out' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Clear the httpOnly auth cookie
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.getAuthCookieOptions(req));

    const raw = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : (req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined);

    const tokenHash = raw ? this.authService.hashToken(raw) : '';
    return this.authService.logout(tokenHash);
  }

  // TODO: Implement refresh token.
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Not implemented; re-login to get new token',
  })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  refresh() {
    return this.authService.refresh();
  }

  private setAuthCookie(
    req: Request,
    res: Response,
    accessToken: string,
    expiresIn?: number
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...this.getAuthCookieOptions(req),
      maxAge: (expiresIn ?? DEFAULT_JWT_EXPIRES_IN) * 1000,
    });
  }

  private getAuthCookieOptions(req: Request): CookieOptions {
    const forwardedProto = req.get('X-Forwarded-Proto');
    const isSecureRequest =
      forwardedProto === 'https' ||
      req.protocol === 'https' ||
      process.env.NODE_ENV === 'production';
    const configuredCookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();

    return {
      httpOnly: true,
      secure: isSecureRequest,
      sameSite: isSecureRequest ? 'none' : 'lax',
      domain: configuredCookieDomain || undefined,
      path: '/',
    };
  }

  private getPostLoginRedirectUrl(): string {
    const configuredRedirect = process.env.POST_LOGIN_REDIRECT_URL?.trim();
    const base = configuredRedirect || '/';
    // Use a dummy origin so that relative URLs (e.g. '/') are handled by the
    // URL API. searchParams.set() deduplicates any existing 'login' param.
    const dummyOrigin = 'https://placeholder.invalid';
    const url = new URL(base, dummyOrigin);
    url.searchParams.set('login', '1');
    // Strip the dummy origin for relative URLs; keep it for absolute URLs.
    return base.startsWith('http')
      ? url.toString()
      : `${url.pathname}${url.search}`;
  }
}
