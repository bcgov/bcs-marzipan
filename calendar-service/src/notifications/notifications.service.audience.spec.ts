import { Test, TestingModule } from '@nestjs/testing';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { PolicyService } from '../policy/policy.service';
import { NotificationEmailService } from './notification-email.service';
import { NotificationsService } from './notifications.service';

function installDbSelectMock(
  mockDb: { select: ReturnType<typeof vi.fn> },
  userRows: Array<{ id: number; roleId: number }>,
  roleRows: Array<{ id: number; name: string }>
) {
  mockDb.select = vi
    .fn()
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(userRows),
      }),
    })
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(roleRows),
      }),
    });
}

describe('NotificationsService.filterRecipientsByHistoryAudience', () => {
  let service: NotificationsService;
  let mockDb: { select: ReturnType<typeof vi.fn> };
  let policyService: {
    getEffectivePermissionsForUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockDb = { select: vi.fn() };
    policyService = {
      getEffectivePermissionsForUser: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
        {
          provide: NotificationEmailService,
          useValue: {},
        },
        {
          provide: PolicyService,
          useValue: policyService,
        },
        {
          provide: ActivitiesGateway,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('returns all recipients unchanged for public audience', async () => {
    const ids = [10, 20];
    await expect(
      service.filterRecipientsByHistoryAudience(ids, 'public', 99)
    ).resolves.toEqual(ids);
    expect(policyService.getEffectivePermissionsForUser).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it('drops viewers who cannot see internal history', async () => {
    policyService.getEffectivePermissionsForUser.mockImplementation(
      (userId: number) =>
        Promise.resolve({
          permissions:
            userId === 10
              ? [PERMISSIONS.ACTIVITIES.HISTORY_AUDIENCE_INTERNAL]
              : [],
          bypass: false,
        })
    );

    installDbSelectMock(
      mockDb,
      [
        { id: 10, roleId: 1 },
        { id: 20, roleId: 2 },
      ],
      [
        { id: 1, name: 'Editor' },
        { id: 2, name: 'Viewer' },
      ]
    );

    const filtered = await service.filterRecipientsByHistoryAudience(
      [10, 20],
      'internal',
      99
    );
    expect(filtered).toEqual([10]);
  });

  it('keeps system admin for private history they did not author', async () => {
    policyService.getEffectivePermissionsForUser.mockResolvedValue({
      permissions: [],
      bypass: false,
    });

    installDbSelectMock(
      mockDb,
      [{ id: 30, roleId: 6 }],
      [{ id: 6, name: SYSTEM_ROLES.SYSTEM_ADMIN }]
    );

    const filtered = await service.filterRecipientsByHistoryAudience(
      [30],
      'private',
      99
    );
    expect(filtered).toEqual([30]);
  });
});
