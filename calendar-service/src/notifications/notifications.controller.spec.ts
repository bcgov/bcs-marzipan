import { Test, TestingModule } from '@nestjs/testing';

import type { AuthUser } from '@corpcal/shared';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    listForUser: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    dismiss: vi.fn(),
    markAllRead: vi.fn(),
    dismissAll: vi.fn(),
  };

  const mockUser: AuthUser = {
    id: 99,
    username: 'jdoe',
    displayName: 'Jane Doe',
    email: 'jane.doe@gov.bc.ca',
    roleId: 1,
    roleName: 'Admin',
    permissions: ['notifications.view'],
    teamIds: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('passes includeRead/page/pageSize into service listForUser', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 5,
      totalItems: 0,
      hasNext: false,
    });

    const result = await controller.list(mockUser, {
      includeRead: false,
      page: 2,
      pageSize: 5,
    });

    expect(result.success).toBe(true);
    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(99, {
      includeRead: false,
      page: 2,
      pageSize: 5,
    });
  });

  it('defaults includeRead to false when omitted', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      hasNext: false,
    });

    await controller.list(mockUser, {
      includeRead: false,
      page: 1,
      pageSize: 20,
    });

    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(99, {
      includeRead: false,
      page: 1,
      pageSize: 20,
    });
  });

  it('patchRecipient marks read when body.read is true', async () => {
    const result = await controller.patchRecipient(mockUser, 42, {
      read: true,
    });

    expect(mockNotificationsService.markRead).toHaveBeenCalledWith(42, 99);
    expect(mockNotificationsService.dismiss).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: { updated: true } });
  });

  it('patchRecipient dismisses when body.dismissed is true', async () => {
    const result = await controller.patchRecipient(mockUser, 7, {
      dismissed: true,
    });

    expect(mockNotificationsService.dismiss).toHaveBeenCalledWith(7, 99);
    expect(mockNotificationsService.markRead).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: { updated: true } });
  });

  it('markAllRead returns updated count from service', async () => {
    mockNotificationsService.markAllRead.mockResolvedValue(3);

    const result = await controller.markAllRead(mockUser);

    expect(mockNotificationsService.markAllRead).toHaveBeenCalledWith(99);
    expect(result).toEqual({ success: true, data: { updatedCount: 3 } });
  });

  it('dismissAll returns updated count from service', async () => {
    mockNotificationsService.dismissAll.mockResolvedValue(2);

    const result = await controller.dismissAll(mockUser);

    expect(mockNotificationsService.dismissAll).toHaveBeenCalledWith(99);
    expect(result).toEqual({ success: true, data: { updatedCount: 2 } });
  });
});
