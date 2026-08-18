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
  isRoleBlockedByRecurringEditLockout,
  RECURRING_EDIT_LOCKOUT_MESSAGE,
  RECURRING_EDIT_LOCKOUT_REASON,
  type RecurringEditLockoutSettingsSlice,
} from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class RecurringLockoutService {
  constructor(private readonly databaseService: DatabaseService) {}

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
        exemptRoleIds: recurringLockoutBannerSettings.exemptRoleIds,
      })
      .from(recurringLockoutBannerSettings)
      .orderBy(
        desc(recurringLockoutBannerSettings.lastUpdatedDateTime),
        desc(recurringLockoutBannerSettings.id)
      )
      .limit(1);

    return row ?? null;
  }

  async assertRoleCanEditDuringLockout(roleId: number): Promise<void> {
    const settings = await this.getLatestSettings();

    if (isRoleBlockedByRecurringEditLockout(settings, roleId)) {
      throw this.createLockoutHttpException();
    }
  }

  async assertUserCanEditDuringLockout(userId: number): Promise<void> {
    const settings = await this.getLatestSettings();

    if (!settings?.isActive) {
      return;
    }

    const [user] = await this.databaseService.db
      .select({ roleId: users.roleId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found for edit lockout check.');
    }

    if (isRoleBlockedByRecurringEditLockout(settings, user.roleId)) {
      throw this.createLockoutHttpException();
    }
  }
}
