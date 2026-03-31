import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BannerController } from './banner.controller';

describe('BannerController', () => {
  let controller: BannerController;
  const mockBannerService = {
    upsertBannerSettings: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new BannerController(mockBannerService);
  });

  it('throws ForbiddenException when non-System-Admin attempts to upsert banner', async () => {
    const body = {
      isActive: true,
      content: '<p>x</p>',
      backgroundColor: '#fff',
      textColor: '#000',
      isDismissible: true,
      startDateTime: null,
      endDateTime: null,
    } as any;

    const nonSystemAdminUser = { id: 1, roleId: 5 } as any;

    await expect(
      controller.upsertBannerSettings(body, nonSystemAdminUser)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
