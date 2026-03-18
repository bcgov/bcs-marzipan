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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import * as oidc from 'openid-client';

import { ACCESS_TOKEN_COOKIE, type AuthUser } from '@corpcal/shared';

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
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate and receive JWT (mock: use username only)',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
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

    this.setAuthCookie(req, res, result.accessToken, result.expiresIn);

    return result;
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
    return this.authService.logout();
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
      maxAge: (expiresIn ?? 3600) * 1000,
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
    return configuredRedirect || '/';
  }
}
