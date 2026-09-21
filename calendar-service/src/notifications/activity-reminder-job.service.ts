import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  sql,
} from 'drizzle-orm';

import {
  activities,
  activityCommsContacts,
  activityStatuses,
  dateStatuses,
  notificationEvents,
  timeStatuses,
  userActivityFavourites,
} from '@corpcal/database/schema';
import {
  addCalendarDaysToIsoDate,
  CALENDAR_SYSTEM_USER_ID,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  pacificCalendarDateFromUtcMs,
} from '@corpcal/shared';

import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { NotificationsService } from './notifications.service';

type ReminderEventType =
  | typeof NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_POST_DATED
  | typeof NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED
  | typeof NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_NULL_TIME
  | typeof NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED
  | typeof NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_UPCOMING
  | typeof NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_STALE;

type ReminderRunCounts = {
  reminderPostDated: number;
  reminderDateStatusNotConfirmed: number;
  reminderNullTime: number;
  reminderTimeStatusNotConfirmed: number;
  reminderUpcoming: number;
  reminderStale: number;
};

export type ActivityReminderBatchRunResult = {
  sent: number;
  skipped: boolean;
  skipReason?: 'in_flight' | 'advisory_lock' | 'error';
  counts: ReminderRunCounts;
};

const ACTIVITY_REMINDER_CRON_UTC = '0 15 7 * * *';
const ACTIVITY_REMINDER_CRON_TIMEZONE = 'UTC';
const DEDUPE_LOOKBACK_HOURS = 24;
const ACTIVITY_REMINDER_JOB_ADVISORY_CLASS = 7_881_905;
const ACTIVITY_REMINDER_JOB_ADVISORY_KEY = 1;

const EMPTY_COUNTS: ReminderRunCounts = {
  reminderPostDated: 0,
  reminderDateStatusNotConfirmed: 0,
  reminderNullTime: 0,
  reminderTimeStatusNotConfirmed: 0,
  reminderUpcoming: 0,
  reminderStale: 0,
};

@Injectable()
export class ActivityReminderJobService {
  private readonly logger = new Logger(ActivityReminderJobService.name);
  private inFlight = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Cron(ACTIVITY_REMINDER_CRON_UTC, {
    timeZone: ACTIVITY_REMINDER_CRON_TIMEZONE,
  })
  async onScheduledRun(): Promise<void> {
    const result = await this.runBatch();
    if (result.skipped) {
      this.logger.warn(
        `Activity reminder job skipped (${result.skipReason ?? 'unknown'})`
      );
      return;
    }

    this.logger.log(
      `Activity reminder job sent ${result.sent} notification set(s)`
    );
  }

  async previewBatch(): Promise<ReminderRunCounts> {
    const { leadDays, staleDays } =
      await this.applicationSettings.getActivityReminderSettings();
    const today = pacificCalendarDateFromUtcMs(Date.now());
    const windowEnd = addCalendarDaysToIsoDate(today, leadDays);

    const [
      postDated,
      dateStatusNotConfirmed,
      nullTime,
      timeStatusNotConfirmed,
    ] = await Promise.all([
      this.findPostDatedCandidateIds(today),
      this.findDateStatusNotConfirmedCandidateIds(today, windowEnd),
      this.findNullTimeCandidateIds(today, windowEnd),
      this.findTimeStatusNotConfirmedCandidateIds(today, windowEnd),
    ]);
    const [upcoming, stale] = await Promise.all([
      this.findUpcomingCandidateIds(today, windowEnd),
      this.findStaleCandidateIds(staleDays),
    ]);

    return {
      reminderPostDated: (
        await this.filterAlreadyReminded(
          postDated,
          NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_POST_DATED
        )
      ).length,
      reminderDateStatusNotConfirmed: (
        await this.filterAlreadyReminded(
          dateStatusNotConfirmed,
          NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED
        )
      ).length,
      reminderNullTime: (
        await this.filterAlreadyReminded(
          nullTime,
          NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_NULL_TIME
        )
      ).length,
      reminderTimeStatusNotConfirmed: (
        await this.filterAlreadyReminded(
          timeStatusNotConfirmed,
          NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED
        )
      ).length,
      reminderUpcoming: (
        await this.filterAlreadyReminded(
          upcoming,
          NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_UPCOMING
        )
      ).length,
      reminderStale: (
        await this.filterAlreadyReminded(
          stale,
          NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_STALE
        )
      ).length,
    };
  }

  async runBatch(): Promise<ActivityReminderBatchRunResult> {
    if (this.inFlight) {
      return {
        sent: 0,
        skipped: true,
        skipReason: 'in_flight',
        counts: EMPTY_COUNTS,
      };
    }
    this.inFlight = true;

    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const [lockResult] = await tx.execute(
          sql`SELECT pg_try_advisory_xact_lock(${ACTIVITY_REMINDER_JOB_ADVISORY_CLASS}::integer, ${ACTIVITY_REMINDER_JOB_ADVISORY_KEY}::integer) AS acquired`
        );
        if (!(lockResult as { acquired: boolean }).acquired) {
          this.logger.debug(
            'Activity reminder job: another session holds the reminder advisory lock — skipping'
          );
          return {
            sent: 0,
            skipped: true,
            skipReason: 'advisory_lock' as const,
            counts: EMPTY_COUNTS,
          };
        }

        const { leadDays, staleDays } =
          await this.applicationSettings.getActivityReminderSettings(tx);
        const today = pacificCalendarDateFromUtcMs(Date.now());
        const windowEnd = addCalendarDaysToIsoDate(today, leadDays);

        const counts = await this.sendReminderNotifications(tx, {
          leadDays,
          staleDays,
          today,
          windowEnd,
        });

        const sent =
          counts.reminderPostDated +
          counts.reminderDateStatusNotConfirmed +
          counts.reminderNullTime +
          counts.reminderTimeStatusNotConfirmed +
          counts.reminderUpcoming +
          counts.reminderStale;

        return { sent, skipped: false, counts };
      });
    } catch (error) {
      this.logger.error(
        'Activity reminder job failed',
        error instanceof Error ? error.stack : String(error)
      );
      return {
        sent: 0,
        skipped: true,
        skipReason: 'error',
        counts: EMPTY_COUNTS,
      };
    } finally {
      this.inFlight = false;
    }
  }

  private async filterAlreadyReminded(
    activityIds: number[],
    eventType: ReminderEventType,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    if (activityIds.length === 0) {
      return [];
    }

    const since = new Date(Date.now() - DEDUPE_LOOKBACK_HOURS * 60 * 60 * 1000);
    const sentRows = await executor
      .select({ entityId: notificationEvents.entityId })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.eventType, eventType),
          eq(notificationEvents.entityType, NOTIFICATION_ENTITY_TYPES.ACTIVITY),
          inArray(notificationEvents.entityId, activityIds),
          gte(notificationEvents.createdAt, since)
        )
      );

    const sentIds = new Set(sentRows.map((row) => row.entityId));
    return activityIds.filter((id) => !sentIds.has(id));
  }

  private async sendReminderNotifications(
    tx: DrizzleDbExecutor,
    input: {
      leadDays: number;
      staleDays: number;
      today: string;
      windowEnd: string;
    }
  ): Promise<ReminderRunCounts> {
    const counts: ReminderRunCounts = { ...EMPTY_COUNTS };

    const [
      postDated,
      dateStatusNotConfirmed,
      nullTime,
      timeStatusNotConfirmed,
    ] = await Promise.all([
      this.findPostDatedCandidateIds(input.today, tx),
      this.findDateStatusNotConfirmedCandidateIds(
        input.today,
        input.windowEnd,
        tx
      ),
      this.findNullTimeCandidateIds(input.today, input.windowEnd, tx),
      this.findTimeStatusNotConfirmedCandidateIds(
        input.today,
        input.windowEnd,
        tx
      ),
    ]);
    const [upcoming, stale] = await Promise.all([
      this.findUpcomingCandidateIds(input.today, input.windowEnd, tx),
      this.findStaleCandidateIds(input.staleDays, tx),
    ]);

    const postDatedToSend = await this.filterAlreadyReminded(
      postDated,
      NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_POST_DATED,
      tx
    );
    const dateStatusToSend = await this.filterAlreadyReminded(
      dateStatusNotConfirmed,
      NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED,
      tx
    );
    const nullTimeToSend = await this.filterAlreadyReminded(
      nullTime,
      NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_NULL_TIME,
      tx
    );
    const timeStatusToSend = await this.filterAlreadyReminded(
      timeStatusNotConfirmed,
      NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED,
      tx
    );
    const upcomingToSend = await this.filterAlreadyReminded(
      upcoming,
      NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_UPCOMING,
      tx
    );
    const staleToSend = await this.filterAlreadyReminded(
      stale,
      NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_STALE,
      tx
    );

    for (const activityId of postDatedToSend) {
      const recipients =
        await this.notificationsService.notifyActivityReminderPostDated({
          activityId,
          actorUserId: CALENDAR_SYSTEM_USER_ID,
          executor: tx,
        });
      if (recipients.length > 0) counts.reminderPostDated += 1;
    }

    for (const activityId of dateStatusToSend) {
      const recipients =
        await this.notificationsService.notifyActivityReminderDateStatusNotConfirmed(
          {
            activityId,
            actorUserId: CALENDAR_SYSTEM_USER_ID,
            leadDays: input.leadDays,
            executor: tx,
          }
        );
      if (recipients.length > 0) counts.reminderDateStatusNotConfirmed += 1;
    }

    for (const activityId of nullTimeToSend) {
      const recipients =
        await this.notificationsService.notifyActivityReminderNullTime({
          activityId,
          actorUserId: CALENDAR_SYSTEM_USER_ID,
          leadDays: input.leadDays,
          executor: tx,
        });
      if (recipients.length > 0) counts.reminderNullTime += 1;
    }

    for (const activityId of timeStatusToSend) {
      const recipients =
        await this.notificationsService.notifyActivityReminderTimeStatusNotConfirmed(
          {
            activityId,
            actorUserId: CALENDAR_SYSTEM_USER_ID,
            leadDays: input.leadDays,
            executor: tx,
          }
        );
      if (recipients.length > 0) counts.reminderTimeStatusNotConfirmed += 1;
    }

    for (const activityId of upcomingToSend) {
      const recipients =
        await this.notificationsService.notifyActivityReminderUpcoming({
          activityId,
          actorUserId: CALENDAR_SYSTEM_USER_ID,
          leadDays: input.leadDays,
          executor: tx,
        });
      if (recipients.length > 0) counts.reminderUpcoming += 1;
    }

    for (const activityId of staleToSend) {
      const recipients =
        await this.notificationsService.notifyActivityReminderStale({
          activityId,
          actorUserId: CALENDAR_SYSTEM_USER_ID,
          staleDays: input.staleDays,
          executor: tx,
        });
      if (recipients.length > 0) counts.reminderStale += 1;
    }

    return counts;
  }

  private async findPostDatedCandidateIds(
    today: string,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    const rows = await executor
      .select({ id: activities.id })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .innerJoin(
        activityCommsContacts,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(
        and(
          this.activeCommsCondition(),
          this.incompleteStatusCondition(),
          isNotNull(activities.startDate),
          sql`COALESCE(${activities.endDate}, ${activities.startDate}) < ${today}`
        )
      );

    return [...new Set(rows.map((row) => row.id))];
  }

  private async findDateStatusNotConfirmedCandidateIds(
    today: string,
    windowEnd: string,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    const rows = await executor
      .select({ id: activities.id })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .innerJoin(dateStatuses, eq(dateStatuses.id, activities.dateStatusId))
      .innerJoin(
        activityCommsContacts,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(
        and(
          this.activeCommsCondition(),
          this.incompleteStatusCondition(),
          isNotNull(activities.startDate),
          gte(activities.startDate, today),
          lte(activities.startDate, windowEnd),
          ne(dateStatuses.name, 'confirmed')
        )
      );

    return [...new Set(rows.map((row) => row.id))];
  }

  private async findNullTimeCandidateIds(
    today: string,
    windowEnd: string,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    const rows = await executor
      .select({ id: activities.id })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .innerJoin(
        activityCommsContacts,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(
        and(
          this.activeCommsCondition(),
          this.incompleteStatusCondition(),
          isNotNull(activities.startDate),
          gte(activities.startDate, today),
          lte(activities.startDate, windowEnd),
          isNull(activities.startTime)
        )
      );

    return [...new Set(rows.map((row) => row.id))];
  }

  private async findTimeStatusNotConfirmedCandidateIds(
    today: string,
    windowEnd: string,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    const rows = await executor
      .select({ id: activities.id })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .innerJoin(timeStatuses, eq(timeStatuses.id, activities.timeStatusId))
      .innerJoin(
        activityCommsContacts,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(
        and(
          this.activeCommsCondition(),
          this.incompleteStatusCondition(),
          isNotNull(activities.startDate),
          gte(activities.startDate, today),
          lte(activities.startDate, windowEnd),
          isNotNull(activities.startTime),
          ne(timeStatuses.name, 'confirmed')
        )
      );

    return [...new Set(rows.map((row) => row.id))];
  }

  private async findUpcomingCandidateIds(
    today: string,
    windowEnd: string,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    const rows = await executor
      .select({ id: activities.id })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .leftJoin(
        activityCommsContacts,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .leftJoin(
        userActivityFavourites,
        eq(userActivityFavourites.activityId, activities.id)
      )
      .where(
        and(
          this.incompleteStatusCondition(),
          isNotNull(activities.startDate),
          gte(activities.startDate, today),
          lte(activities.startDate, windowEnd),
          sql`(
            (${activityCommsContacts.activityId} IS NOT NULL AND ${activityCommsContacts.isActive} = true)
            OR ${userActivityFavourites.activityId} IS NOT NULL
          )`
        )
      );

    return [...new Set(rows.map((row) => row.id))];
  }

  private async findStaleCandidateIds(
    staleDays: number,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number[]> {
    const rows = await executor
      .select({ id: activities.id })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .innerJoin(
        activityCommsContacts,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(
        and(
          this.activeCommsCondition(),
          this.incompleteStatusCondition(),
          lte(
            activities.lastUpdatedDateTime,
            sql`now() - make_interval(days => ${staleDays})`
          )
        )
      );

    return [...new Set(rows.map((row) => row.id))];
  }

  private incompleteStatusCondition() {
    return and(
      ne(activityStatuses.name, 'completed'),
      ne(activityStatuses.name, 'deleted')
    );
  }

  private activeCommsCondition() {
    return eq(activityCommsContacts.isActive, true);
  }
}
