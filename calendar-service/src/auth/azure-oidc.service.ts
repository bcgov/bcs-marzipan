import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import * as oidc from 'openid-client';

const OIDC_STATE_COOKIE = 'oidc_auth_state';

@Injectable()
export class AzureOidcService {
  private cachedConfig: oidc.Configuration | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.configService.get<string>('AZURE_TENANT_ID') &&
      this.configService.get<string>('AZURE_CLIENT_ID') &&
      this.configService.get<string>('AZURE_CLIENT_SECRET')
    );
  }

  async getConfig(): Promise<oidc.Configuration> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    const tenantId = this.configService.get<string>('AZURE_TENANT_ID');
    const clientId = this.configService.get<string>('AZURE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AZURE_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        'Azure AD is not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET.'
      );
    }

    const issuerUrl = new URL(
      `https://login.microsoftonline.com/${tenantId}/v2.0`
    );

    this.cachedConfig = await oidc.discovery(issuerUrl, clientId, clientSecret);
    return this.cachedConfig;
  }

  getRedirectUri(req: Request): string {
    const configuredRedirectUri =
      this.configService.get<string>('AZURE_REDIRECT_URI');

    if (configuredRedirectUri?.trim()) {
      return configuredRedirectUri.trim();
    }

    // Default to /api so UI-hosted proxy setups (e.g. Vite dev server) keep
    // the callback and post-login redirects on the frontend origin.
    return `${req.protocol}://${req.get('host')}/api/auth/azure/callback`;
  }

  generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Stores the OIDC state and nonce in a signed, httpOnly cookie so the
   * pairing survives across multiple backend replicas without a shared store.
   */
  setStateCookie(res: Response, state: string, nonce: string): void {
    const cookieValue = `${state}|${nonce}`;
    res.cookie(OIDC_STATE_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      signed: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });
  }

  /**
   * Reads and clears the OIDC state cookie.
   * Returns the stored nonce if the cookie exists and the state value matches,
   * or null if the cookie is missing, tampered, or the state doesn't match.
   */
  consumeStateCookie(
    req: Request,
    res: Response,
    state: string
  ): string | null {
    const rawCookie: unknown = req.signedCookies?.[OIDC_STATE_COOKIE];
    if (typeof rawCookie !== 'string' || !rawCookie) {
      return null;
    }

    // Clear the cookie immediately to prevent replay
    res.clearCookie(OIDC_STATE_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      signed: true,
      path: '/',
    });

    const separatorIndex = rawCookie.indexOf('|');
    if (separatorIndex === -1) {
      return null;
    }

    const cookieState = rawCookie.slice(0, separatorIndex);
    const nonce = rawCookie.slice(separatorIndex + 1);

    if (cookieState !== state || !nonce) {
      return null;
    }

    return nonce;
  }
}
