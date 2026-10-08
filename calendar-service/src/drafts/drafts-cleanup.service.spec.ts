import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DraftsCleanupService } from './drafts-cleanup.service';
import { DraftsService } from './drafts.service';

describe('DraftsCleanupService', () => {
  let service: DraftsCleanupService;

  const draftsService = {
    cleanupExpiredDrafts: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    draftsService.cleanupExpiredDrafts.mockResolvedValue(3);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftsCleanupService,
        { provide: DraftsService, useValue: draftsService },
      ],
    }).compile();

    service = module.get(DraftsCleanupService);
  });

  it('skips cleanup when a run is already in flight', async () => {
    (service as unknown as { inFlight: boolean }).inFlight = true;

    await service.cleanupExpiredDrafts();

    expect(draftsService.cleanupExpiredDrafts).not.toHaveBeenCalled();
  });

  it('removes expired drafts and logs the count', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log');

    await service.cleanupExpiredDrafts();

    expect(draftsService.cleanupExpiredDrafts).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      'Draft cleanup: removed 3 expired draft(s)'
    );
    expect((service as unknown as { inFlight: boolean }).inFlight).toBe(false);
  });

  it('clears inFlight after cleanup fails', async () => {
    draftsService.cleanupExpiredDrafts.mockRejectedValue(new Error('db down'));
    const errorSpy = vi.spyOn(Logger.prototype, 'error');

    await service.cleanupExpiredDrafts();

    expect(errorSpy).toHaveBeenCalledWith(
      'Draft cleanup failed',
      expect.any(Error)
    );
    expect((service as unknown as { inFlight: boolean }).inFlight).toBe(false);
  });
});
