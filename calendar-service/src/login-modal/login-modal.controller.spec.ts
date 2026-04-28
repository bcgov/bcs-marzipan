import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SYSTEM_ROLE_IDS, type AuthUser } from '@corpcal/shared';

import { UpsertLoginModalSettingsDto } from '../common/dto';
import { LoginModalController } from './login-modal.controller';
import { LoginModalService } from './login-modal.service';

describe('LoginModalController', () => {
  let controller: LoginModalController;
  const mockLoginModalService: Partial<LoginModalService> = {
    upsert: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new LoginModalController(
      mockLoginModalService as unknown as LoginModalService
    );
  });

  it('throws ForbiddenException when non-System-Admin attempts to upsert settings', async () => {
    const body: UpsertLoginModalSettingsDto = {
      isActive: true,
      title: 'Notice',
      content: '<p>Hello</p>',
      startDateTime: null,
      endDateTime: null,
    };

    const nonSystemAdminUser: AuthUser = {
      id: 1,
      username: 'user1',
      displayName: 'User One',
      email: 'user1@example.com',
      roleId: 5,
      roleName: 'Editor',
      permissions: [],
      teamIds: [],
    };

    await expect(
      controller.upsertSettings(body, nonSystemAdminUser)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('calls upsert and returns wrapped result for System Admin', async () => {
    const body: UpsertLoginModalSettingsDto = {
      isActive: true,
      title: 'Notice',
      content: '<p>Hello</p>',
      startDateTime: null,
      endDateTime: null,
    };

    const systemAdminUser: AuthUser = {
      id: 2,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: SYSTEM_ROLE_IDS.SYSTEM_ADMIN,
      roleName: 'System Admin',
      permissions: [],
      teamIds: [],
    };

    const mockResult = {
      id: 1,
      isActive: true,
      title: 'Notice',
      content: '<p>Hello</p>',
      startDateTime: null,
      endDateTime: null,
      createdDateTime: new Date().toISOString(),
      lastUpdatedDateTime: new Date().toISOString(),
    };

    vi.mocked(mockLoginModalService.upsert!).mockResolvedValue(mockResult);

    const result = await controller.upsertSettings(body, systemAdminUser);

    expect(result).toEqual({ success: true, data: mockResult });
    expect(mockLoginModalService.upsert).toHaveBeenCalledWith(body, 2);
  });
});
