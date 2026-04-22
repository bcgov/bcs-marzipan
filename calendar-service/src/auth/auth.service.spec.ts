import { createHash } from 'node:crypto';
import { NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Build a Drizzle-like chainable query mock that resolves `resolvedValue`. */
function makeChain(resolvedValue: unknown = []) {
  const chain: Record<string, Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'orderBy',
    'limit',
    'insert',
    'values',
    'update',
    'set',
    'delete',
    'catch',
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Terminal method returns a Promise
  chain['limit'].mockResolvedValue(resolvedValue);
  chain['values'].mockResolvedValue(resolvedValue);
  chain['where'].mockResolvedValue(resolvedValue);
  chain['catch'].mockResolvedValue(resolvedValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthService — session methods', () => {
  let service: AuthService;
  let mockDb: ReturnType<typeof makeChain>;

  beforeEach(async () => {
    mockDb = makeChain();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
        // AuthService needs these but we're only testing session methods
        { provide: 'PolicyService', useValue: {} },
        {
          provide: 'JwtService',
          useValue: { sign: vi.fn().mockReturnValue('token') },
        },
        {
          provide: 'ConfigService',
          useValue: { get: vi.fn().mockReturnValue(undefined) },
        },
      ],
    })
      .overrideProvider('PolicyService')
      .useValue({})
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  // -------------------------------------------------------------------------
  // hashToken
  // -------------------------------------------------------------------------

  describe('hashToken()', () => {
    it('returns a SHA-256 hex string', () => {
      const input = 'some.jwt.token';
      expect(service.hashToken(input)).toBe(sha256(input));
    });

    it('produces different hashes for different inputs', () => {
      expect(service.hashToken('a')).not.toBe(service.hashToken('b'));
    });

    it('is deterministic', () => {
      expect(service.hashToken('x')).toBe(service.hashToken('x'));
    });
  });

  // -------------------------------------------------------------------------
  // validateAndTouchSession()
  // -------------------------------------------------------------------------

  describe('validateAndTouchSession()', () => {
    it('throws UnauthorizedException when no matching session row is found', async () => {
      // select().from().where().limit() → []
      const chain = makeChain([]);
      mockDb.select = vi.fn().mockReturnValue(chain);

      await expect(service.validateAndTouchSession('any-hash')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('resolves successfully when a valid session row exists', async () => {
      const chain = makeChain([{ id: 1 }]);
      mockDb.select = vi.fn().mockReturnValue(chain);

      // Fire-and-forget update — mock it
      mockDb.update = vi.fn().mockReturnValue(makeChain());

      await expect(
        service.validateAndTouchSession(sha256('token'))
      ).resolves.toBeUndefined();
    });

    it('fires the lastAccessedAt update after session is confirmed', async () => {
      const chain = makeChain([{ id: 42 }]);
      mockDb.select = vi.fn().mockReturnValue(chain);

      const updateChain = makeChain();
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      await service.validateAndTouchSession(sha256('token'));

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // logout()
  // -------------------------------------------------------------------------

  describe('logout()', () => {
    it('deletes the session for the given token hash', async () => {
      const deleteChain = makeChain();
      mockDb.delete = vi.fn().mockReturnValue(deleteChain);

      const result = await service.logout('hash-abc');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logged out' });
    });
  });

  // -------------------------------------------------------------------------
  // refresh()
  // -------------------------------------------------------------------------

  describe('refresh()', () => {
    it('throws NotImplementedException', () => {
      expect(() => service.refresh()).toThrow(NotImplementedException);
    });
  });
});
