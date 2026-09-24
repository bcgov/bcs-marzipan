import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';
import {
  notificationListQuerySchema,
  type NotificationBulkActionResult,
  type NotificationPage,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  NotificationBulkActionResultResponseWrapperDto,
  NotificationPageResponseWrapperDto,
  NotificationUpdatedResponseWrapperDto,
  UnreadNotificationCountResponseWrapperDto,
} from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@RequirePermission(PERMISSIONS.NOTIFICATIONS.VIEW)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: 'List notifications for current user',
    description:
      'By default returns unread notifications. Pass includeRead=true to include read notifications. Dismissed notifications are excluded.',
  })
  @ApiQuery({
    name: 'includeRead',
    required: false,
    type: Boolean,
    description: 'When true, include read notifications (default: false)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Page size (default: 20, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved',
    type: NotificationPageResponseWrapperDto,
  })
  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(notificationListQuerySchema))
    query: { includeRead?: boolean; page?: number; pageSize?: number }
  ): Promise<{ success: true; data: NotificationPage }> {
    const data = await this.notificationsService.listForUser(user.id, {
      includeRead: query.includeRead ?? false,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved',
    type: UnreadNotificationCountResponseWrapperDto,
  })
  @Get('unread-count')
  async unreadCount(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: true; data: { count: number } }> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { success: true, data: { count } };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'recipientId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Notification updated',
    type: NotificationUpdatedResponseWrapperDto,
  })
  @Patch(':recipientId/read')
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('recipientId', ParseIntPipe) recipientId: number
  ): Promise<{ success: true; data: { updated: true } }> {
    await this.notificationsService.markRead(recipientId, user.id);
    return { success: true, data: { updated: true } };
  }

  @ApiOperation({ summary: 'Dismiss notification' })
  @ApiParam({ name: 'recipientId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Notification dismissed',
    type: NotificationUpdatedResponseWrapperDto,
  })
  @Patch(':recipientId/dismiss')
  async dismiss(
    @CurrentUser() user: AuthUser,
    @Param('recipientId', ParseIntPipe) recipientId: number
  ): Promise<{ success: true; data: { updated: true } }> {
    await this.notificationsService.dismiss(recipientId, user.id);
    return { success: true, data: { updated: true } };
  }

  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications updated',
    type: NotificationBulkActionResultResponseWrapperDto,
  })
  @Patch('read-all')
  async markAllRead(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: true; data: NotificationBulkActionResult }> {
    const updatedCount = await this.notificationsService.markAllRead(user.id);
    return { success: true, data: { updatedCount } };
  }

  @ApiOperation({ summary: 'Dismiss all non-dismissed notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications dismissed',
    type: NotificationBulkActionResultResponseWrapperDto,
  })
  @Patch('dismiss-all')
  async dismissAll(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: true; data: NotificationBulkActionResult }> {
    const updatedCount = await this.notificationsService.dismissAll(user.id);
    return { success: true, data: { updatedCount } };
  }
}
