import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import * as oidc from 'openid-client';

const OIDC_STATE_COOKIE = 'corpcal_az_state';
const OIDC_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — covers slow networks and MFA prompts

interface OidcStateCookiePayload {
  nonce: string;
  exp: number; // unix seconds
}

@Injectable()
export class AzureOidcService {
  private cachedConfig: oidc.Configuration | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const authStrategy = this.configService.get<string>(
      'AUTH_STRATEGY',
      'mock'
    );

    if (authStrategy !== 'azure') {
      return false;
    }

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

    const discoveryUrl = new URL(
      `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`
    );

    // Azure's well-known document is stable and reachable in OpenShift.
    // Using the exact metadata URL avoids issuer transformation edge cases.
    this.cachedConfig = await oidc.discovery(
      discoveryUrl,
      clientId,
      clientSecret
    );
    return this.cachedConfig;
  }

  getRedirectUri(req: Request): string {
    const configuredRedirectUri =
      this.configService.get<string>('AZURE_REDIRECT_URI');

    if (configuredRedirectUri?.trim()) {
      return configuredRedirectUri.trim();
    }

    // Use X-Forwarded-Proto when behind a reverse proxy (nginx, OpenShift edge TLS)
    // so the URI scheme is https rather than the internal http.
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    return `${protocol}://${req.get('host')}/api/auth/azure/callback`;
  }

  generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Write the nonce into a short-lived, HMAC-signed cookie keyed by `state`.
   * The cookie is pod-stateless: any replica can verify it using the shared
   * JWT_SECRET, so Azure AD callbacks are not broken by round-robin routing.
   */
  setStateCookie(res: Response, state: string, nonce: string): void {
    const payload: OidcStateCookiePayload = {
      nonce,
      exp: Math.floor((Date.now() + OIDC_STATE_TTL_MS) / 1000),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(`${state}.${body}`)
      .digest('base64url');
    res.cookie(OIDC_STATE_COOKIE, `${body}.${sig}`, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: OIDC_STATE_TTL_MS,
      path: '/',
    });
  }

  /**
   * Verify the HMAC-signed state cookie, clear it, and return the nonce.
   * Returns null if missing, tampered, or expired.
   */
  consumeStateCookie(
    req: Request,
    res: Response,
    state: string
  ): string | null {
    const cookieValue: string | undefined = req.cookies?.[OIDC_STATE_COOKIE];
    res.clearCookie(OIDC_STATE_COOKIE, { httpOnly: true, path: '/' });

    if (!cookieValue) return null;
    const dotIndex = cookieValue.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const body = cookieValue.slice(0, dotIndex);
    const sig = cookieValue.slice(dotIndex + 1);

    const expected = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(`${state}.${body}`)
      .digest('base64url');

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    let payload: OidcStateCookiePayload;
    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8')
      ) as OidcStateCookiePayload;
    } catch {
      return null;
    }

    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now())
      return null;
    return payload.nonce;
  }

  private getSigningSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') ||
      'dev-secret-change-in-production'
    );
  }
}
