import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@corpcal/shared';

import { UpsertBannerSettingsDto } from '../common/dto';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';

describe('BannerController', () => {
  let controller: BannerController;
  const mockBannerService: Partial<BannerService> = {
    upsertBannerSettings: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new BannerController(
      mockBannerService as unknown as BannerService
    );
  });

  it('throws ForbiddenException when non-System-Admin attempts to upsert banner', async () => {
    const body: UpsertBannerSettingsDto = {
      isActive: true,
      content: '<p>x</p>',
      backgroundColor: '#fff',
      textColor: '#000',
      isDismissible: true,
      startDateTime: null,
      endDateTime: null,
    } as UpsertBannerSettingsDto;

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
      controller.upsertBannerSettings(body, nonSystemAdminUser)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
