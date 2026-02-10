import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthUser } from '@corpcal/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import {
  RequireAnyPermission,
  RequirePermission,
} from '../policy/decorators/require-permission.decorator';
import { DraftsService } from './drafts.service';
import {
  DraftResponseDto,
  DraftsListResponseDto,
  SaveDraftDto,
} from './dto/drafts.dto';

@ApiTags('drafts')
@Controller('drafts')
export class DraftsController {
  private readonly logger = new AppLogger(DraftsController.name);

  constructor(private readonly draftsService: DraftsService) {}

  /**
   * Save or update a draft
   * POST /drafts/save
   */
  @ApiOperation({
    summary: 'Save or update a form draft',
    description:
      'Saves incomplete form data for later. The current user is inferred from the JWT. Updates existing draft if one exists for the same user/form/entity combination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft saved successfully',
    type: DraftResponseDto,
  })
  @RequireAnyPermission('drafts.create', 'drafts.edit')
  @Post('save')
  async saveDraft(
    @CurrentUser() user: AuthUser,
    @Body() saveDto: SaveDraftDto
  ): Promise<{ success: boolean; data: DraftResponseDto }> {
    try {
      this.logger.log(
        `Saving draft for user ${user.id}, form ${saveDto.formType}`
      );
      const data = await this.draftsService.saveDraft(user.id, saveDto);
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(
        `Failed to save draft for user ${user.id}, form ${saveDto.formType}`,
        errorMessage
      );
      throw error;
    }
  }

  /**
   * Get a specific draft by form type and optional entity ID
   * GET /drafts?formType=activity&entityId=123
   */
  @ApiOperation({
    summary: 'Get a specific draft',
    description:
      'Retrieves a draft by form type and optional entity ID. The current user is inferred from the JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft retrieved successfully',
    type: DraftResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Draft not found',
  })
  @ApiQuery({
    name: 'formType',
    required: true,
    type: String,
    description: 'Type of form (e.g., activity, event)',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: Number,
    description: 'Entity ID being edited (omit for new items)',
  })
  @RequirePermission('drafts.view')
  @Get()
  async getDraft(
    @CurrentUser() user: AuthUser,
    @Query('formType') formType: string,
    @Query('entityId', new ParseOptionalIntPipe()) entityId?: number
  ): Promise<{ success: boolean; data: DraftResponseDto | null }> {
    this.logger.log(
      `Getting draft for user ${user.id}, form ${formType}, entity ${entityId}`
    );
    const data = await this.draftsService.getDraft(user.id, formType, entityId);
    return { success: true, data };
  }

  /**
   * Get all drafts for the current user
   * GET /drafts/list
   */
  @ApiOperation({
    summary: 'List all drafts for the current user',
    description:
      'Retrieves all saved drafts for the authenticated user. The current user is inferred from the JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Drafts retrieved successfully',
    type: DraftsListResponseDto,
  })
  @RequirePermission('drafts.view')
  @Get('list')
  async listDrafts(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: DraftsListResponseDto }> {
    this.logger.log(`Listing all drafts for user ${user.id}`);
    const drafts = await this.draftsService.listUserDrafts(user.id);
    return {
      success: true,
      data: {
        drafts,
        count: drafts.length,
      },
    };
  }

  /**
   * Delete a draft by ID
   * DELETE /drafts/:id
   */
  @ApiOperation({
    summary: 'Delete a draft by ID',
    description:
      'Deletes a specific draft. The current user is inferred from the JWT; only the owner can delete.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Draft ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Draft deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Draft not found or does not belong to user',
  })
  @RequirePermission('drafts.delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraft(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    this.logger.log(`Deleting draft ${id} for user ${user.id}`);
    await this.draftsService.deleteDraft(user.id, id);
  }

  /**
   * Delete a draft by form type and entity ID
   * DELETE /drafts/by-form?formType=activity&entityId=123
   */
  @ApiOperation({
    summary: 'Delete a draft by form type',
    description:
      'Deletes a draft by form type and optional entity ID. The current user is inferred from the JWT; only the owner can delete.',
  })
  @ApiQuery({
    name: 'formType',
    required: true,
    type: String,
    description: 'Type of form',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: Number,
    description: 'Entity ID (omit for new items)',
  })
  @ApiResponse({
    status: 204,
    description: 'Draft deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Draft not found',
  })
  @RequirePermission('drafts.delete')
  @Delete('by-form')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraftByForm(
    @CurrentUser() user: AuthUser,
    @Query('formType') formType: string,
    @Query('entityId', new ParseOptionalIntPipe()) entityId?: number
  ): Promise<void> {
    this.logger.log(
      `Deleting draft for user ${user.id}, form ${formType}, entity ${entityId}`
    );
    await this.draftsService.deleteDraftByForm(user.id, formType, entityId);
  }

  /**
   * Cleanup expired drafts (admin endpoint)
   * POST /drafts/cleanup
   */
  @ApiOperation({
    summary: 'Cleanup expired drafts',
    description:
      'Administrative endpoint to clean up expired drafts. Should be called by a scheduled job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed',
  })
  @RequirePermission('drafts.delete')
  @Post('cleanup')
  async cleanupExpiredDrafts(): Promise<{
    success: boolean;
    deletedCount: number;
  }> {
    this.logger.log('Running manual cleanup of expired drafts');
    const deletedCount = await this.draftsService.cleanupExpiredDrafts();
    return { success: true, deletedCount };
  }
}
