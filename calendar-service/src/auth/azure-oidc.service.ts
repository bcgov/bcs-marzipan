import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import * as oidc from 'openid-client';

const OIDC_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — covers slow networks and MFA prompts
const OIDC_BINDING_COOKIE_PREFIX = 'corpcal_az_';

interface OidcStatePayload {
  jti: string; // random nonce bound to this state
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

  generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Create a self-verifying state token that embeds the nonce and expiry.
   *
   * The token is sent to Azure as the `state` parameter and echoed back
   * verbatim in the callback, so no server-side storage or cookies are
   * needed. Each login attempt (tab, retry) gets an independent token,
   * so concurrent flows never interfere with each other.
   *
   * Format: base64url(JSON({jti, nonce, exp})).HMAC-SHA256
   */
  createSignedState(nonce: string): string {
    const payload: OidcStatePayload = {
      jti: crypto.randomBytes(16).toString('hex'),
      nonce,
      exp: Math.floor((Date.now() + OIDC_STATE_TTL_MS) / 1000),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  /**
   * Set a short-lived httpOnly cookie keyed by the state token's jti.
   * Must be called on every login initiation alongside createSignedState.
   *
   * On the callback, the browser sends this cookie back, proving the
   * callback originated from the same browser that started the flow and
   * preventing login CSRF (an attacker cannot plant the victim's jti cookie).
   * Each concurrent tab gets its own cookie, so flows never interfere.
   */
  bindStateToBrowser(res: Response, state: string): void {
    const payload = this.parseStateBody(state);
    if (!payload) return;
    const isSecure =
      this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie(`${OIDC_BINDING_COOKIE_PREFIX}${payload.jti}`, '1', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: OIDC_STATE_TTL_MS,
      path: '/api/auth/azure/callback',
    });
  }

  /**
   * Verify that the browser that initiated this login flow is the same one
   * completing it. Clears the binding cookie on success or failure.
   * Returns false if the binding cookie is absent (login CSRF attempt).
   */
  verifyAndConsumeBinding(req: Request, res: Response, state: string): boolean {
    const payload = this.parseStateBody(state);
    if (!payload) return false;
    const cookieName = `${OIDC_BINDING_COOKIE_PREFIX}${payload.jti}`;
    const cookiePresent = !!req.cookies?.[cookieName];
    res.clearCookie(cookieName, { path: '/api/auth/azure/callback' });
    return cookiePresent;
  }

  /**
   * Verify a state token returned by Azure and extract the nonce.
   * Returns null if tampered, expired, or malformed.
   */
  verifySignedState(state: string): string | null {
    const dotIndex = state.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const body = state.slice(0, dotIndex);
    const sig = state.slice(dotIndex + 1);

    const expected = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(body)
      .digest('base64url');

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    let payload: OidcStatePayload;
    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8')
      ) as OidcStatePayload;
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

  private parseStateBody(state: string): OidcStatePayload | null {
    const dotIndex = state.lastIndexOf('.');
    if (dotIndex === -1) return null;
    try {
      return JSON.parse(
        Buffer.from(state.slice(0, dotIndex), 'base64url').toString('utf8')
      ) as OidcStatePayload;
    } catch {
      return null;
    }
  }
}
