import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import {
  recurringLockoutBannerSettings,
  users,
} from '@corpcal/database/schema';
import {
  isUserBlockedByRecurringEditLockout,
  RECURRING_EDIT_LOCKOUT_MESSAGE,
  RECURRING_EDIT_LOCKOUT_REASON,
  type RecurringEditLockoutSettingsSlice,
} from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';
import { PolicyService } from '../policy/policy.service';

@Injectable()
export class RecurringLockoutService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly policyService: PolicyService
  ) {}

  createLockoutHttpException(): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: RECURRING_EDIT_LOCKOUT_MESSAGE,
        reason: RECURRING_EDIT_LOCKOUT_REASON,
      },
      HttpStatus.FORBIDDEN
    );
  }

  async getLatestSettings(): Promise<RecurringEditLockoutSettingsSlice | null> {
    const [row] = await this.databaseService.db
      .select({
        isActive: recurringLockoutBannerSettings.isActive,
        startTimeOfDay: recurringLockoutBannerSettings.startTimeOfDay,
        endTimeOfDay: recurringLockoutBannerSettings.endTimeOfDay,
      })
      .from(recurringLockoutBannerSettings)
      .orderBy(
        desc(recurringLockoutBannerSettings.lastUpdatedDateTime),
        desc(recurringLockoutBannerSettings.id)
      )
      .limit(1);

    return row ?? null;
  }

  async assertUserCanEditDuringLockout(
    userId: number,
    permissions?: string[]
  ): Promise<void> {
    const settings = await this.getLatestSettings();

    if (!settings?.isActive) {
      return;
    }

    const effectivePermissions =
      permissions ?? (await this.resolveEffectivePermissions(userId));

    if (isUserBlockedByRecurringEditLockout(settings, effectivePermissions)) {
      throw this.createLockoutHttpException();
    }
  }

  private async resolveEffectivePermissions(userId: number): Promise<string[]> {
    const [user] = await this.databaseService.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found for edit lockout check.');
    }

    return (await this.policyService.getEffectivePermissionsForUser(userId))
      .permissions;
  }
}
