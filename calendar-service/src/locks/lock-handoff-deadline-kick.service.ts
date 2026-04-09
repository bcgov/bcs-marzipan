import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';

import { LocksService } from './locks.service';

/**
 * Schedules a one-shot run of due handoff processing at grace end for the pod
 * that handled `requestForceHandoff`. Backup cron still covers restarts.
 */
@Injectable()
export class LockHandoffDeadlineKickService implements OnModuleDestroy {
  private readonly logger = new Logger(LockHandoffDeadlineKickService.name);
  /** At most one pending handoff per activity — key by `activityId`. */
  private readonly scheduledByActivityId = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    @Inject(forwardRef(() => LocksService))
    private readonly locksService: LocksService
  ) {}

  onModuleDestroy(): void {
    for (const timeout of this.scheduledByActivityId.values()) {
      clearTimeout(timeout);
    }
    this.scheduledByActivityId.clear();
  }

  scheduleHandoffKick(activityId: number, graceEndsAt: Date): void {
    this.clearScheduledKick(activityId);
    const delayMs = Math.max(0, graceEndsAt.getTime() - Date.now());
    const timeout = setTimeout(() => {
      this.scheduledByActivityId.delete(activityId);
      void this.locksService.processAllDueHandoffs().catch((err) => {
        this.logger.error(
          'processAllDueHandoffs after handoff deadline failed',
          err instanceof Error ? err.stack : String(err)
        );
      });
    }, delayMs);
    this.scheduledByActivityId.set(activityId, timeout);
  }

  clearScheduledKick(activityId: number): void {
    const t = this.scheduledByActivityId.get(activityId);
    if (t != null) {
      clearTimeout(t);
      this.scheduledByActivityId.delete(activityId);
    }
  }
}
