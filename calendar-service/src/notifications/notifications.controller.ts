import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';
import {
  notificationListQuerySchema,
  notificationPreferencesUpdateSchema,
  notificationRecipientPatchSchema,
  type NotificationBulkActionResult,
  type NotificationListQuery,
  type NotificationPage,
  type NotificationPreferences,
  type NotificationPreferencesUpdate,
  type NotificationRecipientPatch,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  NotificationBulkActionResultResponseWrapperDto,
  NotificationPageResponseWrapperDto,
  NotificationPreferencesResponseWrapperDto,
  NotificationPreferencesUpdateDto,
  NotificationUpdatedResponseWrapperDto,
  UnreadNotificationCountResponseWrapperDto,
} from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApiZodQueries } from '../common/swagger/zod-query.openapi';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationsService } from './notifications.service';

class NotificationRecipientPatchDto extends createZodDto(
  notificationRecipientPatchSchema
) {}

@ApiTags('notifications')
@Controller('notifications')
@RequirePermission(PERMISSIONS.NOTIFICATIONS.VIEW)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationPreferencesService: NotificationPreferencesService
  ) {}

  @ApiOperation({
    summary: 'Get notification preferences for current user',
    description:
      'Returns the email master switch and per-category in-app/email settings. Categories default to enabled.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved',
    type: NotificationPreferencesResponseWrapperDto,
  })
  @Get('preferences')
  async getPreferences(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: true; data: NotificationPreferences }> {
    const data = await this.notificationPreferencesService.getForUser(user.id);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Update notification preferences for current user',
    description:
      'Updates the email master switch and/or the supplied categories. Omitted categories are unchanged.',
  })
  @ApiBody({ type: NotificationPreferencesUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated',
    type: NotificationPreferencesResponseWrapperDto,
  })
  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(notificationPreferencesUpdateSchema))
    body: NotificationPreferencesUpdate
  ): Promise<{ success: true; data: NotificationPreferences }> {
    const data = await this.notificationPreferencesService.updateForUser(
      user.id,
      body
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'List notifications for current user',
    description:
      'By default returns unread notifications. Pass includeRead=true to include read notifications. Dismissed notifications are excluded.',
  })
  @ApiZodQueries(notificationListQuerySchema)
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved',
    type: NotificationPageResponseWrapperDto,
  })
  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(notificationListQuerySchema))
    query: NotificationListQuery
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

  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications updated',
    type: NotificationBulkActionResultResponseWrapperDto,
  })
  @Post('read-all')
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
  @Post('dismiss-all')
  async dismissAll(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: true; data: NotificationBulkActionResult }> {
    const updatedCount = await this.notificationsService.dismissAll(user.id);
    return { success: true, data: { updatedCount } };
  }

  @ApiOperation({
    summary: 'Update a notification recipient (read or dismiss)',
  })
  @ApiParam({ name: 'recipientId', type: Number })
  @ApiBody({ type: NotificationRecipientPatchDto })
  @ApiResponse({
    status: 200,
    description: 'Notification updated',
    type: NotificationUpdatedResponseWrapperDto,
  })
  @Patch('recipients/:recipientId')
  async patchRecipient(
    @CurrentUser() user: AuthUser,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body(new ZodValidationPipe(notificationRecipientPatchSchema))
    body: NotificationRecipientPatch
  ): Promise<{ success: true; data: { updated: true } }> {
    if (body.read) {
      await this.notificationsService.markRead(recipientId, user.id);
    } else if (body.dismissed) {
      await this.notificationsService.dismiss(recipientId, user.id);
    }
    return { success: true, data: { updated: true } };
  }
}
