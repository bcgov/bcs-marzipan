import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AzureOidcService } from './azure-oidc.service';

const TEST_SECRET = 'test-secret-32-characters-minimum!!';

async function buildService(
  jwtSecret = TEST_SECRET
): Promise<AzureOidcService> {
  const module = await Test.createTestingModule({
    providers: [
      AzureOidcService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string) => (key === 'JWT_SECRET' ? jwtSecret : undefined),
        },
      },
    ],
  }).compile();
  return module.get(AzureOidcService);
}

describe('AzureOidcService — signed state token', () => {
  let service: AzureOidcService;

  beforeEach(async () => {
    service = await buildService();
  });

  describe('createSignedState / verifySignedState', () => {
    it('round-trips: verifySignedState returns the original nonce', () => {
      const nonce = service.generateNonce();
      const state = service.createSignedState(nonce);
      expect(service.verifySignedState(state)).toBe(nonce);
    });

    it('each call produces a distinct token (unique jti)', () => {
      const nonce = service.generateNonce();
      const a = service.createSignedState(nonce);
      const b = service.createSignedState(nonce);
      expect(a).not.toBe(b);
    });

    it('returns null for a token with a tampered body', () => {
      const state = service.createSignedState(service.generateNonce());
      const [body, sig] = state.split('.');
      // Flip one character in the base64url body
      const tampered = body.slice(0, -1) + (body.endsWith('a') ? 'b' : 'a');
      expect(service.verifySignedState(`${tampered}.${sig}`)).toBeNull();
    });

    it('returns null for a token with a tampered signature', () => {
      const state = service.createSignedState(service.generateNonce());
      const dotIndex = state.lastIndexOf('.');
      const body = state.slice(0, dotIndex);
      const sig = state.slice(dotIndex + 1);
      const tamperedSig = sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a');
      expect(service.verifySignedState(`${body}.${tamperedSig}`)).toBeNull();
    });

    it('returns null for a token signed with a different secret', async () => {
      const otherService = await buildService(
        'a-completely-different-secret!!'
      );
      const state = otherService.createSignedState(service.generateNonce());
      expect(service.verifySignedState(state)).toBeNull();
    });

    it('returns null for an expired token', () => {
      const nonce = service.generateNonce();
      // Build a token whose exp is in the past
      const payload = {
        jti: crypto.randomBytes(16).toString('hex'),
        nonce,
        exp: Math.floor(Date.now() / 1000) - 1,
      };
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const sig = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(body)
        .digest('base64url');
      expect(service.verifySignedState(`${body}.${sig}`)).toBeNull();
    });

    it('returns null when the token has no dot separator', () => {
      expect(service.verifySignedState('nodothere')).toBeNull();
    });

    it('returns null when the body is not valid JSON', () => {
      const body = Buffer.from('not-json').toString('base64url');
      const sig = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(body)
        .digest('base64url');
      expect(service.verifySignedState(`${body}.${sig}`)).toBeNull();
    });
  });

  describe('bindStateToBrowser / verifyAndConsumeBinding', () => {
    function makeMockRes() {
      const cookies: Record<string, unknown> = {};
      return {
        cookie: vi.fn((name: string, _val: string) => {
          cookies[name] = '1';
        }),
        clearCookie: vi.fn((name: string) => {
          delete cookies[name];
        }),
        _cookies: cookies,
      };
    }

    function makeMockReq(cookies: Record<string, string> = {}) {
      return { cookies } as unknown as import('express').Request;
    }

    it('sets an httpOnly binding cookie named after the jti', () => {
      const state = service.createSignedState(service.generateNonce());
      const res = makeMockRes();
      service.bindStateToBrowser(res as never, state);
      expect(res.cookie).toHaveBeenCalledOnce();
      const [name, value, opts] = (res.cookie as ReturnType<typeof vi.fn>).mock
        .calls[0] as [string, string, Record<string, unknown>];
      expect(name).toMatch(/^corpcal_az_[0-9a-f]{32}$/);
      expect(value).toBe('1');
      expect(opts.httpOnly).toBe(true);
      expect(opts.path).toBe('/api/auth/azure/callback');
    });

    it('verifyAndConsumeBinding returns true and clears cookie when present', () => {
      const state = service.createSignedState(service.generateNonce());
      const res = makeMockRes();
      service.bindStateToBrowser(res as never, state);

      // Extract the cookie name that was set
      const cookieName = (res.cookie as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string;
      const req = makeMockReq({ [cookieName]: '1' });
      const res2 = makeMockRes();

      expect(service.verifyAndConsumeBinding(req, res2 as never, state)).toBe(
        true
      );
      expect(res2.clearCookie).toHaveBeenCalledWith(cookieName, {
        path: '/api/auth/azure/callback',
      });
    });

    it('verifyAndConsumeBinding returns false when binding cookie is absent (login CSRF)', () => {
      const state = service.createSignedState(service.generateNonce());
      const req = makeMockReq({}); // no cookies
      const res = makeMockRes();
      expect(service.verifyAndConsumeBinding(req, res as never, state)).toBe(
        false
      );
    });

    it('verifyAndConsumeBinding returns false for a different state than what was bound', () => {
      const state1 = service.createSignedState(service.generateNonce());
      const state2 = service.createSignedState(service.generateNonce());
      const res = makeMockRes();
      service.bindStateToBrowser(res as never, state1);
      const cookieName1 = (res.cookie as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string;

      // Callback arrives with state2 but browser only has cookie for state1
      const req = makeMockReq({ [cookieName1]: '1' });
      const res2 = makeMockRes();
      expect(service.verifyAndConsumeBinding(req, res2 as never, state2)).toBe(
        false
      );
    });
  });
});
