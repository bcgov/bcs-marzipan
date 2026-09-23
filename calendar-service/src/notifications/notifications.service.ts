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
  activityFlags,
  activityStatuses,
  eventPlanners,
  ministries,
  notificationEvents,
  notificationRecipients,
  permissions,
  rolePermissions,
  roles,
  teams,
  userActivityFavourites,
  users,
  userTeams,
} from '@corpcal/database/schema';
import {
  canViewHistoryAudience,
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_RECIPIENT_STATUSES,
  type HistoryAudience,
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
import { PolicyService } from '../policy/policy.service';
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

type ActivityIdentity = {
  id: number;
  title: string;
  displayId: string | null;
  createdBy: number;
  lastUpdatedBy: number;
};

type TeamIdentity = {
  id: number;
  name: string;
  displayName: string | null;
  ministryId: number | null;
};

const ACTIVITY_HARD_DELETED_EVENT_TYPE =
  'calendar.activity.hard_deleted' as NotificationEventType;
const ACTIVITY_NOTE_ADDED_EVENT_TYPE =
  'calendar.activity.note_added' as NotificationEventType;
const ACTIVITY_FLAG_ASSIGNMENT_CHANGED_EVENT_TYPE =
  'calendar.activity.flag_assignment_changed' as NotificationEventType;
const ACTIVITIES_TRANSFERRED_EVENT_TYPE =
  'calendar.activities.transferred' as NotificationEventType;
const USER_CREATED_EVENT_TYPE =
  'calendar.user.created' as NotificationEventType;
const USER_UPDATED_EVENT_TYPE =
  'calendar.user.updated' as NotificationEventType;
const TEAM_UPDATED_EVENT_TYPE =
  'calendar.team.updated' as NotificationEventType;
const HARD_DELETED_CHANGE_TYPE = 'hard_deleted' as NotificationChangeType;
const NOTE_ADDED_CHANGE_TYPE = 'note_added' as NotificationChangeType;
const FLAG_ASSIGNMENT_CHANGED_CHANGE_TYPE =
  'flag_assignment_changed' as NotificationChangeType;
const TRANSFERRED_CHANGE_TYPE = 'transferred' as NotificationChangeType;
const USER_ENTITY_TYPE = 'user' as NotificationEntityType;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ActivitiesGateway))
    private readonly activitiesGateway: ActivitiesGateway,
    private readonly notificationEmailService: NotificationEmailService,
    private readonly policyService: PolicyService
  ) {}

  /** Drop recipients who cannot view the save's history audience tier. */
  async filterRecipientsByHistoryAudience(
    recipientUserIds: number[],
    audience: HistoryAudience,
    historyActorUserId: number
  ): Promise<number[]> {
    if (audience === 'public' || recipientUserIds.length === 0) {
      return recipientUserIds;
    }

    const uniqueIds = [...new Set(recipientUserIds)];
    const userRows = await this.databaseService.db
      .select({ id: users.id, roleId: users.roleId })
      .from(users)
      .where(inArray(users.id, uniqueIds));

    const roleIds = [...new Set(userRows.map((row) => row.roleId))];
    const roleRows =
      roleIds.length > 0
        ? await this.databaseService.db
            .select({ id: roles.id, name: roles.name })
            .from(roles)
            .where(inArray(roles.id, roleIds))
        : [];
    const roleNameById = new Map(roleRows.map((row) => [row.id, row.name]));

    const filtered: number[] = [];
    for (const row of userRows) {
      const { permissions } =
        await this.policyService.getEffectivePermissionsForUser(row.id);
      if (
        canViewHistoryAudience(
          {
            userId: row.id,
            permissions,
            roleName: roleNameById.get(row.roleId) ?? '',
          },
          { audience, userId: historyActorUserId }
        )
      ) {
        filtered.push(row.id);
      }
    }
    return filtered;
  }

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

  private async resolveActivityIdentity(
    activityId: number
  ): Promise<ActivityIdentity | null> {
    const [activityRow] = await this.databaseService.db
      .select({
        id: activities.id,
        title: activities.title,
        displayId: activities.displayId,
        createdBy: activities.createdBy,
        lastUpdatedBy: activities.lastUpdatedBy,
      })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    return activityRow ?? null;
  }

  private async resolveTeamIdentity(
    teamId: number
  ): Promise<TeamIdentity | null> {
    const [teamRow] = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    return teamRow ?? null;
  }

  private formatActivityLabel(activity: ActivityIdentity): string {
    return `${activity.displayId ?? `Activity ${activity.id}`} - ${activity.title}`;
  }

  private async resolveUserLabel(userId: number): Promise<string> {
    const [userRow] = await this.databaseService.db
      .select({
        displayName: users.adDisplayName,
        username: users.adUsername,
        email: users.adEmail,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return (
      userRow?.displayName ??
      userRow?.username ??
      userRow?.email ??
      `User ${userId}`
    );
  }

  private async getAdminUserIds(): Promise<number[]> {
    const rows = await this.databaseService.db
      .select({ id: users.id })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(
        and(
          eq(users.isActive, true),
          inArray(roles.name, ['Admin', 'System Admin'])
        )
      );

    return rows.map((row) => row.id);
  }

  private async resolveActiveTeamMemberUserIds(
    teamId: number
  ): Promise<number[]> {
    const rows = await this.databaseService.db
      .select({ id: userTeams.userId })
      .from(userTeams)
      .innerJoin(users, eq(users.id, userTeams.userId))
      .where(
        and(
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true),
          eq(users.isActive, true)
        )
      );

    return rows.map((row) => row.id);
  }

  private async resolveActivityAudienceUserIds(input: {
    activityId: number;
    includeCommsContacts?: boolean;
    includeWatchlisters?: boolean;
  }): Promise<number[]> {
    const [adminUserIds, commsRows, watchRows] = await Promise.all([
      this.getAdminUserIds(),
      input.includeCommsContacts
        ? this.databaseService.db
            .select({ id: activityCommsContacts.userId })
            .from(activityCommsContacts)
            .innerJoin(users, eq(users.id, activityCommsContacts.userId))
            .where(
              and(
                eq(activityCommsContacts.activityId, input.activityId),
                eq(activityCommsContacts.isActive, true),
                eq(users.isActive, true)
              )
            )
        : Promise.resolve([] as Array<{ id: number }>),
      input.includeWatchlisters
        ? this.databaseService.db
            .select({ id: userActivityFavourites.userId })
            .from(userActivityFavourites)
            .innerJoin(users, eq(users.id, userActivityFavourites.userId))
            .where(
              and(
                eq(userActivityFavourites.activityId, input.activityId),
                eq(users.isActive, true)
              )
            )
        : Promise.resolve([] as Array<{ id: number }>),
    ]);

    return [
      ...adminUserIds,
      ...commsRows.map((row) => row.id),
      ...watchRows.map((row) => row.id),
    ];
  }

  async notifyActivityStatusChangedToAudience(input: {
    activityId: number;
    actorUserId: number;
    status: 'reviewed' | 'delete_requested' | 'deleted';
    includeWatchlisters?: boolean;
    historyAudience?: HistoryAudience;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    let recipientUserIds = await this.resolveActivityAudienceUserIds({
      activityId: input.activityId,
      includeCommsContacts: true,
      includeWatchlisters: input.includeWatchlisters === true,
    });

    recipientUserIds = await this.filterRecipientsByHistoryAudience(
      recipientUserIds,
      input.historyAudience ?? 'public',
      input.actorUserId
    );

    const statusLabel =
      input.status === 'delete_requested'
        ? 'Delete Requested'
        : input.status === 'deleted'
          ? 'Deleted'
          : 'Reviewed';

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_STATUS_CHANGED,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.STATUS_CHANGED,
      summary: `Activity status changed to ${statusLabel}: ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        status: input.status,
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async getActivityAudienceForHardDelete(
    activityId: number
  ): Promise<number[]> {
    return this.resolveActivityAudienceUserIds({
      activityId,
      includeCommsContacts: true,
      includeWatchlisters: true,
    });
  }

  async notifyActivityHardDeleted(input: {
    activityId: number;
    actorUserId: number;
    title: string;
    displayId: string | null;
    recipientUserIds: number[];
  }): Promise<number[]> {
    const activityLabel = `${input.displayId ?? `Activity ${input.activityId}`} - ${input.title}`;

    return this.createEventWithRecipients({
      eventType: ACTIVITY_HARD_DELETED_EVENT_TYPE,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: input.activityId,
      changeType: HARD_DELETED_CHANGE_TYPE,
      summary: `Activity permanently deleted: ${activityLabel}`,
      details: {
        activityId: input.activityId,
        displayId: input.displayId,
        title: input.title,
        status: 'hard_deleted',
      },
      actorUserId: input.actorUserId,
      recipientUserIds: input.recipientUserIds,
    });
  }

  async notifyActivityHistoryNoteAdded(input: {
    activityId: number;
    actorUserId: number;
    note: string;
    historyAudience?: HistoryAudience;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    let recipientUserIds = await this.resolveActivityAudienceUserIds({
      activityId: input.activityId,
      includeCommsContacts: true,
      includeWatchlisters: false,
    });

    recipientUserIds = await this.filterRecipientsByHistoryAudience(
      recipientUserIds,
      input.historyAudience ?? 'public',
      input.actorUserId
    );

    return this.createEventWithRecipients({
      eventType: ACTIVITY_NOTE_ADDED_EVENT_TYPE,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTE_ADDED_CHANGE_TYPE,
      summary: `Activity history note added: ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        note: input.note,
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async notifyActivityFlagAssignmentChanged(input: {
    activityId: number;
    actorUserId: number;
    addedAssigneeIds: number[];
    removedAssigneeIds: number[];
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const uniqueAdded = [...new Set(input.addedAssigneeIds)].filter(
      (id) => Number.isInteger(id) && id > 0
    );
    const uniqueRemoved = [...new Set(input.removedAssigneeIds)].filter(
      (id) => Number.isInteger(id) && id > 0
    );

    const allRecipients = new Set<number>();

    if (uniqueAdded.length > 0) {
      const assignedRecipients = await this.createEventWithRecipients({
        eventType: ACTIVITY_FLAG_ASSIGNMENT_CHANGED_EVENT_TYPE,
        entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
        entityId: activity.id,
        changeType: FLAG_ASSIGNMENT_CHANGED_CHANGE_TYPE,
        summary: `You were assigned to review activity: ${this.formatActivityLabel(activity)}`,
        details: {
          activityId: activity.id,
          displayId: activity.displayId,
          title: activity.title,
          action: 'assigned',
          assigneeIds: uniqueAdded,
        },
        actorUserId: input.actorUserId,
        recipientUserIds: uniqueAdded,
      });
      assignedRecipients.forEach((id) => allRecipients.add(id));
    }

    if (uniqueRemoved.length > 0) {
      const unassignedRecipients = await this.createEventWithRecipients({
        eventType: ACTIVITY_FLAG_ASSIGNMENT_CHANGED_EVENT_TYPE,
        entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
        entityId: activity.id,
        changeType: FLAG_ASSIGNMENT_CHANGED_CHANGE_TYPE,
        summary: `You were unassigned from reviewing activity: ${this.formatActivityLabel(activity)}`,
        details: {
          activityId: activity.id,
          displayId: activity.displayId,
          title: activity.title,
          action: 'unassigned',
          assigneeIds: uniqueRemoved,
        },
        actorUserId: input.actorUserId,
        recipientUserIds: uniqueRemoved,
      });
      unassignedRecipients.forEach((id) => allRecipients.add(id));
    }

    return Array.from(allRecipients);
  }

  async notifyActivitiesTransferred(input: {
    actorUserId: number;
    fromUserId: number;
    toUserId: number;
    transferredCount: number;
    activityIds: number[];
    includeAdmins?: boolean;
  }): Promise<number[]> {
    if (input.transferredCount <= 0) {
      return [];
    }

    const [fromUserLabel, toUserLabel, adminUserIds] = await Promise.all([
      this.resolveUserLabel(input.fromUserId),
      this.resolveUserLabel(input.toUserId),
      input.includeAdmins === true
        ? this.getAdminUserIds()
        : Promise.resolve([] as number[]),
    ]);

    const recipientUserIds = [
      input.fromUserId,
      input.toUserId,
      ...adminUserIds,
    ];
    const plural = input.transferredCount === 1 ? 'activity' : 'activities';

    return this.createEventWithRecipients({
      eventType: ACTIVITIES_TRANSFERRED_EVENT_TYPE,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: input.activityIds[0] ?? 0,
      changeType: TRANSFERRED_CHANGE_TYPE,
      summary: `${input.transferredCount} ${plural} comms assignment${input.transferredCount === 1 ? ' was' : 's were'} transferred from ${fromUserLabel} to ${toUserLabel}`,
      details: {
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        transferredCount: input.transferredCount,
        activityIds: input.activityIds,
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async notifyUserCreated(input: {
    userId: number;
    actorUserId: number;
  }): Promise<number[]> {
    const userLabel = await this.resolveUserLabel(input.userId);
    const adminUserIds = await this.getAdminUserIds();

    return this.createEventWithRecipients({
      eventType: USER_CREATED_EVENT_TYPE,
      entityType: USER_ENTITY_TYPE,
      entityId: input.userId,
      changeType: NOTIFICATION_CHANGE_TYPES.CREATE,
      summary: `User created: ${userLabel}`,
      details: {
        userId: input.userId,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: adminUserIds,
    });
  }

  async notifyUserUpdated(input: {
    userId: number;
    actorUserId: number;
    changedFields: string[];
    summary: string;
    details?: Record<string, unknown>;
    includeSubjectUser?: boolean;
    includeAdmins?: boolean;
  }): Promise<number[]> {
    const recipientUserIds: number[] = [];
    if (input.includeSubjectUser !== false) {
      recipientUserIds.push(input.userId);
    }
    if (input.includeAdmins !== false) {
      recipientUserIds.push(...(await this.getAdminUserIds()));
    }

    return this.createEventWithRecipients({
      eventType: USER_UPDATED_EVENT_TYPE,
      entityType: USER_ENTITY_TYPE,
      entityId: input.userId,
      changeType: NOTIFICATION_CHANGE_TYPES.UPDATED,
      summary: input.summary,
      details: {
        userId: input.userId,
        changedFields: input.changedFields,
        ...(input.details ?? {}),
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async notifyTeamUpdated(input: {
    teamId: number;
    actorUserId: number;
    changedFields: string[];
  }): Promise<number[]> {
    const team = await this.resolveTeamIdentity(input.teamId);
    if (!team) {
      return [];
    }

    const [adminUserIds, memberUserIds] = await Promise.all([
      this.getAdminUserIds(),
      this.resolveActiveTeamMemberUserIds(input.teamId),
    ]);

    return this.createEventWithRecipients({
      eventType: TEAM_UPDATED_EVENT_TYPE,
      entityType: NOTIFICATION_ENTITY_TYPES.TEAM,
      entityId: team.id,
      changeType: NOTIFICATION_CHANGE_TYPES.UPDATED,
      summary: `Team updated: ${team.displayName ?? team.name}`,
      details: {
        teamId: team.id,
        changedFields: input.changedFields,
        name: team.name,
        displayName: team.displayName,
        ministryId: team.ministryId,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: [...adminUserIds, ...memberUserIds],
    });
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

  async notifyActivitySharedWithTeamsChanged(input: {
    activityId: number;
    actorUserId: number;
    teamIds: number[];
    historyAudience?: HistoryAudience;
  }): Promise<number[]> {
    const dedupedTeamIds = [...new Set(input.teamIds)].filter(
      (teamId) => Number.isInteger(teamId) && teamId > 0
    );
    if (dedupedTeamIds.length === 0) {
      return [];
    }

    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const [teamRows, membershipRows] = await Promise.all([
      this.databaseService.db
        .select({
          id: teams.id,
          teamName: teams.name,
          teamDisplayName: teams.displayName,
          ministryDisplayName: ministries.displayName,
        })
        .from(teams)
        .leftJoin(ministries, eq(ministries.id, teams.ministryId))
        .where(
          and(inArray(teams.id, dedupedTeamIds), eq(teams.isActive, true))
        ),
      this.databaseService.db
        .select({ teamId: userTeams.teamId, userId: users.id })
        .from(userTeams)
        .innerJoin(users, eq(users.id, userTeams.userId))
        .where(
          and(
            inArray(userTeams.teamId, dedupedTeamIds),
            eq(userTeams.isActive, true),
            eq(users.isActive, true)
          )
        ),
    ]);

    const membersByTeamId = new Map<number, number[]>();
    membershipRows.forEach((row) => {
      const list = membersByTeamId.get(row.teamId) ?? [];
      list.push(row.userId);
      membersByTeamId.set(row.teamId, list);
    });

    const allRecipients = new Set<number>();
    for (const teamRow of teamRows) {
      let recipientUserIds = membersByTeamId.get(teamRow.id) ?? [];
      recipientUserIds = await this.filterRecipientsByHistoryAudience(
        recipientUserIds,
        input.historyAudience ?? 'public',
        input.actorUserId
      );
      const teamLabel = teamRow.teamDisplayName ?? teamRow.teamName;
      const ministryLabel = teamRow.ministryDisplayName
        ? ` (${teamRow.ministryDisplayName})`
        : '';

      const created = await this.createEventWithRecipients({
        eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_SHARED_WITH_TEAM,
        entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
        entityId: activity.id,
        changeType: NOTIFICATION_CHANGE_TYPES.SHARED_WITH_UPDATED,
        summary: `Activity shared with your team${ministryLabel}: ${this.formatActivityLabel(activity)}`,
        details: {
          activityId: activity.id,
          displayId: activity.displayId,
          title: activity.title,
          teamId: teamRow.id,
          teamName: teamLabel,
          ministryName: teamRow.ministryDisplayName ?? null,
        },
        actorUserId: input.actorUserId,
        recipientUserIds,
      });

      created.forEach((userId) => allRecipients.add(userId));
    }

    return Array.from(allRecipients);
  }

  async notifyActivityUpdated(input: {
    activityId: number;
    actorUserId: number;
    changedFields: string[];
    historyAudience?: HistoryAudience;
  }): Promise<number[]> {
    if (input.changedFields.length === 0) {
      return [];
    }

    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const [adminUserIds, commsRows, flagRows] = await Promise.all([
      this.getAdminUserIds(),
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
        .select({ id: activityFlags.assigneeId })
        .from(activityFlags)
        .innerJoin(users, eq(users.id, activityFlags.assigneeId))
        .where(
          and(
            eq(activityFlags.activityId, input.activityId),
            eq(users.isActive, true)
          )
        ),
    ]);

    let recipientUserIds = [
      ...adminUserIds,
      ...commsRows.map((row) => row.id),
      ...flagRows.map((row) => row.id),
    ];

    recipientUserIds = await this.filterRecipientsByHistoryAudience(
      recipientUserIds,
      input.historyAudience ?? 'public',
      input.actorUserId
    );

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_UPDATED,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.UPDATED,
      summary: `Activity updated: ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        changedFields: input.changedFields,
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async notifyActivityStatusChangedToChanged(input: {
    activityId: number;
    actorUserId: number;
    historyAudience?: HistoryAudience;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const [adminUserIds, reviewerRoleRows] = await Promise.all([
      this.getAdminUserIds(),
      this.databaseService.db
        .select({ roleId: rolePermissions.roleId })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(permissions.id, rolePermissions.permissionId)
        )
        .where(
          and(
            eq(rolePermissions.isActive, true),
            eq(permissions.key, 'activities.review')
          )
        ),
    ]);

    const reviewerRoleIds = [
      ...new Set(
        reviewerRoleRows.map((row) => row.roleId).filter((id) => id > 0)
      ),
    ];

    let reviewerRows: Array<{ id: number }> = [];
    if (reviewerRoleIds.length > 0) {
      const [reviewerUserRoleRows, reviewerTeamRoleRows] = await Promise.all([
        this.databaseService.db
          .selectDistinct({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.isActive, true),
              inArray(users.roleId, reviewerRoleIds)
            )
          ),
        this.databaseService.db
          .selectDistinct({ id: users.id })
          .from(userTeams)
          .innerJoin(users, eq(users.id, userTeams.userId))
          .innerJoin(teams, eq(teams.id, userTeams.teamId))
          .where(
            and(
              eq(users.isActive, true),
              eq(userTeams.isActive, true),
              inArray(teams.roleId, reviewerRoleIds)
            )
          ),
      ]);

      reviewerRows = [...reviewerUserRoleRows, ...reviewerTeamRoleRows];
    }

    let recipientUserIds = [
      ...adminUserIds,
      ...reviewerRows.map((row) => row.id),
    ];

    recipientUserIds = await this.filterRecipientsByHistoryAudience(
      recipientUserIds,
      input.historyAudience ?? 'public',
      input.actorUserId
    );

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_STATUS_CHANGED,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.STATUS_CHANGED,
      summary: `Activity status changed to Changed: ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        status: 'changed',
      },
      actorUserId: input.actorUserId,
      recipientUserIds,
    });
  }

  async notifyActivityReminderPostDated(input: {
    activityId: number;
    actorUserId: number;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const [adminUserIds, commsRows] = await Promise.all([
      this.getAdminUserIds(),
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
    ]);

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_POST_DATED,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.REMINDER,
      summary: `Reminder: post-dated activity is incomplete: ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        reminderType: 'post_dated',
      },
      actorUserId: input.actorUserId,
      recipientUserIds: [
        activity.createdBy,
        activity.lastUpdatedBy,
        ...adminUserIds,
        ...commsRows.map((row) => row.id),
      ],
    });
  }

  async notifyActivityReminderDateStatusNotConfirmed(input: {
    activityId: number;
    actorUserId: number;
    leadDays: number;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const commsRows = await this.databaseService.db
      .select({ id: activityCommsContacts.userId })
      .from(activityCommsContacts)
      .innerJoin(users, eq(users.id, activityCommsContacts.userId))
      .where(
        and(
          eq(activityCommsContacts.activityId, input.activityId),
          eq(activityCommsContacts.isActive, true),
          eq(users.isActive, true)
        )
      );

    return this.createEventWithRecipients({
      eventType:
        NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.REMINDER,
      summary: `Reminder: date status not confirmed (${input.leadDays} day window): ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        reminderType: 'datestatus_not_confirmed',
        leadDays: input.leadDays,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: commsRows.map((row) => row.id),
    });
  }

  async notifyActivityReminderNullTime(input: {
    activityId: number;
    actorUserId: number;
    leadDays: number;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const commsRows = await this.databaseService.db
      .select({ id: activityCommsContacts.userId })
      .from(activityCommsContacts)
      .innerJoin(users, eq(users.id, activityCommsContacts.userId))
      .where(
        and(
          eq(activityCommsContacts.activityId, input.activityId),
          eq(activityCommsContacts.isActive, true),
          eq(users.isActive, true)
        )
      );

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_NULL_TIME,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.REMINDER,
      summary: `Reminder: activity time missing (${input.leadDays} day window): ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        reminderType: 'null_time',
        leadDays: input.leadDays,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: commsRows.map((row) => row.id),
    });
  }

  async notifyActivityReminderTimeStatusNotConfirmed(input: {
    activityId: number;
    actorUserId: number;
    leadDays: number;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const commsRows = await this.databaseService.db
      .select({ id: activityCommsContacts.userId })
      .from(activityCommsContacts)
      .innerJoin(users, eq(users.id, activityCommsContacts.userId))
      .where(
        and(
          eq(activityCommsContacts.activityId, input.activityId),
          eq(activityCommsContacts.isActive, true),
          eq(users.isActive, true)
        )
      );

    return this.createEventWithRecipients({
      eventType:
        NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.REMINDER,
      summary: `Reminder: time status not confirmed (${input.leadDays} day window): ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        reminderType: 'timestatus_not_confirmed',
        leadDays: input.leadDays,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: commsRows.map((row) => row.id),
    });
  }

  async notifyActivityReminderUpcoming(input: {
    activityId: number;
    actorUserId: number;
    leadDays: number;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const [commsRows, watchRows] = await Promise.all([
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
        .select({ id: userActivityFavourites.userId })
        .from(userActivityFavourites)
        .innerJoin(users, eq(users.id, userActivityFavourites.userId))
        .where(
          and(
            eq(userActivityFavourites.activityId, input.activityId),
            eq(users.isActive, true)
          )
        ),
    ]);

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_UPCOMING,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.REMINDER,
      summary: `Reminder: upcoming activity (${input.leadDays} day window): ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        reminderType: 'upcoming',
        leadDays: input.leadDays,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: [
        ...commsRows.map((row) => row.id),
        ...watchRows.map((row) => row.id),
      ],
    });
  }

  async notifyActivityReminderStale(input: {
    activityId: number;
    actorUserId: number;
    staleDays: number;
  }): Promise<number[]> {
    const activity = await this.resolveActivityIdentity(input.activityId);
    if (!activity) {
      return [];
    }

    const [adminUserIds, commsRows] = await Promise.all([
      this.getAdminUserIds(),
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
    ]);

    return this.createEventWithRecipients({
      eventType: NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_STALE,
      entityType: NOTIFICATION_ENTITY_TYPES.ACTIVITY,
      entityId: activity.id,
      changeType: NOTIFICATION_CHANGE_TYPES.REMINDER,
      summary: `Reminder: stale activity (${input.staleDays} day threshold): ${this.formatActivityLabel(activity)}`,
      details: {
        activityId: activity.id,
        displayId: activity.displayId,
        title: activity.title,
        reminderType: 'stale',
        staleDays: input.staleDays,
      },
      actorUserId: input.actorUserId,
      recipientUserIds: [...adminUserIds, ...commsRows.map((row) => row.id)],
    });
  }

  async notifyUserAddedToTeam(input: {
    userId: number;
    teamId: number;
    actorUserId: number;
    membershipRole: string;
  }): Promise<number[]> {
    const [[targetUser], [teamRow], ownerRows, adminUserIds] =
      await Promise.all([
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
        this.getAdminUserIds(),
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
    const recipientUserIds = [
      targetUser.id,
      ...ownerRows.map((r) => r.id),
      ...adminUserIds,
    ];

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
