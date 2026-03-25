import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as oidc from 'openid-client';

interface OidcStateEntry {
  nonce: string;
  expiresAt: number;
}

@Injectable()
export class AzureOidcService {
  private cachedConfig: oidc.Configuration | null = null;
  private readonly stateStore = new Map<string, OidcStateEntry>();
  private readonly stateTtlMs = 10 * 60 * 1000;

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

  createState(nonce: string): string {
    this.cleanupStateStore();

    const state = this.generateState();
    this.stateStore.set(state, {
      nonce,
      expiresAt: Date.now() + this.stateTtlMs,
    });

    return state;
  }

  consumeState(state: string): string | null {
    this.cleanupStateStore();

    const entry = this.stateStore.get(state);
    if (!entry) {
      return null;
    }

    this.stateStore.delete(state);

    if (entry.expiresAt < Date.now()) {
      return null;
    }

    return entry.nonce;
  }

  private cleanupStateStore(): void {
    const now = Date.now();
    for (const [key, value] of this.stateStore.entries()) {
      if (value.expiresAt < now) {
        this.stateStore.delete(key);
      }
    }
  }
}
