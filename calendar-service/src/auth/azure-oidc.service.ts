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
