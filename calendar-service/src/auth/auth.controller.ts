import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import type { Request, Response } from 'express';
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
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = loginBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    const result = await this.authService.login(parsed.data);

    this.setAuthCookie(res, result.accessToken, result.expiresIn);

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
      console.error('Azure AD login initiation error:', error);
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
      return res.redirect('/login?error=azure_not_configured');
    }

    try {
      const state =
        typeof req.query.state === 'string' ? req.query.state : undefined;
      if (!state) {
        return res.redirect('/login?error=azure_auth_failed');
      }

      const nonce = this.azureOidcService.consumeState(state);
      if (!nonce) {
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
        return res.redirect('/login?error=azure_auth_failed');
      }

      const result = await this.authService.loginWithAzureClaims({
        externalId,
        username,
        displayName,
        email,
      });

      this.setAuthCookie(res, result.accessToken, result.expiresIn);
      return res.redirect('/');
    } catch (error) {
      console.error('Azure AD callback error:', error);
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
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the httpOnly auth cookie
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
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
    res: Response,
    accessToken: string,
    expiresIn?: number
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: (expiresIn ?? 3600) * 1000,
    });
  }
}
