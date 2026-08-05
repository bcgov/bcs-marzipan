import { createHash } from 'node:crypto';
import {
  BadRequestException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import type { Mock } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { PolicyService } from '../policy/policy.service';
import { AuthService } from './auth.service';
import * as adStrategy from './strategies/ad.strategy';
import {
  findUserByEmailLocal,
  findUserByIdLocal,
  updateLastLogin,
  updateUserPassword,
  updateUserStatus,
} from './strategies/local.strategy';

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
  chain['catch'].mockResolvedValue(resolvedValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('./strategies/local.strategy', () => ({
  findUserByEmailLocal: vi.fn(),
  findUserByIdLocal: vi.fn(),
  updateLastLogin: vi.fn(),
  updateUserPassword: vi.fn(),
  updateUserStatus: vi.fn(),
}));

vi.mock('./strategies/ad.strategy', () => ({
  findUserByEmailAnyStatus: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserByExternalId: vi.fn(),
  findUserByExternalIdAnyStatus: vi.fn(),
  syncAzureIdentity: vi.fn(),
}));

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
        {
          provide: PolicyService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: { sign: vi.fn().mockReturnValue('token') },
        },
        {
          provide: ConfigService,
          useValue: { get: vi.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

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

// ---------------------------------------------------------------------------
// AuthService — local auth methods
// ---------------------------------------------------------------------------

describe('AuthService — local auth methods', () => {
  let service: AuthService;
  let localMockDb: ReturnType<typeof makeChain>;

  /** Minimal valid user row returned by findUserByEmailLocal */
  function makeLocalUser(
    overrides: Partial<{
      id: number;
      roleId: number;
      adUsername: string | null;
      adDisplayName: string | null;
      adEmail: string | null;
      passwordHash: string | null;
      status: string;
      isActive: boolean;
      directLoginEnabled: boolean;
    }> = {}
  ) {
    return {
      id: 1,
      roleId: 1,
      adUsername: 'testuser',
      adDisplayName: 'Test User',
      adEmail: 'test@example.com',
      passwordHash: 'existing-hash',
      status: 'active',
      isActive: true,
      directLoginEnabled: false,
      ...overrides,
    };
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    localMockDb = makeChain();

    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-value' as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(updateUserPassword).mockResolvedValue(undefined);
    vi.mocked(updateUserStatus).mockResolvedValue(undefined);
    vi.mocked(updateLastLogin).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: { db: localMockDb } },
        {
          provide: PolicyService,
          useValue: {
            getRoleName: vi.fn().mockResolvedValue('Viewer'),
            getEffectivePermissionsForUser: vi
              .fn()
              .mockResolvedValue({ permissions: [], bypass: false }),
            getTeamIdsForUser: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: vi.fn().mockReturnValue('tok'), verify: vi.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string, def?: unknown) => {
              if (key === 'AUTH_STRATEGY') return 'local';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // -------------------------------------------------------------------------
  // checkEmail()
  // -------------------------------------------------------------------------

  describe('checkEmail()', () => {
    it('returns inactive when no user exists for the email (enumeration hardening)', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(null);
      await expect(service.checkEmail('unknown@example.com')).resolves.toEqual({
        status: 'inactive',
      });
    });

    it('returns inactive when isActive is false', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ isActive: false })
      );
      await expect(service.checkEmail('test@example.com')).resolves.toEqual({
        status: 'inactive',
      });
    });

    it('returns inactive when status is inactive', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'inactive' })
      );
      await expect(service.checkEmail('test@example.com')).resolves.toEqual({
        status: 'inactive',
      });
    });

    it('returns pending for a pending account', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'pending' })
      );
      const result = await service.checkEmail('test@example.com');
      expect(result.status).toBe('pending');
    });

    it('returns requires_reset for a password_reset_required account', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'password_reset_required' })
      );
      const result = await service.checkEmail('test@example.com');
      expect(result.status).toBe('requires_reset');
    });

    it('returns active with the normalised email for an active account', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'active' })
      );
      const result = await service.checkEmail('TEST@EXAMPLE.COM');
      expect(result.status).toBe('active');
      expect((result as { email?: string }).email).toBe('test@example.com');
    });

    it('returns inactive for an IDIR-only account (active, no passwordHash, directLogin disabled)', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({
          status: 'active',
          passwordHash: null,
          directLoginEnabled: false,
        })
      );
      const result = await service.checkEmail('test@example.com');
      expect(result.status).toBe('inactive');
    });

    it('returns pending for an IDIR account with direct login enabled but no password set', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({
          status: 'active',
          passwordHash: null,
          directLoginEnabled: true,
        })
      );
      const result = await service.checkEmail('test@example.com');
      expect(result.status).toBe('pending');
    });
  });

  // -------------------------------------------------------------------------
  // setPassword()
  // -------------------------------------------------------------------------

  describe('setPassword()', () => {
    it('throws BadRequestException when no account is found for the email', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(null);
      await expect(
        service.setPassword('nobody@example.com', 'ValidPass1!')
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the account is not in pending status', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'active' })
      );
      await expect(
        service.setPassword('test@example.com', 'ValidPass1!')
      ).rejects.toThrow(BadRequestException);
    });

    it('hashes the password and marks the account active on success', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'pending' })
      );
      await service.setPassword('test@example.com', 'ValidPass1!');
      expect(bcrypt.hash).toHaveBeenCalledWith('ValidPass1!', 12);
      expect(updateUserPassword).toHaveBeenCalledWith(
        localMockDb,
        1,
        'hashed-value',
        'active'
      );
    });

    it('allows active IDIR user with directLoginEnabled and no password to set a password', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({
          status: 'active',
          passwordHash: null,
          directLoginEnabled: true,
        })
      );
      await service.setPassword('test@example.com', 'ValidPass1!');
      expect(bcrypt.hash).toHaveBeenCalledWith('ValidPass1!', 12);
      expect(updateUserPassword).toHaveBeenCalledWith(
        localMockDb,
        1,
        'hashed-value',
        'active'
      );
    });

    it('rejects active IDIR user with no passwordHash when directLoginEnabled is false', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({
          status: 'active',
          passwordHash: null,
          directLoginEnabled: false,
        })
      );
      await expect(
        service.setPassword('test@example.com', 'ValidPass1!')
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // login() — local email/password
  // -------------------------------------------------------------------------

  describe('login() — local', () => {
    it('records the last-login timestamp on a successful password login', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ id: 7, status: 'active' })
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.login({
        username: 'test@example.com',
        password: 'ValidPass1!',
      });

      expect(updateLastLogin).toHaveBeenCalledWith(localMockDb, 7);
    });

    it('does not record a last-login when the password is invalid', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ id: 7, status: 'active' })
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          username: 'test@example.com',
          password: 'WrongPass1!',
        })
      ).rejects.toThrow(UnauthorizedException);

      expect(updateLastLogin).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // verifyResetCode()
  // -------------------------------------------------------------------------

  describe('verifyResetCode()', () => {
    it('returns false when the user is not found', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(null);
      await expect(
        service.verifyResetCode('test@example.com', 'code')
      ).resolves.toBe(false);
    });

    it('returns false when the user is not in password_reset_required status', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'active' })
      );
      await expect(
        service.verifyResetCode('test@example.com', 'code')
      ).resolves.toBe(false);
    });

    it('returns false when no valid token exists in the database', async () => {
      vi.mocked(findUserByEmailLocal).mockResolvedValue(
        makeLocalUser({ status: 'password_reset_required' })
      );
      // Default makeChain: limit() resolves to [] — no token row found
      await expect(
        service.verifyResetCode('test@example.com', 'code')
      ).resolves.toBe(false);
    });

    it('returns true when a valid unexpired token matches the user', async () => {
      const user = makeLocalUser({ id: 1, status: 'password_reset_required' });
      vi.mocked(findUserByEmailLocal).mockResolvedValue(user);
      const tokenChain = makeChain([
        { id: 42, userId: 1, expiresAt: new Date(Date.now() + 3_600_000) },
      ]);
      localMockDb.select = vi.fn().mockReturnValue(tokenChain);
      await expect(
        service.verifyResetCode('test@example.com', 'validcode')
      ).resolves.toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // changePassword() — forced-reset path
  // -------------------------------------------------------------------------

  describe('changePassword() — forced-reset path', () => {
    it('throws UnauthorizedException when no matching reset token is found', async () => {
      // Default makeChain: limit() → [] (no token)
      await expect(
        service.changePassword({
          tempToken: 'badtoken',
          newPassword: 'NewPass1!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when the user is not in password_reset_required status', async () => {
      const tokenChain = makeChain([
        { id: 1, userId: 1, expiresAt: new Date(Date.now() + 3_600_000) },
      ]);
      localMockDb.select = vi.fn().mockReturnValue(tokenChain);
      vi.mocked(findUserByIdLocal).mockResolvedValue(
        makeLocalUser({ id: 1, status: 'active' })
      );
      await expect(
        service.changePassword({
          tempToken: 'validtoken',
          newPassword: 'NewPass1!',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // createPasswordResetToken()
  // -------------------------------------------------------------------------

  describe('createPasswordResetToken()', () => {
    it('throws BadRequestException when the user is not found', async () => {
      vi.mocked(findUserByIdLocal).mockResolvedValue(null);
      await expect(service.createPasswordResetToken(99)).rejects.toThrow(
        BadRequestException
      );
    });

    it('generates a token for an IDIR user (active, no passwordHash) — direct login can be set up', async () => {
      vi.mocked(findUserByIdLocal).mockResolvedValue(
        makeLocalUser({ isActive: true, status: 'active', passwordHash: null })
      );
      const token = await service.createPasswordResetToken(1);
      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    it('throws BadRequestException for an inactive user', async () => {
      vi.mocked(findUserByIdLocal).mockResolvedValue(
        makeLocalUser({ isActive: false, status: 'inactive' })
      );
      await expect(service.createPasswordResetToken(1)).rejects.toThrow(
        BadRequestException
      );
    });

    it('returns a 32-character hex token for an eligible user', async () => {
      vi.mocked(findUserByIdLocal).mockResolvedValue(makeLocalUser());
      const token = await service.createPasswordResetToken(1);
      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  // -------------------------------------------------------------------------
  // loginWithAzureClaims()
  // -------------------------------------------------------------------------

  describe('loginWithAzureClaims()', () => {
    it('allows a pending user to sign in with Microsoft using email match', async () => {
      vi.mocked(adStrategy.findUserByExternalId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          makeLocalUser({
            id: 42,
            status: 'active',
            isActive: true,
            passwordHash: null,
            adEmail: 'new.user@example.com',
          })
        );
      vi.mocked(adStrategy.findUserByEmail).mockResolvedValue(null);
      vi.mocked(adStrategy.findUserByEmailAnyStatus).mockResolvedValue(
        makeLocalUser({
          id: 42,
          status: 'pending',
          isActive: true,
          passwordHash: null,
        })
      );

      const result = await service.loginWithAzureClaims({
        externalId: 'azure-123',
        email: 'new.user@example.com',
        username: 'new.user@example.com',
        displayName: 'New User',
      });

      expect(adStrategy.findUserByEmailAnyStatus).toHaveBeenCalledTimes(1);
      expect(adStrategy.syncAzureIdentity).toHaveBeenCalledTimes(1);
      expect(result.user.id).toBe(42);
      expect(result.user.email).toBe('new.user@example.com');
    });
  });
});
