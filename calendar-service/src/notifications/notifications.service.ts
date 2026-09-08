import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import {
  activities,
  activityCommsContacts,
  activityEventPlanners,
  activityStatuses,
  eventPlanners,
  notificationEvents,
  notificationRecipients,
  roles,
  teams,
  users,
  userTeams,
} from '@corpcal/database/schema';
import {
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_RECIPIENT_STATUSES,
  type NotificationChangeType,
  type NotificationEntityType,
  type NotificationEventType,
  type NotificationRecipientStatus,
} from '@corpcal/shared';
import type {
  NotificationItem,
  NotificationPage,
} from '@corpcal/shared/api/types';

import { ActivitiesGateway } from '../activities/activities.gateway';
import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { NotificationEmailService } from './notification-email.service';

interface CreateEventParams {
  eventType: string;
  entityType: string;
  entityId: number;
  changeType: string;
  summary: string;
  details: Record<string, unknown> | null;
  actorUserId: number;
  recipientUserIds: number[];
}

interface EmailRecipient {
  userId: number;
  email: string;
  displayName: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ActivitiesGateway))
    private readonly activitiesGateway: ActivitiesGateway,
    private readonly notificationEmailService: NotificationEmailService
  ) {}

  private async resolveActorUsername(
    actorUserId: number,
    executor: DrizzleDbExecutor
  ): Promise<string> {
    const [actor] = await executor
      .select({
        adDisplayName: users.adDisplayName,
        adUsername: users.adUsername,
        adEmail: users.adEmail,
      })
      .from(users)
      .where(eq(users.id, actorUserId))
      .limit(1);

    return (
      actor?.adDisplayName ??
      actor?.adUsername ??
      actor?.adEmail ??
      `User ${actorUserId}`
    );
  }

  private toIso(value: Date | string | null): string | null {
    if (value == null) return null;
    return value instanceof Date ? value.toISOString() : String(value);
  }

  private async resolveEmailRecipients(
    userIds: number[]
  ): Promise<EmailRecipient[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({
        userId: users.id,
        email: users.adEmail,
        displayName: users.adDisplayName,
      })
      .from(users)
      .where(
        and(
          inArray(users.id, userIds),
          eq(users.isActive, true),
          eq(users.enableEmailNotification, true),
          isNotNull(users.adEmail)
        )
      );

    return rows
      .map((row) => ({
        userId: row.userId,
        email: String(row.email).trim(),
        displayName: row.displayName,
      }))
      .filter((row) => row.email.length > 0);
  }

  async listForUser(
    userId: number,
    options?: { includeRead?: boolean; page?: number; pageSize?: number }
  ): Promise<NotificationPage> {
    const includeRead = options?.includeRead ?? false;
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, options?.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const allowedStatuses = includeRead
      ? [
          NOTIFICATION_RECIPIENT_STATUSES.UNREAD,
          NOTIFICATION_RECIPIENT_STATUSES.READ,
        ]
      : [NOTIFICATION_RECIPIENT_STATUSES.UNREAD];

    const baseWhere = and(
      eq(notificationRecipients.userId, userId),
      inArray(notificationRecipients.status, allowedStatuses)
    );

    const [countRow, rows] = await Promise.all([
      this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationRecipients)
        .where(baseWhere)
        .then((result) => result[0]),
      this.databaseService.db
        .select({
          recipientId: notificationRecipients.id,
          eventId: notificationEvents.id,
          eventType: notificationEvents.eventType,
          entityType: notificationEvents.entityType,
          entityId: notificationEvents.entityId,
          changeType: notificationEvents.changeType,
          summary: notificationEvents.summary,
          details: notificationEvents.details,
          actorUserId: notificationEvents.actorUserId,
          actorUsername: notificationEvents.actorUsername,
          eventCreatedAt: notificationEvents.createdAt,
          status: notificationRecipients.status,
          readAt: notificationRecipients.readAt,
          dismissedAt: notificationRecipients.dismissedAt,
        })
        .from(notificationRecipients)
        .innerJoin(
          notificationEvents,
          eq(notificationEvents.id, notificationRecipients.eventId)
        )
        .where(baseWhere)
        .orderBy(
          desc(notificationEvents.createdAt),
          desc(notificationRecipients.id)
        )
        .limit(pageSize)
        .offset(offset),
    ]);

    const items: NotificationItem[] = rows.map((row) => ({
      recipientId: row.recipientId,
      eventId: row.eventId,
      eventType: row.eventType as NotificationEventType,
      entityType: row.entityType as NotificationEntityType,
      entityId: row.entityId,
      changeType: row.changeType as NotificationChangeType,
      summary: row.summary,
      details: (row.details as Record<string, unknown> | null) ?? null,
      actorUserId: row.actorUserId,
      actorUsername: row.actorUsername,
      createdAt: this.toIso(row.eventCreatedAt) ?? new Date().toISOString(),
      status: row.status as NotificationRecipientStatus,
      readAt: this.toIso(row.readAt),
      dismissedAt: this.toIso(row.dismissedAt),
    }));

    const totalItems = countRow?.count ?? 0;
    return {
      items,
      page,
      pageSize,
      totalItems,
      hasNext: offset + items.length < totalItems,
    };
  }

  async getUnreadCount(userId: number): Promise<number> {
    const rows = await this.databaseService.db
      .select({ id: notificationRecipients.id })
      .from(notificationRecipients)
      .where(
        and(
          eq(notificationRecipients.userId, userId),
          eq(
            notificationRecipients.status,
            NOTIFICATION_RECIPIENT_STATUSES.UNREAD
          )
        )
      );
    return rows.length;
  }

  async markRead(recipientId: number, userId: number): Promise<void> {
    const [row] = await this.databaseService.db
      .select({ status: notificationRecipients.status })
      .from(notificationRecipients)
      .where(
        and(
          eq(notificationRecipients.id, recipientId),
          eq(notificationRecipients.userId, userId)
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('Notification not found');
    }

    if (row.status === NOTIFICATION_RECIPIENT_STATUSES.UNREAD) {
      await this.databaseService.db
        .update(notificationRecipients)
        .set({
          status: NOTIFICATION_RECIPIENT_STATUSES.READ,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notificationRecipients.id, recipientId),
            eq(notificationRecipients.userId, userId)
          )
        );
      this.activitiesGateway.notifyNotificationsChanged([userId]);
    }
  }

  async dismiss(recipientId: number, userId: number): Promise<void> {
    const [row] = await this.databaseService.db
      .select({ status: notificationRecipients.status })
      .from(notificationRecipients)
      .where(
        and(
          eq(notificationRecipients.id, recipientId),
          eq(notificationRecipients.userId, userId)
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('Notification not found');
    }

    if (row.status !== NOTIFICATION_RECIPIENT_STATUSES.DISMISSED) {
      await this.databaseService.db
        .update(notificationRecipients)
        .set({
          status: NOTIFICATION_RECIPIENT_STATUSES.DISMISSED,
          dismissedAt: new Date(),
        })
        .where(
          and(
            eq(notificationRecipients.id, recipientId),
            eq(notificationRecipients.userId, userId)
          )
        );
      this.activitiesGateway.notifyNotificationsChanged([userId]);
    }
  }

  async markAllRead(userId: number): Promise<number> {
    const updated = await this.databaseService.db
      .update(notificationRecipients)
      .set({
        status: NOTIFICATION_RECIPIENT_STATUSES.READ,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notificationRecipients.userId, userId),
          eq(
            notificationRecipients.status,
            NOTIFICATION_RECIPIENT_STATUSES.UNREAD
          )
        )
      )
      .returning({ id: notificationRecipients.id });

    if (updated.length > 0) {
      this.activitiesGateway.notifyNotificationsChanged([userId]);
    }

    return updated.length;
  }

  async dismissAll(userId: number): Promise<number> {
    const updated = await this.databaseService.db
      .update(notificationRecipients)
      .set({
        status: NOTIFICATION_RECIPIENT_STATUSES.DISMISSED,
        dismissedAt: new Date(),
      })
      .where(
        and(
          eq(notificationRecipients.userId, userId),
          inArray(notificationRecipients.status, [
            NOTIFICATION_RECIPIENT_STATUSES.UNREAD,
            NOTIFICATION_RECIPIENT_STATUSES.READ,
          ])
        )
      )
      .returning({ id: notificationRecipients.id });

    if (updated.length > 0) {
      this.activitiesGateway.notifyNotificationsChanged([userId]);
    }

    return updated.length;
  }

  private async createEventWithRecipients(
    params: CreateEventParams
  ): Promise<number[]> {
    const dedupedRecipients = [...new Set(params.recipientUserIds)].filter(
      (id) => id !== params.actorUserId
    );

    if (dedupedRecipients.length === 0) {
      return [];
    }

    await this.databaseService.db.transaction(async (tx) => {
      const actorUsername = await this.resolveActorUsername(
        params.actorUserId,
        tx
      );

      const [eventRow] = await tx
        .insert(notificationEvents)
        .values({
          eventType: params.eventType,
          entityType: params.entityType,
          entityId: params.entityId,
          changeType: params.changeType,
          summary: params.summary,
          details: params.details,
          actorUserId: params.actorUserId,
          actorUsername,
        })
        .returning({ id: notificationEvents.id });

      await tx
        .insert(notificationRecipients)
        .values(
          dedupedRecipients.map((userId) => ({
            eventId: eventRow.id,
            userId,
            status: NOTIFICATION_RECIPIENT_STATUSES.UNREAD,
          }))
        )
        .onConflictDoNothing();
    });

    this.activitiesGateway.notifyNotificationsChanged(dedupedRecipients);

    try {
      const [actorUsername, recipients] = await Promise.all([
        this.resolveActorUsername(params.actorUserId, this.databaseService.db),
        this.resolveEmailRecipients(dedupedRecipients),
      ]);

      await this.notificationEmailService.sendNotificationEventEmail({
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        summary: params.summary,
        details: params.details,
        actorUsername,
        recipients,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send notification email(s): ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return dedupedRecipients;
  }

  async notifyActivityCreateOrStatusChange(input: {
    activityId: number;
    actorUserId: number;
    changeType: 'create' | 'status_changed';
  }): Promise<number[]> {
    const [activityRow] = await this.databaseService.db
      .select({
        id: activities.id,
        title: activities.title,
        displayId: activities.displayId,
        activityStatusName: activityStatuses.name,
      })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activityStatuses.id, activities.activityStatusId)
      )
      .where(eq(activities.id, input.activityId))
      .limit(1);

    if (!activityRow) {
      this.logger.warn(
        `Skipping notification for activity ${input.activityId}: activity not found`
      );
      return [];
    }

    const [adminRows, commsRows, plannerRows] = await Promise.all([
      this.databaseService.db
        .select({ id: users.id })
        .from(users)
        .innerJoin(roles, eq(roles.id, users.roleId))
        .where(
          and(
            eq(users.isActive, true),
            inArray(roles.name, ['Admin', 'System Admin'])
          )
        ),
      this.databaseService.db
        .select({ id: activityCommsContacts.userId })
        .from(activityCommsContacts)
        .innerJoin(users, eq(users.id, activityCommsContacts.userId))
        .where(
          and(
            eq(activityCommsContacts.activityId, input.activityId),
            eq(activityCommsContacts.isActive, true),
            eq(users.isActive, true)
          )
        ),
      this.databaseService.db
        .selectDistinct({ id: users.id })
        .from(activityEventPlanners)
        .innerJoin(
          eventPlanners,
          eq(eventPlanners.id, activityEventPlanners.eventPlannerId)
        )
        .innerJoin(
          users,
          sql`lower(${users.adEmail}) = lower(${eventPlanners.email})`
        )
        .where(
          and(
            eq(activityEventPlanners.activityId, input.activityId),
            eq(activityEventPlanners.isActive, true),
            isNotNull(activityEventPlanners.eventPlannerId),
            isNotNull(eventPlanners.email),
            isNotNull(users.adEmail),
            eq(users.isActive, true)
          )
        ),
    ]);

    const recipientUserIds = [
      ...adminRows.map((r) => r.id),
      ...commsRows.map((r) => r.id),
      ...plannerRows.map((r) => r.id),
    ];

    const summaryPrefix =
      input.changeType === 'create'
        ? 'Activity created'
        : 'Activity status changed';

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_CREATE,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: input.activityId,
      changeType:
        input.changeType === 'create'
          ? NOTIFICATION_CHANGE_TYPES.CREATE
          : NOTIFICATION_CHANGE_TYPES.STATUS_CHANGED,
      summary: `${summaryPrefix}: ${activityRow.displayId ?? `Activity ${activityRow.id}`} - ${activityRow.title}`,
      details: {
        activityId: activityRow.id,
        displayId: activityRow.displayId,
        title: activityRow.title,
        status: activityRow.activityStatusName,
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async notifyUserAddedToTeam(input: {
    userId: number;
    teamId: number;
    actorUserId: number;
    membershipRole: string;
  }): Promise<number[]> {
    const [[targetUser], [teamRow], ownerRows] = await Promise.all([
      this.databaseService.db
        .select({
          id: users.id,
          adDisplayName: users.adDisplayName,
          adUsername: users.adUsername,
          adEmail: users.adEmail,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1),
      this.databaseService.db
        .select({
          id: teams.id,
          name: teams.name,
          displayName: teams.displayName,
        })
        .from(teams)
        .where(eq(teams.id, input.teamId))
        .limit(1),
      this.databaseService.db
        .select({ id: users.id })
        .from(userTeams)
        .innerJoin(users, eq(users.id, userTeams.userId))
        .where(
          and(
            eq(userTeams.teamId, input.teamId),
            eq(userTeams.role, 'owner'),
            eq(userTeams.isActive, true),
            eq(users.isActive, true)
          )
        ),
    ]);

    if (!targetUser || !teamRow || !targetUser.isActive) {
      return [];
    }

    const targetLabel =
      targetUser.adDisplayName ??
      targetUser.adUsername ??
      targetUser.adEmail ??
      `User ${targetUser.id}`;

    const teamLabel = teamRow.displayName ?? teamRow.name;
    const recipientUserIds = [targetUser.id, ...ownerRows.map((r) => r.id)];

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_TEAM_MEMBER_ADDED,
      entityType: NOTIFICATION_ENTITY_TYPES.TEAM,
      entityId: teamRow.id,
      changeType: NOTIFICATION_CHANGE_TYPES.TEAM_MEMBER_ADDED,
      summary: `${targetLabel} added to team ${teamLabel}`,
      details: {
        userId: targetUser.id,
        teamId: teamRow.id,
        teamName: teamLabel,
        membershipRole: input.membershipRole,
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }
}
