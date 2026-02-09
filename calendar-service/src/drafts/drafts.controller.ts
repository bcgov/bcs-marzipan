import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DraftsService } from './drafts.service';
import {
  SaveDraftDto,
  DraftResponseDto,
  DraftsListResponseDto,
} from './dto/drafts.dto';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';

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
      'Saves incomplete form data for later. Updates existing draft if one exists for the same user/form/entity combination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft saved successfully',
    type: DraftResponseDto,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
    description: 'User ID (temporary until authentication is implemented)',
  })
  @Post('save')
  async saveDraft(
    @Query('userId', ParsePositiveIntPipe) userId: number,
    @Body() saveDto: SaveDraftDto
  ): Promise<{ success: boolean; data: DraftResponseDto }> {
    try {
      this.logger.log(
        `Saving draft for user ${userId}, form ${saveDto.formType}`
      );
      const data = await this.draftsService.saveDraft(userId, saveDto);
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(
        `Failed to save draft for user ${userId}, form ${saveDto.formType}`,
        errorMessage
      );
      throw error;
    }
  }

  /**
   * Get a specific draft by form type and optional entity ID
   * GET /drafts?userId=1&formType=activity&entityId=123
   */
  @ApiOperation({
    summary: 'Get a specific draft',
    description: 'Retrieves a draft by form type and optional entity ID',
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
    name: 'userId',
    required: true,
    type: Number,
    description: 'User ID',
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
  @Get()
  async getDraft(
    @Query('userId', ParsePositiveIntPipe) userId: number,
    @Query('formType') formType: string,
    @Query('entityId', new ParseOptionalIntPipe()) entityId?: number
  ): Promise<{ success: boolean; data: DraftResponseDto | null }> {
    this.logger.log(
      `Getting draft for user ${userId}, form ${formType}, entity ${entityId}`
    );
    const data = await this.draftsService.getDraft(userId, formType, entityId);
    return { success: true, data };
  }

  /**
   * Get all drafts for a user
   * GET /drafts/list?userId=1
   */
  @ApiOperation({
    summary: 'List all drafts for a user',
    description: 'Retrieves all saved drafts for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'Drafts retrieved successfully',
    type: DraftsListResponseDto,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
    description: 'User ID',
  })
  @Get('list')
  async listDrafts(
    @Query('userId', ParsePositiveIntPipe) userId: number
  ): Promise<{ success: boolean; data: DraftsListResponseDto }> {
    this.logger.log(`Listing all drafts for user ${userId}`);
    const drafts = await this.draftsService.listUserDrafts(userId);
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
   * DELETE /drafts/:id?userId=1
   */
  @ApiOperation({
    summary: 'Delete a draft by ID',
    description: 'Deletes a specific draft. User must own the draft.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Draft ID',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
    description: 'User ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Draft deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Draft not found or does not belong to user',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraft(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParsePositiveIntPipe) userId: number
  ): Promise<void> {
    this.logger.log(`Deleting draft ${id} for user ${userId}`);
    await this.draftsService.deleteDraft(userId, id);
  }

  /**
   * Delete a draft by form type and entity ID
   * DELETE /drafts/by-form?userId=1&formType=activity&entityId=123
   */
  @ApiOperation({
    summary: 'Delete a draft by form type',
    description:
      'Deletes a draft by form type and optional entity ID. User must own the draft.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
    description: 'User ID',
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
  @Delete('by-form')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraftByForm(
    @Query('userId', ParsePositiveIntPipe) userId: number,
    @Query('formType') formType: string,
    @Query('entityId', new ParseOptionalIntPipe()) entityId?: number
  ): Promise<void> {
    this.logger.log(
      `Deleting draft for user ${userId}, form ${formType}, entity ${entityId}`
    );
    await this.draftsService.deleteDraftByForm(userId, formType, entityId);
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
